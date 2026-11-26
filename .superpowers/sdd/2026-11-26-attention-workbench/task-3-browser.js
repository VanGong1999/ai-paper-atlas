async (page) => {
  const url = 'http://127.0.0.1:5178/papers/attention'
  const failures = []
  const consoleErrors = []
  page.on('pageerror', error => consoleErrors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) consoleErrors.push(message.text())
  })
  const check = (ok, message) => { if (!ok) throw new Error(message) }
  const probe = async (name, run) => {
    try { await run() } catch (error) { failures.push(name + ': ' + error.message.split('\n')[0]) }
  }
  const chapter = name => page.locator('.lesson-nav').getByRole('button', { name }).click()
  const step = index => page.locator('.steps button').nth(index).click()
  const stage = page.locator('.stage-canvas')
  const tip = page.getByRole('tooltip')
  const hook = (kind, id) => stage.locator('[data-explainable-kind="' + kind + '"]' + (id ? '[data-explainable="' + id + '"]' : ''))
  const visibleTip = async (text) => {
    if (text) await tip.filter({ hasText: text }).waitFor({ state: 'visible', timeout: 1500 })
    await tip.waitFor({ state: 'visible', timeout: 1500 })
    check(await tip.count() === 1, 'Expected exactly one tooltip')
    check(/论文事实|论文原意/.test(await tip.innerText()), 'Missing sourced paper facts')
    return tip
  }
  page.setDefaultTimeout(2500)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(url)

  await probe('architecture', async () => {
    await chapter('编码器与解码器')
    for (const id of ['encoder', 'decoder', 'residual', 'ffn', 'mask', 'cross', 'linear', 'softmax']) {
      check(await hook('architecture-node', id).count() > 0, 'Missing node ' + id)
    }
    const target = hook('architecture-node', 'linear')
    await target.hover()
    check((await (await visibleTip()).innerText()).includes('输出线性层'), 'Wrong hover content')
    check(await target.getAttribute('aria-describedby') === await tip.getAttribute('id'), 'Missing tooltip association')
    await page.mouse.move(0, 0)
    await tip.waitFor({ state: 'hidden', timeout: 1500 })
    await target.focus()
    await page.keyboard.press('Enter')
    check((await page.locator('.detail-panel').innerText()).includes('输出线性层'), 'Node activation did not update the details')
    await page.keyboard.press('Escape')
    await tip.waitFor({ state: 'hidden', timeout: 1500 })
  })

  await probe('Q/K/V and keyboard focus', async () => {
    await chapter('缩放点积注意力')
    for (const id of ['query', 'key', 'value']) check(await hook('qkv', id).count() === 1, 'Missing ' + id)
    await page.getByRole('button', { name: '放大', exact: true }).focus()
    await page.keyboard.press('Tab')
    check(await hook('qkv', 'query').evaluate(el => el === document.activeElement), 'Tab did not reach Q')
    await visibleTip()
    await page.keyboard.press('Tab')
    check(await hook('qkv', 'key').evaluate(el => el === document.activeElement), 'Tab did not reach K')
    check((await (await visibleTip('K · 键')).innerText()).includes('K · 键'), 'Tooltip did not follow keyboard focus')
  })

  await probe('formula variables', async () => {
    await chapter('缩放点积注意力')
    await step(1)
    check(await hook('formula-variable').count() >= 5, 'Missing per-variable hooks')
    await hook('formula-variable', 'scale').last().hover()
    check((await (await visibleTip()).innerText()).includes('dₖ'), 'Missing formula variable content')
  })

  await probe('matrix cells', async () => {
    await chapter('缩放点积注意力')
    await step(2)
    const cells = hook('matrix-cell')
    check(await cells.count() === 16, 'Expected sixteen cell hooks')
    check((await stage.innerText()).includes('教学示意'), 'Missing teaching label')
    await cells.nth(5).focus()
    check((await (await visibleTip('0.55')).innerText()).includes('0.55'), 'Missing cell weight in focused tooltip')
    await page.keyboard.press('Space')
    check((await stage.locator('.heatmap-panel p').innerText()).includes('行和为 1'), 'Missing weight aggregation')
    check((await stage.locator('.heat-aggregation').innerText()).includes('0.55 V(animal)'), 'Missing weighted value in the aggregation')
    check(await stage.locator('[data-matrix-band="row"], [data-matrix-band="both"]').count() === 5, 'Query row is not highlighted')
    check(await stage.locator('[data-matrix-band="column"], [data-matrix-band="both"]').count() === 5, 'Key column is not highlighted')
    await page.keyboard.press('Escape')
  })

  await probe('multi-head and comparison table', async () => {
    await chapter('多头注意力')
    check(await hook('attention-head', 'heads').count() === 8, 'Expected eight explainable heads')
    await hook('attention-head', 'heads').nth(3).hover()
    check((await (await visibleTip('64')).innerText()).includes('64'), 'Missing per-head dimensions')
    await chapter('引言与背景')
    check(await hook('table-cell', 'complexity').count() === 12, 'Missing Table 1 cell hooks')
    const convolutionBar = stage.locator('.comparison-bar').last()
    const serialWidth = await convolutionBar.getAttribute('width')
    await page.getByRole('button', { name: '最大路径长度', exact: true }).click()
    check(await convolutionBar.getAttribute('width') !== serialWidth, 'Comparison bar did not update')
    check(await page.getByRole('button', { name: '最大路径长度', exact: true }).getAttribute('aria-pressed') === 'true', 'Metric switch failed')
    await hook('table-cell').last().focus()
    check((await (await visibleTip('O(n/r)')).innerText()).includes('O(n/r)'), 'Missing Table 1 value')
  })

  await probe('position curves', async () => {
    await chapter('位置编码')
    const points = hook('curve-point', 'position')
    check(await points.count() >= 8, 'Missing curve point hooks')
    const curve = stage.locator('[data-position-curve="sin"]')
    const slider = page.getByRole('slider', { name: '位置 pos' })
    const chartBounds = await stage.locator('svg').boundingBox()
    const sliderBounds = await slider.boundingBox()
    check(sliderBounds.y >= chartBounds.y + chartBounds.height, 'Position controls cover the curve chart')
    const start = await curve.getAttribute('d')
    await page.getByRole('slider', { name: '维度对 i' }).press('End')
    check(start !== await curve.getAttribute('d'), 'Dimension did not update the curve')
    await page.getByRole('slider', { name: '位置 pos' }).press('End')
    await points.last().focus()
    check((await (await visibleTip('≈')).innerText()).includes('≈'), 'Missing value substitution in point overlay')
  })

  await probe('viewport edges and stage pan', async () => {
    await page.setViewportSize({ width: 320, height: 760 })
    await chapter('缩放点积注意力')
    await step(1)
    const variable = page.locator('.detail-panel [data-explainable-kind="formula-variable"]').first()
    check(await variable.count() === 1, 'Missing inline formula target')
    await variable.evaluate(el => {
      el.style.setProperty('position', 'fixed', 'important')
      el.style.zIndex = '100'
    })
    for (const [x, y] of [[3, 3], [291, 3], [3, 726], [291, 726]]) {
      await variable.evaluate((el, [left, top]) => Object.assign(el.style, { left: left + 'px', top: top + 'px', width: '24px', height: '24px' }), [x, y])
      await page.mouse.move(x + 12, y + 12)
      const box = await (await visibleTip()).boundingBox()
      check(box.x >= 0 && box.y >= 0 && box.x + box.width <= 320 && box.y + box.height <= 760, 'Tooltip escaped viewport at ' + x + ',' + y)
      check(x < 20 ? box.x >= x + 12 : box.x + box.width <= x + 12, 'Tooltip failed to flip horizontally')
      check(y < 20 ? box.y >= y + 12 : box.y + box.height <= y + 12, 'Tooltip failed to flip vertically')
      await page.mouse.move(160, 600)
      await tip.waitFor({ state: 'hidden', timeout: 1500 })
    }
    await page.reload()
    await chapter('编码器与解码器')
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: '放大', exact: true }).click()
    const node = hook('architecture-node', 'linear')
    await node.scrollIntoViewIfNeeded()
    await stage.evaluate(el => { el.scrollLeft = el.scrollWidth })
    check(await stage.evaluate(el => el.scrollLeft > 0), 'Zoom did not produce pannable content')
    await node.hover()
    const box = await (await visibleTip()).boundingBox()
    const bounds = await stage.boundingBox()
    check(box.x >= bounds.x && box.x + box.width <= bounds.x + bounds.width &&
      box.y >= Math.max(0, bounds.y) && box.y + box.height <= Math.min(760, bounds.y + bounds.height), 'Panned tooltip escaped stage')
    check(await page.evaluate(() => document.documentElement.scrollWidth === 320), 'Zoom caused document overflow')
  })

  await probe('playback and reduced motion', async () => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.reload()
    await chapter('编码器与解码器')
    await step(1)
    await page.clock.install()
    const motion = stage.locator('.stage-flow').first()
    const animation = () => motion.evaluate(el => [getComputedStyle(el).animationName, getComputedStyle(el).animationPlayState])
    await page.getByRole('button', { name: '播放', exact: true }).click()
    check((await animation())[1] === 'running', 'Flow did not play')
    await page.clock.fastForward(4100)
    const beforeReplay = (await animation())[0]
    await page.getByRole('button', { name: '重放', exact: true }).click()
    check((await animation())[0] !== beforeReplay, 'Replay did not restart flow animation')
    await page.clock.fastForward(150)
    check(await page.locator('.steps button').first().getAttribute('aria-current') === 'step', 'Replay reused prior interval')
    await page.getByRole('button', { name: '暂停', exact: true }).click()
    check((await animation())[1] === 'paused', 'Flow did not pause')
    await page.clock.fastForward(4300)
    check(await page.locator('.steps button').first().getAttribute('aria-current') === 'step', 'Paused step advanced')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: '播放', exact: true }).click()
    check((await animation())[0] === 'none', 'Reduced motion did not stop animated flow')
    await page.clock.fastForward(4300)
    check(await page.locator('.steps button').nth(1).getAttribute('aria-current') === 'step', 'Reduced motion broke playback controls')
    await page.getByRole('button', { name: '暂停', exact: true }).click()
  })

  if (consoleErrors.length) failures.push(...consoleErrors)
  if (failures.length) throw new Error(failures.join(' | '))
  return 'Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion.'
}
