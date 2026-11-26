async page => {
  const failures = []
  const passed = []
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const probe = async (name, fn) => {
    try { await fn(); passed.push(name) } catch (error) { failures.push(name + ': ' + error.message) }
    await page.keyboard.press('Escape')
  }
  const chapter = name => page.locator('.lesson-nav').getByRole('button', { name }).click()
  const stage = page.locator('.stage-canvas')
  const selected = page.locator('.selected-explanation')
  const tip = page.getByRole('tooltip')
  const tab = name => page.getByRole('tab', { name, exact: true })
  const focusTip = async target => {
    await page.mouse.move(0, 0)
    await target.focus()
    await page.waitForFunction(() => {
      const tip = document.querySelector('[role="tooltip"]')
      return tip && tip.id === document.activeElement?.getAttribute('aria-describedby') && tip.getBoundingClientRect().height > 0
    })
  }
  page.setDefaultTimeout(3000)
  const screens = [
    ['Softmax', 390, 844, async () => {
      await chapter('缩放点积注意力')
      await page.locator('.steps button').nth(1).click()
      return stage.locator('[data-explainable="attention-softmax"][data-explainable-kind="stage-node"]')
    }],
    ['Head 1', 390, 844, async () => {
      await chapter('多头注意力')
      return stage.getByRole('button', { name: 'Head 1', exact: true })
    }],
    ['Softmax', 1024, 184, async () => {
      await chapter('缩放点积注意力')
      return stage.locator('[data-explainable="attention-softmax"][data-explainable-kind="stage-node"]')
    }],
    ['Figure 4', 1024, 184, async () => {
      await tab('Figures').click()
      await page.getByLabel('图表章节').selectOption('appendix')
      return page.locator('[data-paper-figure="figure-4"] [data-explainable-kind="figure-title"]')
    }],
  ]
  for (const [name, width, height, find] of screens) {
    await probe(name + ' keyboard reading at ' + width + 'x' + height, async () => {
      await page.setViewportSize({ width, height })
      const target = await find()
      await target.evaluate(el => el.scrollIntoView({ block: 'center' }))
      await focusTip(target)
      const initialPage = await page.evaluate(() => window.scrollY)
      const contains = async selector => tip.evaluate((el, selector) => {
        const line = el.querySelector(selector).getBoundingClientRect()
        const rect = el.getBoundingClientRect()
        return line.top >= rect.top && line.bottom <= rect.bottom && rect.top >= 0 && rect.bottom <= innerHeight
      }, selector)
      for (const selector of ['p:has(strong):not(.tip-example, .tip-teaching)', '.tip-teaching', 'small']) {
        let visible = await contains(selector)
        for (let i = 0; !visible && i < 80; i++) {
          const before = await tip.evaluate(el => el.scrollTop)
          await page.keyboard.press('ArrowDown')
          visible = await contains(selector)
          if (await tip.evaluate(el => el.scrollTop) === before) break
        }
        check(visible, 'keyboard cannot expose ' + selector)
      }
      await page.keyboard.press('Home')
      check(await tip.evaluate(el => el.scrollTop === 0), 'Home failed')
      await page.keyboard.press('PageDown')
      check(await tip.evaluate(el => el.scrollHeight <= el.clientHeight || el.scrollTop > 0), 'PageDown failed')
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'document overflow')
      check(await page.evaluate(() => window.scrollY) === initialPage, 'reading keys scrolled page')
      await page.keyboard.press('Tab')
      check(!await target.evaluate(el => document.activeElement === el), 'Tab trapped focus')
    })
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await tab('Learn').click()
  await probe('heatmap mode roundtrip', async () => {
    await chapter('缩放点积注意力')
    await page.locator('.steps button').nth(2).click()
    const cell = stage.locator('[data-matrix-index="6"]')
    await cell.press('Space')
    check((await selected.innerText()).includes('animal → ate：0.20'), 'initial selection missing')
    await tab('Figures').click()
    await tab('Learn').click()
    const pressed = await cell.getAttribute('aria-pressed') === 'true'
    check(pressed ? (await selected.innerText()).includes('animal → ate：0.20') : await selected.count() === 0, 'heatmap selection mismatch')
  })
  await probe('position dimension change', async () => {
    await chapter('位置编码')
    const point = stage.getByRole('button', { name: 'sin · pos 16 · 第 64 维', exact: true })
    await point.press('Enter')
    check((await selected.innerText()).includes('PE(16, 64)'), 'missing original formula')
    await stage.getByRole('slider', { name: '维度对 i' }).press('ArrowRight')
    check(await selected.count() === 0 || (await selected.innerText()).includes('PE(16, 66)'), 'stale dimension')
    const updated = stage.getByRole('button', { name: 'sin · pos 16 · 第 66 维', exact: true })
    check(await updated.getAttribute('aria-pressed') === 'true', 'position changed with dimension')
    await updated.press('Enter')
    check((await selected.innerText()).includes(Math.sin(16 / 10000 ** (66 / 512)).toFixed(4)), 'wrong substitution')
  })

  for (const [lesson, label, x, y, pageNumber] of [
    ['缩放点积注意力', '缩放分数 → Softmax', 318, 87, 4],
    ['多头注意力', 'Head 4 → Concat', 369, 161, 5],
  ]) {
    await probe(label + ' hit, hover and keyboard', async () => {
      await chapter(lesson)
      const svg = stage.locator('svg').first()
      await svg.scrollIntoViewIfNeeded()
      await page.mouse.move(0, 0)
      await tip.waitFor({ state: 'hidden' })
      const hits = await svg.locator('[data-explainable-kind="data-flow"]').evaluateAll(targets => targets.map(target => {
        const path = target.querySelector('.stage-flow-hit')
        const accessible = Array.from({ length: 19 }, (_, i) => (i + 1) / 20).some(fraction => {
          const p = path.getPointAtLength(path.getTotalLength() * fraction).matrixTransform(path.getScreenCTM())
          return target.contains(document.elementFromPoint(p.x, p.y))
        })
        return { label: target.getAttribute('aria-label'), accessible }
      }))
      check(hits.length === (pageNumber === 4 ? 5 : 20), 'flow coverage')
      check(hits.every(hit => hit.accessible), 'unreachable paths ' + hits.filter(hit => !hit.accessible).map(hit => hit.label))
      const screen = await svg.evaluate((el, [x, y]) => {
        const p = new DOMPoint(x, y).matrixTransform(el.getScreenCTM())
        return [p.x, p.y]
      }, [x, y])
      await page.mouse.move(...screen)
      const owner = stage.getByRole('button', { name: label, exact: true })
      check(await owner.count() === 1, 'missing explainable path')
      await page.waitForFunction(([x, y]) => document.elementFromPoint(x, y)?.closest('[aria-describedby]')?.getAttribute('aria-describedby') === document.querySelector('[role="tooltip"]')?.id, screen)
      check(await owner.getAttribute('aria-describedby') === await tip.getAttribute('id'), 'wrong path at hit point')
      await focusTip(owner)
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      check(await owner.evaluate(el => el === document.activeElement), 'Tab skipped path')
      await page.keyboard.press('Enter')
      check((await selected.innerText()).includes(label) && (await selected.innerText()).includes('p. ' + pageNumber), 'path selection lacks scoped citation')
    })
  }
  await probe('training schedule milestones', async () => {
    await chapter('训练与正则化')
    const stageText = await stage.innerText()
    for (const metric of ['8 × P100', '0.4 秒/步', '1.0 秒/步', '25000']) {
      check(stageText.includes(metric), 'missing training metric ' + metric)
    }
    check(await stage.locator('.source-badge[href$="#page=7"]').count() === 2, 'missing schedule sources')
    const nodes = stage.locator('[data-explainable-kind="training-milestone"]')
    check(await nodes.count() === 3, 'missing warmup and run endpoints')
    for (const [i, step, marker, source] of [[0, 4000, '预热', '5.3'], [1, 100000, '12 小时', '5.2'], [2, 300000, '3.5 天', '5.2']]) {
      const node = nodes.nth(i)
      await focusTip(node)
      check((await tip.innerText()).includes(marker), 'missing timeline explanation')
      await node.press('Enter')
      check(await node.getAttribute('aria-pressed') === 'true', 'inactive milestone')
      const readout = await stage.locator('output').innerText()
      const factor = Math.min(step * 4000 ** -1.5, step ** -0.5)
      check(readout.includes(String(step)) && readout.includes(factor.toFixed(6)), 'schedule readout ' + readout)
      const rates = await stage.locator('.training-rates').innerText()
      check(rates.includes((factor / Math.sqrt(1024)).toExponential(3)), 'big learning rate')
      if (step <= 100000) check(rates.includes((factor / Math.sqrt(512)).toExponential(3)), 'base learning rate')
      else check(!rates.includes('d_model = 512'), 'base extrapolated past the end of training')
      check((await selected.innerText()).includes(source) && (await selected.innerText()).includes('p. 7'), 'milestone source')
    }
    const slider = stage.getByRole('slider', { name: '训练步数' })
    await slider.press('Home')
    check((await stage.locator('output').innerText()).includes((4000 ** -1.5).toFixed(6)), 'pre-warmup factor')
    check(await selected.count() === 0 && await stage.locator('[data-explainable-kind="training-milestone"][aria-pressed="true"]').count() === 0, 'stale milestone')
  })
  await probe('Table 3 metric differences', async () => {
    await tab('Figures').click()
    await page.getByLabel('图表章节').selectOption('sec6-2')
    const table = page.locator('[data-paper-figure="table-3"]')
    await table.getByRole('tab', { name: '重绘' }).click()
    for (const [name, expected] of [
      ['(A) · BLEU (dev) · 24.9', '24.9 − 25.8 = -0.9'],
      ['(E) · PPL (dev) · 4.92', '4.92 − 4.92 = 0.00'],
      ['big · params ×10⁶ · 213', '213 − 65 = +148'],
    ]) {
      await focusTip(table.getByRole('button', { name, exact: true }))
      check((await tip.innerText()).includes(expected) && (await tip.innerText()).includes('PDF p. 9'), 'missing sourced difference ' + expected)
    }
  })
  if (failures.length) throw new Error(failures.join(' | '))
  return passed
}
