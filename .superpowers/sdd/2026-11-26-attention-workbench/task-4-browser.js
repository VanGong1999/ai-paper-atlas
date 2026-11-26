async (page) => {
  const failures = []
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const probe = async (name, run) => {
    try { await run() } catch (error) { failures.push(name + ': ' + error.message.split('\n')[0]) }
  }
  const mode = name => page.locator('#paper-mode-' + name)
  const card = id => page.locator('[data-paper-figure="' + id + '"]')
  const switchCard = (entry, name) => entry.getByRole('tab', { name, exact: true }).click({ timeout: 1800 })
  const nav = page.getByRole('navigation', { name: '中文章节' })
  const english = page.locator('.original-drawer')
  const entries = {
    'figure-1': 3, 'figure-2': 4, 'table-1': 6, 'table-2': 8, 'table-3': 9,
    'table-4': 10, 'figure-3': 13, 'figure-4': 14, 'figure-5': 15,
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await mode('figures').click()
  await probe('all originals, badges, fallback and redraws', async () => {
    check(await page.locator('[data-paper-figure]').count() === 9, 'Expected nine registered cards')
    for (const [id, pdfPage] of Object.entries(entries)) {
      const entry = card(id)
      const badge = entry.locator('.source-badge').first()
      check((await badge.innerText()).includes('PDF p. ' + pdfPage), id + ' badge page')
      check((await badge.getAttribute('href')).endsWith('1706.03762v7.pdf#page=' + pdfPage), id + ' badge URL')
      const original = entry.getByRole('tabpanel')
      await original.scrollIntoViewIfNeeded()
      const image = original.getByRole('img')
      await image.evaluate(img => img.decode())
      check(await image.evaluate(img => img.naturalWidth > 300), id + ' PDF preview')
      const link = original.getByRole('link', { name: '在 PDF 中查看原版 ↗' })
      check((await link.getAttribute('href')).endsWith('#page=' + pdfPage), id + ' direct fallback')
      await switchCard(entry, '重绘')
      check((await entry.getByRole('tabpanel').innerText()).includes('依据原论文重绘'), id + ' redraw provenance')
      await switchCard(entry, '原版')
      check(await link.isVisible(), id + ' original restored')
    }
    const first = card('figure-1')
    await first.getByRole('tab', { name: '原版' }).press('ArrowRight')
    check(await first.getByRole('tab', { name: '重绘' }).getAttribute('aria-selected') === 'true', 'ArrowRight should select redraw')
    await first.getByRole('tab', { name: '重绘' }).press('Home')
    check(await first.getByRole('tab', { name: '原版' }).getAttribute('aria-selected') === 'true', 'Home should select original')
    const pdf = await page.request.get(new URL(await card('figure-1').locator('.source-badge').getAttribute('href'), page.url()).href)
    check(pdf.ok() && pdf.headers()['content-type'].includes('application/pdf'), 'Supplied PDF is reachable')
    await page.route('**/figure-1-p3.png', route => route.abort())
    await page.reload()
    await mode('figures').click()
    const broken = card('figure-1').getByRole('tabpanel')
    await broken.getByText('原版预览无法载入。').waitFor({ timeout: 1800 })
    check(await broken.getByRole('link', { name: '在 PDF 中查看原版 ↗' }).isVisible(), 'Fallback must survive a failed preview')
    await page.unroute('**/figure-1-p3.png')
  })
  await probe('chapter filter and linked Learn context', async () => {
    const filter = page.getByLabel('图表章节')
    check(await filter.getByRole('option', { name: '6.1 机器翻译' }).count() === 1, 'Chapter filter must use the printed section number')
    await filter.selectOption('sec6-1', { timeout: 1800 })
    check(await page.locator('[data-paper-figure]').count() === 1 && await card('table-2').isVisible(), 'Chapter filter should isolate Table 2')
    await card('table-2').getByRole('button', { name: /实验结果 · 翻译测试集 BLEU/ }).click({ timeout: 1800 })
    check(await mode('learn').getAttribute('aria-selected') === 'true', 'Related step should open Learn')
    await mode('figures').click()
    check((await page.locator('.workbench-context').innerText()).includes('翻译测试集 BLEU'), 'Related step should persist')
    await filter.selectOption('all')
  })
  await probe('exact table values and sourced cell hover/focus', async () => {
    for (const [id, rowCount, value] of [['table-1', 4, 'O(n² · d)'], ['table-2', 10, '41.8'], ['table-3', 20, '4.33'], ['table-4', 12, '92.7']]) {
      const entry = card(id)
      await switchCard(entry, '重绘')
      check(await entry.locator('tbody tr').count() === rowCount, id + ' data rows')
      check(await entry.getByRole('button', { name: value, exact: false }).count() > 0, id + ' exact cell')
    }
    const entry = card('table-2')
    const cell = entry.getByRole('button', { name: /Transformer \(big\).*EN-FR.*41\.8/ })
    await cell.hover({ timeout: 1800 })
    const tip = page.getByRole('tooltip')
    await tip.getByText('41.8', { exact: false }).first().waitFor({ timeout: 1800 })
    check((await tip.innerText()).includes('Table 2'), 'Tooltip must cite Table 2')
    await page.mouse.move(0, 0)
    await cell.focus()
    await tip.waitFor({ timeout: 1800 })
    check((await cell.getAttribute('aria-describedby')).endsWith('-tip'), 'Focus tooltip association')
    await page.keyboard.press('Escape')
    await tip.waitFor({ state: 'hidden', timeout: 1800 })
  })
  await probe('bilingual mappings and complete passages', async () => {
    await mode('fulltext').click()
    check(await nav.getByRole('button').count() === 27, 'Expected 27 Chinese sections')
    for (const button of await nav.getByRole('button').all()) {
      await button.click()
      const zhSource = await page.locator('.fulltext-main .source-badge').getAttribute('href')
      check(zhSource === await english.locator('.source-badge').getAttribute('href'), 'English source should follow ' + await button.innerText())
      const id = await page.locator('.fulltext-main').getAttribute('data-original-id')
      check(await english.locator('[data-original-id]').getAttribute('data-original-id') === id, 'English mapping mismatch for ' + id)
      if (id === 'sec6') {
        check((await english.getByRole('heading').textContent()) === '6 Results', 'Section 6 leads with its heading')
      } else {
        check(await english.getByRole('paragraph').count() > 0, 'English paragraphs missing')
      }
    }
    check(await english.getByRole('paragraph').count() === 3, 'All appendix captions must be present')
    await nav.getByRole('button', { name: '1 引言', exact: true }).click()
    check((await english.innerText()).includes('Recurrent neural networks'), 'Introduction first paragraph missing')
    await nav.getByRole('button', { name: '5.4 正则化', exact: true }).click()
    check((await english.innerText()).includes('Label Smoothing'), 'Cross-page English continuation missing')
    await nav.getByRole('button', { name: '参考文献', exact: true }).click()
    check(await english.getByRole('paragraph').count() === 40, 'English reference count')
    await mode('learn').click()
    await mode('fulltext').click()
    check((await nav.locator('[aria-current]').innerText()) === '参考文献', 'Manual bilingual selection should persist')
  })
  await probe('narrow text and table scrolling in light and dark', async () => {
    for (const [width, theme] of [[390, 'light'], [320, 'dark']]) {
      await page.setViewportSize({ width, height: 760 })
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme }, theme)
      await mode('figures').click()
      await switchCard(card('table-3'), '重绘')
      const scroller = card('table-3').getByRole('region', { name: /Table 3/ })
      const traveled = await scroller.evaluate(node => { node.scrollLeft = node.scrollWidth; return node.scrollLeft })
      check(traveled > 0, 'Wide table should be locally scrollable')
      check(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'Figures overflows at ' + width)
      await mode('fulltext').click()
      await english.getByRole('paragraph').last().scrollIntoViewIfNeeded()
      check(await page.evaluate(() => scrollY > 0 && document.documentElement.scrollWidth === innerWidth), 'Narrow bilingual content must scroll vertically without horizontal overflow')
    }
  })
  if (failures.length) throw new Error(failures.join(' | '))
  return 'Passed all nine previews and redraw tabs, PDF fallback on image failure, exact badges, chapter/step links, four tables and cell hover/focus, all 27 bilingual mappings and narrow scrolling in light/dark.'
}
