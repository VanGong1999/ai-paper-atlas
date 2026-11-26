async (page) => {
  const failures = []
  const check = (condition, message) => { if (!condition) failures.push(message) }
  const url = 'http://127.0.0.1:5178/papers/attention'
  const chapter = name => page.locator('.lesson-nav').getByRole('button', { name }).click()
  const step = index => page.locator('.steps button').nth(index).click()
  const tooltip = page.getByRole('tooltip')

  page.setDefaultTimeout(3000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(url)

  await chapter('编码器与解码器')
  const flows = page.locator('[data-explainable-kind="data-flow"]')
  check(await flows.count() >= 7, `Expected explainable data-flow targets, got ${await flows.count()}`)
  check(await flows.evaluateAll(elements => elements.every(element => element.getAttribute('aria-hidden') !== 'true')), 'Data-flow targets are aria-hidden')
  const crossFlow = page.locator('[data-explainable="cross"][data-explainable-kind="data-flow"]')
  const accessibleFlow = page.locator('[data-explainable-kind="data-flow"][aria-label="编码器到解码器的跨序列连接"]')
  check(await accessibleFlow.count() === 1, 'Missing encoder-to-decoder accessible flow')
  await accessibleFlow.hover()
  await tooltip.filter({ hasText: '编码器—解码器注意力' }).waitFor({ state: 'visible' })
  check((await tooltip.innerText()).includes('论文事实'), 'Data-flow tooltip has no paper fact')
  await accessibleFlow.focus()
  await page.keyboard.press('Enter')
  check((await page.locator('.selected-explanation').innerText()).includes('编码器—解码器注意力'), 'Focused flow did not select its source explanation')
  check(await crossFlow.count() === 1, 'Cross flow hook is missing')

  await chapter('缩放点积注意力')
  await step(1)
  const pipelineSoftmax = page.locator('[data-explainable="softmax"]').first()
  const formulaSoftmax = page.locator('.formula-box [data-explainable="softmax"]')
  check(await pipelineSoftmax.count() === 1, 'Pipeline Softmax hook is missing')
  check(await formulaSoftmax.count() === 1, 'Formula Softmax hook is missing')
  await pipelineSoftmax.hover()
  await tooltip.filter({ hasText: '输出 Softmax' }).waitFor({ state: 'visible' })
  check(!(await tooltip.innerText()).includes('注意力矩阵单元'), 'Pipeline Softmax opened the matrix-cell explanation')
  await formulaSoftmax.focus()
  await tooltip.filter({ hasText: '输出 Softmax' }).waitFor({ state: 'visible' })
  check((await tooltip.innerText()).includes('输出 Softmax'), 'Formula Softmax did not retain its operation explanation')
  check(await page.locator('[data-explainable="weights"]').count() === 0, 'Softmax step exposed a weights identity')

  await page.setViewportSize({ width: 320, height: 760 })
  const trigger = page.locator('.detail-panel [data-explainable-kind="formula-variable"]').first()
  await trigger.evaluate(element => {
    element.style.setProperty('position', 'fixed', 'important')
    element.style.zIndex = '100'
  })
  for (const [left, top] of [[3, 3], [291, 3], [3, 726], [291, 726]]) {
    await trigger.evaluate((element, coordinates) => {
      element.style.left = `${coordinates[0]}px`
      element.style.top = `${coordinates[1]}px`
      element.style.width = '24px'
      element.style.height = '24px'
    }, [left, top])
    await page.mouse.move(left + 12, top + 12)
    await tooltip.waitFor({ state: 'visible' })
    const triggerBox = await trigger.boundingBox()
    const tooltipBox = await tooltip.boundingBox()
    check(tooltipBox.x >= 0 && tooltipBox.y >= 0 && tooltipBox.x + tooltipBox.width <= 320 && tooltipBox.y + tooltipBox.height <= 760,
      `Tooltip escaped viewport at ${left},${top}`)
    const overlaps = tooltipBox.x < triggerBox.x + triggerBox.width && tooltipBox.x + tooltipBox.width > triggerBox.x &&
      tooltipBox.y < triggerBox.y + triggerBox.height && tooltipBox.y + tooltipBox.height > triggerBox.y
    check(!overlaps, `Tooltip overlaps its trigger at ${left},${top}`)
    await page.mouse.move(160, 600)
    await tooltip.waitFor({ state: 'hidden' })
  }

  if (failures.length) throw new Error(failures.join(' | '))
  return 'Passed explainable architecture flows, distinct Softmax identity, and 320px trigger separation.'
}
