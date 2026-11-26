async (page) => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const tab = name => page.getByRole('tab', { name, exact: true })
  const card = id => page.locator(`[data-paper-figure="${id}"]`)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://127.0.0.1:5184/papers/attention')

  await tab('全文中译').click()
  await page.getByRole('navigation', { name: '中文章节' }).getByRole('button', { name: '参考文献', exact: true }).click()
  await tab('Figures').click()
  check(await page.getByLabel('图表章节').inputValue() === 'all', 'References handoff should normalize to all chapters')
  check(await page.locator('[data-paper-figure]').count() === 9, 'References handoff should show all nine cards')

  await page.getByLabel('图表章节').selectOption('sec6-2')
  await card('table-3').getByRole('tab', { name: '重绘' }).click()
  const rowE = card('table-3').locator('button').filter({ hasText: 'positional embedding instead of sinusoids' }).last()
  await rowE.scrollIntoViewIfNeeded()
  await rowE.hover()
  const rowTip = page.getByRole('tooltip')
  await page.waitForTimeout(300)
  check((await rowTip.innerText()).includes('learned positional embeddings'), 'Table 3 row E should explain learned positional embeddings')
  check((await rowTip.innerText()).includes('PDF p. 9'), 'Table 3 row E should cite PDF p. 9')
  check(!(await rowTip.innerText()).includes('堆叠的层数'), 'Table 3 row E should not explain layer count')

  await page.goto('http://127.0.0.1:5184/papers/attention')
  await tab('Figures').click()
  await page.getByLabel('图表章节').selectOption('sec6-2')
  await card('table-3').getByRole('tab', { name: '重绘' }).click()
  const warmup = card('table-3').locator('button').filter({ hasText: '学习率与 warmup' }).last()
  await warmup.scrollIntoViewIfNeeded()
  await warmup.hover()
  const warmupTip = page.getByRole('tooltip')
  await page.waitForTimeout(300)
  check((await warmupTip.innerText()).includes('5.3 Optimizer'), 'Warmup should cite 5.3 Optimizer')
  check((await warmupTip.innerText()).includes('PDF p. 7'), 'Warmup should cite PDF p. 7')

  await page.goto('http://127.0.0.1:5184/papers/attention')
  await tab('Figures').click()
  await page.getByLabel('图表章节').selectOption('sec6-2')
  await card('table-3').getByRole('tab', { name: '重绘' }).click()
  const batch = card('table-3').locator('button').filter({ hasText: '批次 token 数' }).last()
  await batch.scrollIntoViewIfNeeded()
  await batch.hover()
  const batchTip = page.getByRole('tooltip')
  await page.waitForTimeout(300)
  check((await batchTip.innerText()).includes('5.1 Training Data'), 'Batch tokens should cite 5.1 Training Data')
  check((await batchTip.innerText()).includes('PDF p. 7'), 'Batch tokens should cite PDF p. 7')

  return 'Passed References-to-Figures normalization, row E positional-embedding explanation, and p.7 training source footers.'
}
