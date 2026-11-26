async (page) => {
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  const tab = name => page.getByRole('tab', { name, exact: true })
  const card = id => page.locator(`[data-paper-figure="${id}"]`)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://127.0.0.1:5184/papers/attention')

  await tab('全文中译').click()
  await page.getByRole('navigation', { name: '中文章节' }).getByRole('button', { name: '4 为什么选择自注意力', exact: true }).click()
  await tab('Figures').click()
  check(await page.getByLabel('图表章节').inputValue() === 'sec4', 'Figures tab should inherit the bilingual §4 chapter')
  check(await page.locator('[data-paper-figure]').count() === 1, 'Inherited §4 filter should show one registry entry')
  check(await card('table-1').isVisible(), 'Inherited §4 filter should show Table 1')

  await tab('全文中译').click()
  await page.getByRole('button', { name: '本节图表 →' }).click()
  check(await tab('Figures').getAttribute('aria-selected') === 'true', 'Figure-specific chapter link should open Figures')
  check(await page.getByLabel('图表章节').inputValue() === 'sec4', 'Figure-specific chapter link should preserve §4')

  await page.getByLabel('图表章节').selectOption('sec6-2')
  const table = card('table-3')
  await table.getByRole('tab', { name: '重绘' }).click()
  const epsilon = table.getByRole('button', { name: /\(D\).*ϵ_ls.*0\.0/ }).last()
  const heads = table.getByRole('button', { name: /\(A\).*h.*1$/ })
  await epsilon.hover()
  const epsilonTip = page.getByRole('tooltip')
  await epsilonTip.waitFor()
  check((await epsilonTip.innerText()).includes('标签平滑'), 'Table 3 epsilon_ls should explain label smoothing')
  check(!(await epsilonTip.innerText()).includes('注意力头数'), 'Table 3 epsilon_ls should not explain head count')

  await page.mouse.move(0, 0)
  await epsilonTip.waitFor({ state: 'hidden' })
  await heads.hover()
  const headTip = page.getByRole('tooltip').last()
  await headTip.waitFor()
  check((await headTip.innerText()).includes('注意力头数'), 'Table 3 h should explain head count')
  check(!(await headTip.innerText()).includes('标签平滑'), 'Table 3 h should not explain label smoothing')

  return 'Passed bilingual chapter handoff, direct figure chapter links, and distinct Table 3 parameter explanations.'
}
