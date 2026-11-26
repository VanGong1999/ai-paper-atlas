async (page) => {
  const failures = []
  const check = (condition, message) => { if (!condition) failures.push(message) }
  const chapter = name => page.locator('.lesson-nav').getByRole('button', { name }).click()
  const step = index => page.locator('.steps button').nth(index).click()
  const tooltip = page.getByRole('tooltip')
  const waitForContent = async content => {
    await tooltip.filter({ hasText: content }).waitFor({ state: 'visible', timeout: 2000 })
    const text = await tooltip.innerText()
    check(text.includes('论文事实'), 'Tooltip is missing paper fact')
    check(text.includes('教学解释'), 'Tooltip is missing teaching explanation')
    check(text.includes('PDF p.'), 'Tooltip is missing PDF citation')
    return text
  }

  page.setDefaultTimeout(3000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://127.0.0.1:5178/papers/attention')

  await chapter('编码器与解码器')
  const linearFlow = page.locator('[data-explainable-kind="data-flow"][aria-label="解码器到词表线性投影"]')
  const outputSoftmaxFlow = page.locator('[data-explainable-kind="data-flow"][aria-label="线性投影到输出 Softmax"]')
  check(await linearFlow.count() === 1, 'Decoder-to-linear flow target is missing')
  check(await outputSoftmaxFlow.count() === 1, 'Linear-to-output-Softmax flow target is missing')
  check(await linearFlow.getAttribute('aria-label') === '解码器到词表线性投影', 'Decoder-to-linear flow label is wrong')
  check(await outputSoftmaxFlow.getAttribute('aria-label') === '线性投影到输出 Softmax', 'Output Softmax flow label is wrong')
  check(await linearFlow.getAttribute('aria-hidden') !== 'true', 'Linear flow is aria-hidden')
  await linearFlow.hover()
  await tooltip.waitFor({ state: 'visible' })
  check((await tooltip.innerText()).includes('输出线性层'), 'Linear flow hover opened the wrong explanation')
  check(await outputSoftmaxFlow.getAttribute('aria-hidden') !== 'true', 'Output Softmax flow is aria-hidden')
  await outputSoftmaxFlow.focus()
  await tooltip.waitFor({ state: 'visible' })
  await page.keyboard.press('Enter')
  check((await page.locator('.selected-explanation').innerText()).includes('输出 Softmax'), 'Output Softmax focus did not select its explanation')

  await chapter('缩放点积注意力')
  await step(1)
  const attentionSoftmax = page.locator('[data-explainable="attention-softmax"]')
  const attentionPipeline = attentionSoftmax.filter({ has: page.locator('rect') }).first()
  const attentionFormula = page.locator('.formula-box [data-explainable="attention-softmax"]')
  check(await attentionSoftmax.count() === 3, `Expected three attention Softmax targets, got ${await attentionSoftmax.count()}`)
  check(await attentionFormula.count() === 1, 'Inline attention Softmax target is missing')
  check(await page.locator('[data-explainable="weights"]').count() === 0, 'Attention Softmax reused matrix-cell identity')
  await attentionPipeline.hover()
  await waitForContent('注意力 Softmax')
  check((await tooltip.innerText()).includes('归一化'), 'Attention Softmax tooltip does not describe score normalization')
  await attentionFormula.focus()
  await waitForContent('注意力 Softmax')

  await page.setViewportSize({ width: 320, height: 760 })
  await attentionPipeline.hover()
  const pipelineTooltipBox = await tooltip.boundingBox()
  check(pipelineTooltipBox.x >= 0 && pipelineTooltipBox.y >= 0 && pipelineTooltipBox.x + pipelineTooltipBox.width <= 320 && pipelineTooltipBox.y + pipelineTooltipBox.height <= 760,
    'Attention Softmax tooltip escaped 320x760 viewport')
  await waitForContent('注意力 Softmax')

  await attentionFormula.evaluate(element => {
    element.style.setProperty('position', 'fixed', 'important')
    element.style.zIndex = '100'
  })
  for (const [left, top] of [[3, 3], [291, 3], [3, 726], [291, 726]]) {
    await attentionFormula.evaluate((element, coordinates) => {
      element.style.left = `${coordinates[0]}px`
      element.style.top = `${coordinates[1]}px`
      element.style.width = '24px'
      element.style.height = '24px'
    }, [left, top])
    await page.mouse.move(left + 12, top + 12)
    await waitForContent('注意力 Softmax')
    const triggerBox = await attentionFormula.boundingBox()
    const tooltipBox = await tooltip.boundingBox()
    const overlaps = tooltipBox.x < triggerBox.x + triggerBox.width && tooltipBox.x + tooltipBox.width > triggerBox.x &&
      tooltipBox.y < triggerBox.y + triggerBox.height && tooltipBox.y + tooltipBox.height > triggerBox.y
    check(!overlaps, `Full tooltip overlaps trigger at ${left},${top}`)
    check(tooltipBox.x >= 0 && tooltipBox.y >= 0 && tooltipBox.x + tooltipBox.width <= 320 && tooltipBox.y + tooltipBox.height <= 760,
      `Full tooltip escaped viewport at ${left},${top}`)
    await page.keyboard.press('Escape')
    await page.mouse.move(160, 600)
    await page.keyboard.press('Escape')
    await tooltip.waitFor({ state: 'hidden' })
  }

  if (failures.length) throw new Error(failures.join(' | '))
  return 'Passed output data-flow targets, distinct attention/output Softmax identities, full sourced tooltip content, and 320x760 placement.'
}
