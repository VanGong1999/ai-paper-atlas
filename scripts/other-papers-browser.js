async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message) }
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const base = 'http://127.0.0.1:5184/papers/'
  const routes = ['attention', 'pagedattention', 'distillation', 'react', 'deepseek-moe', 'deepseek-v2']
  const result = { responsiveThemeCases: 0, modules: 0, tables: 0, formulas: 0, errors }
  const theme = async value => {
    if (await page.locator('html').getAttribute('data-theme') !== value) await page.locator('.theme-toggle').click()
  }
  for (const route of routes) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(base + route)
    await page.locator('.theme-toggle').waitFor()
    await page.locator({attention:'.cockpit',pagedattention:'.pa-reader',distillation:'.kd-reader',react:'.react-reader','deepseek-moe':'.moe-reader','deepseek-v2':'.v2-stage'}[route]).waitFor()
    for (const width of [1440, 715, 390]) {
      await page.setViewportSize({ width, height: width === 715 ? 716 : 900 })
      for (const color of ['light', 'dark']) {
        await theme(color)
        const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }))
        assert(dimensions.scroll <= dimensions.width + 1, route + ':' + width + ':' + color + ': root overflow ' + JSON.stringify(dimensions))
        assert(await page.locator('.katex-error').count() === 0, route + ': KaTeX error')
        if (width !== 715) await page.screenshot({ path: `output/playwright/review-${route}-${width}-${color}.png`, animations: 'disabled' })
        result.responsiveThemeCases++
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(base + 'deepseek-moe?chapter=routing')
  await theme('light')
  const input = page.getByRole('slider', { name: 'MoE 输入第一维', exact: true })
  const previous = await page.locator('.moe-output-node').innerText()
  await input.fill('0.9')
  assert(previous !== await page.locator('.moe-output-node').innerText(), 'MoE input must recompute output')
  await page.getByLabel('MoE Top-K', { exact: true }).selectOption('4')
  assert(await page.locator('.moe-expert-grid .active').count() === 4, 'MoE Top-K must select four actual expert branches')
  const node = page.locator('.moe-input-node')
  await node.hover()
  const tip = page.locator('.concept-help-card')
  await tip.waitFor()
  const text = await tip.innerText()
  assert(text.includes('为什么需要它') && text.includes('怎样计算') && text.includes('具体例子'), 'Detailed layered hover explanation')
  await node.click()
  assert(await tip.getAttribute('role') === 'dialog', 'Click pins explanation')
  await page.keyboard.press('Escape')
  assert(await tip.count() === 0, 'Escape closes explanation')
  for (const id of ['overview','basics','routing','segmentation','shared','balance','validation','ablation','specialization','scale16','alignment','scale145','formulas','source']) {
    await page.goto(base + 'deepseek-moe?chapter=' + id)
    assert(await page.locator('.moe-main h1').innerText(), 'MoE module ' + id)
    assert(await page.locator('.moe-nav button.active').count() === 1, 'MoE active module ' + id)
    assert(await page.locator('.katex-error').count() === 0, 'MoE module formulas ' + id)
    result.modules++
  }
  await page.goto(base + 'deepseek-moe?chapter=shared')
  assert(await page.locator('.moe-expert-grid .concept-help-trigger').count() === 15, 'Shared isolation keeps total budget:15 routed +1 shared')
  await page.getByLabel('MoE 共享专家数', { exact: true }).selectOption('0')
  assert(await page.locator('.moe-expert-grid .concept-help-trigger').count() === 16, 'Removing shared restores routed count under same total budget')
  await page.goto(base + 'deepseek-moe?chapter=balance')
  await page.getByLabel('MoE 均衡设备数', {exact:true}).selectOption('2')
  assert(await page.locator('.moe-device-cards>button').count() === 2, 'Device balance recomputes expert grouping')
  const assignments = await page.locator('.moe-device-cards b').allTextContents()
  assert(assignments.reduce((sum, text) => sum + parseInt(text), 0) === 40, 'Device dispatches conserve 20 token × Top2 assignments')
  await page.goto(base + 'deepseek-moe?chapter=segmentation')
  await page.getByRole('button', { name: '×2', exact: true }).click()
  assert((await page.locator('.moe-combination-row').innerText()).includes('35,960'), 'Exact C(32,4)=35960')
  await page.goto(base + 'deepseek-moe?chapter=formulas')
  assert(await page.locator('.moe-equations>section').count() === 17, '17 original MoE formulas')
  assert(await page.locator('.katex-error').count() === 0, 'All original MoE formulas render')
  result.formulas = 17
  await page.goto(base + 'deepseek-moe?chapter=scale16')
  for (let i = 1; i <= 10; i++) {
    await page.getByLabel('DeepSeekMoE 原表', { exact: true }).selectOption(String(i))
    assert((await page.locator('.moe-evidence').innerText()).length > 100, 'Original table ' + i)
    result.tables++
  }
  await page.getByLabel('DeepSeekMoE 原表', { exact: true }).selectOption('3')
  await page.getByRole('button', { name: '原始完整表', exact: true }).click()
  const header = await page.locator('.moe-table-overflow tr').first().innerText()
  await page.getByLabel('搜索 DeepSeekMoE 原表', { exact: true }).fill('HumanEval')
  assert(await page.locator('.moe-table-overflow tr').first().innerText() === header, 'Filtering preserves model header')
  await page.goto(base + 'deepseek-moe?chapter=source')
  assert(await page.locator('.source-archive img').count() > 0, 'Original page archive')
  await page.goto(base + 'deepseek-v2?chapter=mla&step=1')
  await page.locator('.v2-stage').waitFor()
  assert(await page.locator('.v2-lesson-heading').count() === 0, 'Selected V2 heading removed')
  assert(await page.locator('.v2-stage').isVisible(), 'V2 calculation drawing remains visible')
  for (const width of [715,1440]) {
    await page.setViewportSize({width,height:width===715?716:900})
    for (const color of ['light','dark']) {
      await theme(color)
      await page.screenshot({path:`output/playwright/review-v2-mla-${width}-${color}.png`,animations:'disabled'})
    }
  }
  assert(errors.length === 0, 'Browser errors: ' + errors.join('; '))
  return result
}
