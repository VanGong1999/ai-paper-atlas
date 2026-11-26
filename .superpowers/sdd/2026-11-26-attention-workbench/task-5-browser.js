async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  const panel = page.locator('#paper-mode-panel')
  const tab = name => page.getByRole('tab', { name, exact: true })
  const button = name => page.getByRole('button', { name, exact: true })
  const step = index => page.locator('.steps button').nth(index)
  const activeStep = () => page.locator('.steps [aria-current="step"]').textContent()
  const tip = page.getByRole('tooltip')
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

  const pdf = '/article/1706.03762v7.pdf'
  const chapter = name => page.locator('.lesson-nav').getByRole('button', { name: new RegExp(name) })
  const response = await page.request.get(new URL(pdf, page.url()).href)
  assert(response.ok() && response.headers()['content-type'].includes('application/pdf'), 'Local PDF response')
  assert((await response.body()).subarray(0, 5).toString() === '%PDF-', 'Local PDF signature')

  const results = []
  for (const width of [1440, 1024, 390]) {
    const height = width === 390 ? 844 : 900
    for (const theme of ['light', 'dark']) {
      const label = width + 'x' + height + ' ' + theme
      try {
        await page.setViewportSize({ width, height })
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await page.reload()
        if (await page.locator('html').getAttribute('data-theme') !== theme) {
          await button('亮色主题').click()
        }
        assert(await page.locator('html').getAttribute('data-theme') === theme, 'theme')
        const noOverflow = async (mode) => {
          const sizes = await panel.evaluate(el => ({
            doc: document.documentElement.scrollWidth, view: document.documentElement.clientWidth,
            panel: el.clientWidth, content: el.scrollWidth,
          }))
          assert(sizes.doc <= sizes.view && sizes.content <= sizes.panel, mode + ' overflow ' + JSON.stringify(sizes))
        }

        await chapter('编码器与解码器').click()
        const architecture = page.locator('[data-explainable-kind="architecture-node"]').first()
        await architecture.hover()
        await tip.waitFor({ state: 'visible' })
        assert((await tip.textContent()).includes('论文事实'), 'real SVG hover')
        await page.keyboard.press('Escape')
        await tip.waitFor({ state: 'hidden' })
        const motion = page.locator('.stage-flow').first()
        const animation = () => motion.evaluate(el => [getComputedStyle(el).animationName, getComputedStyle(el).animationPlayState])
        await step(1).click()
        await button('播放').click()
        assert((await animation())[1] === 'running', 'play animation')
        const prior = (await animation())[0]
        await button('重放').click()
        assert((await animation())[0] !== prior && await step(0).getAttribute('aria-current') === 'step', 'replay')
        await button('暂停').click()
        assert((await animation())[1] === 'paused', 'pause animation')
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await button('播放').click()
        assert((await animation())[0] === 'none', 'reduced motion')
        await button('暂停').click()
        await page.emulateMedia({ reducedMotion: 'no-preference' })

        await chapter('缩放点积注意力').click()
        await step(1).click()
        const learnPosition = await activeStep()
        await noOverflow('Learn')
        // Place a real formula trigger at each viewport corner to exercise both flips.
        const variable = page.locator('.detail-panel [data-explainable-kind="formula-variable"]').first()
        await variable.evaluate(el => {
          el.style.setProperty('position', 'fixed', 'important')
          el.style.zIndex = '100'
        })
        for (const [x, y] of [[3, 3], [width - 29, 3], [3, height - 34], [width - 29, height - 34]]) {
          await variable.evaluate((el, [left, top]) => Object.assign(el.style, {
            left: left + 'px', top: top + 'px', width: '24px', height: '24px',
          }), [x, y])
          const checkTooltip = async () => {
            await tip.waitFor({ state: 'visible' })
            const box = await tip.boundingBox()
            assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height, 'tooltip bounds')
            assert(x < 20 ? box.x >= x + 12 : box.x + box.width <= x + 12, 'horizontal flip')
            assert(y < 20 ? box.y >= y + 12 : box.y + box.height <= y + 12, 'vertical flip')
          }
          await page.mouse.move(x + 12, y + 12)
          await checkTooltip()
          await page.mouse.move(width / 2, height / 2)
          await page.keyboard.press('Escape')
          await tip.waitFor({ state: 'hidden' })
          await variable.focus()
          await checkTooltip()
          assert(await variable.getAttribute('aria-describedby') === await tip.getAttribute('id'), 'focus association')
          await page.keyboard.press('Escape')
          await tip.waitFor({ state: 'hidden' })
          await variable.blur()
        }
        await variable.evaluate(el => el.removeAttribute('style'))

        const preview = '**/article/attention/figure-2-p4.png'
        const rejectPreview = route => route.fulfill({ status: 200, contentType: 'image/png', body: 'invalid PNG' })
        await page.route(preview, rejectPreview)
        await tab('Learn').press('ArrowRight')
        assert(await tab('Figures').getAttribute('aria-selected') === 'true', 'keyboard mode switching')
        const figure = panel.locator('[data-paper-figure="figure-2"]')
        await figure.locator('.figure-preview-error').waitFor({ state: 'visible' })
        const figureLink = figure.getByRole('link', { name: /在 PDF 中查看原版/ })
        assert((await figureLink.getAttribute('href')).endsWith(pdf + '#page=4'), 'failed preview fallback')
        const figureTitle = figure.locator('[data-explainable-kind="figure-title"]')
        await figureTitle.focus()
        await tip.waitFor({ state: 'visible' })
        assert((await tip.locator('small').textContent()).includes('3.2.2 Multi-Head Attention · PDF p. 5'), 'Figure 2 hover fact source')
        await page.keyboard.press('Escape')
        await figure.getByRole('tab', { name: '重绘' }).click()
        await figure.locator('.figure-flow-grid').waitFor({ state: 'visible' })
        await noOverflow('Figures')
        await page.unroute(preview, rejectPreview)

        await tab('全文中译').click()
        for (const selector of ['#paper-translation', '#paper-original .original-prose']) {
          assert(await panel.locator(selector).getAttribute('data-original-id') === 'sec3-2-1', 'bilingual handoff')
        }
        await noOverflow('全文中译')

        const pdfMatch = '**/article/1706.03762v7.pdf'
        let embedRequests = 0
        const rejectEmbed = route => {
          embedRequests++
          return route.fulfill({ status: 200, contentType: 'text/plain', body: 'PDF embed unavailable' })
        }
        await page.route(pdfMatch, rejectEmbed)
        await tab('PDF').click()
        assert((await panel.locator('iframe').getAttribute('src')).endsWith(pdf + '#page=4'), 'sourced PDF embed page')
        await page.waitForFunction(() => document.querySelector('iframe')?.contentDocument?.body.textContent.includes('PDF embed unavailable'))
        const fallback = panel.getByRole('link', { name: /打开 PDF/ })
        assert(embedRequests > 0 && await fallback.isVisible(), 'PDF fallback stays visible')
        assert((await fallback.getAttribute('href')).endsWith(pdf) && await fallback.getAttribute('target') === '_blank', 'PDF fallback opens supplied file')
        await page.unroute(pdfMatch, rejectEmbed)
        await noOverflow('PDF')

        await tab('PDF').press('Home')
        assert(await activeStep() === learnPosition, 'Learn position survives all modes')
        results.push(label + ': 4 modes, no overflow, 4 hover + 4 focus corners, pause/replay/reduced motion, both PDF fallbacks')
      } catch (error) {
        throw new Error(label + ': ' + error.message)
      }
    }
  }
  assert(!errors.length, errors.join('\n'))
  return results
}
