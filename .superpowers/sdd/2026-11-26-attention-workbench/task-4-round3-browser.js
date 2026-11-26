async (page) => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const tab = name => page.getByRole('tab', { name, exact: true })
  const card = id => page.locator(`[data-paper-figure="${id}"]`)
  const openVariants = async () => {
    await tab('Figures').click()
    await page.getByLabel('图表章节').selectOption('sec6-2')
    await card('table-3').getByRole('tab', { name: '重绘' }).click()
  }
  const tooltipAfter = async button => {
    await button.scrollIntoViewIfNeeded()
    await button.hover()
    await page.waitForTimeout(300)
    return (await page.getByRole('tooltip').allTextContents())[0] || ''
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://127.0.0.1:5184/papers/attention')

  await tab('Figures').click()
  await page.getByLabel('图表章节').selectOption('sec6-1')
  await tab('Learn').click()
  await tab('Figures').click()
  check(await page.getByLabel('图表章节').inputValue() === 'sec6-1', 'Figures → Learn → Figures should preserve §6.1 filter')
  check(await card('table-2').isVisible(), 'Preserved §6.1 filter should show Table 2')

  await tab('全文中译').click()
  await page.getByRole('navigation', { name: '中文章节' }).getByRole('button', { name: '6.1 机器翻译', exact: true }).click()
  await page.getByRole('button', { name: '本节图表 →' }).click()
  check(await page.getByLabel('图表章节').inputValue() === 'sec6-1', 'Learn direct link should preserve §6.1')
  check(await card('table-2').isVisible(), '§6.1 direct link should show Table 2')

  await tab('全文中译').click()
  await page.getByRole('navigation', { name: '中文章节' }).getByRole('button', { name: '4 为什么选择自注意力', exact: true }).click()
  await tab('Figures').click()
  check(await page.getByLabel('图表章节').inputValue() === 'sec4', 'Bilingual §4 handoff should select §4')
  check(await card('table-1').isVisible(), '§4 handoff should show Table 1')

  await tab('全文中译').click()
  await page.getByRole('navigation', { name: '中文章节' }).getByRole('button', { name: '参考文献', exact: true }).click()
  await tab('Figures').click()
  check(await page.getByLabel('图表章节').inputValue() === 'all', 'References should normalize to all chapters')
  check(await page.locator('[data-paper-figure]').count() === 9, 'References should show all nine cards')

  await openVariants()
  const rowE = card('table-3').locator('tbody tr').filter({ hasText: 'positional embedding instead of sinusoids' })
  const mergedTip = await tooltipAfter(rowE.locator('button').filter({ hasText: 'positional embedding instead of sinusoids' }))
  check(mergedTip.includes('learned positional embeddings'), 'Merged row E cell should explain learned positional embeddings')
  const pplTip = await tooltipAfter(rowE.locator('button').filter({ hasText: '4.92' }))
  check(pplTip.includes('开发集 PPL'), 'Row E PPL cell should retain PPL explainable')
  check(!pplTip.includes('学习的位置嵌入'), 'Row E PPL cell should not use merged-row explanation')
  const bleuTip = await tooltipAfter(rowE.locator('button').filter({ hasText: '25.7' }))
  check(bleuTip.includes('开发集 BLEU'), 'Row E BLEU cell should retain BLEU explainable')
  check(!bleuTip.includes('学习的位置嵌入'), 'Row E BLEU cell should not use merged-row explanation')

  return 'Passed Figures filter preservation, §6.1/§4/References coverage, and row E merged-versus-metric explainables.'
}
