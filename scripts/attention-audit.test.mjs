import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const cwd = fileURLToPath(new URL('..', import.meta.url))

function run(args, input) {
  const child = spawnSync(process.execPath, args, { cwd, input, encoding: 'utf8' })
  assert.ok(child.stdout, child.stderr)
  return { status: child.status, report: JSON.parse(child.stdout) }
}

test('audits the supplied PDF, displayed tables and both reader mappings', () => {
  const { status, report } = run(['scripts/attention-audit.mjs'])
  assert.deepEqual(report.issues, [])
  assert.equal(status, 0)
  assert.equal(report.coverage.sections, 27)
  assert.equal(report.coverage.references, 40)
  assert.deepEqual(report.figures.map(({ page }) => page), [3, 4, 13, 14, 15])
  assert.deepEqual(report.tables.map(({ rows }) => rows), [4, 10, 20, 12])
  assert.deepEqual(report.orphanedExplainables, [])
  assert.deepEqual(report.missingPreviews, [])
})

test('rejects misattributed BLEU, altered formulas, swapped table columns and uncited copy', () => {
  const { status, report } = run(['--input-type=module'], `
    import { audit } from './scripts/attention-audit.mjs'
    import { explainables } from './src/data/papers/attention/explainables.ts'
    import { lessons } from './src/data/papers/attention/lessons.ts'
    import { fulltextZh } from './src/data/papers/attention/fulltext-zh.ts'
    import { paperTables } from './src/components/paper/paperTables.ts'
    const scale = lessons.find(lesson => lesson.id === 'sdp').steps.find(step => step.id === 'scale')
    scale.formula = scale.formula.replace('√', '')
    scale.body += ' GPT-4 is discussed in this paper.'
    fulltextZh.find(block => block.id === 'sec6-1').paragraphs[1] = '正文报告 41.8 BLEU。'
    const variant = paperTables.variants.rows[14]
    ;[variant.cells[6], variant.cells[7]] = [variant.cells[7], variant.cells[6]]
    explainables.orphan = { ...explainables.bleu }
    const result = await audit()
    console.log(JSON.stringify(result))
    process.exitCode = result.issues.length ? 1 : 0
  `)
  assert.equal(status, 1)
  const issues = report.issues.join('\n')
  assert.match(issues, /41\.0.*sec6-1/)
  assert.match(issues, /sdp\/scale.*formula/)
  assert.match(issues, /Table 3.*row 15/)
  assert.match(issues, /sdp\/scale.*off-paper/)
  assert.match(issues, /Orphaned explainable: orphan/)
})

test('rejects exact training-field mutations in both explainables and Learn entries', () => {
  const { status, report } = run(['--input-type=module'], `
    import { audit } from './scripts/attention-audit.mjs'
    import { explainables } from './src/data/papers/attention/explainables.ts'
    import { lessons } from './src/data/papers/attention/lessons.ts'
    const smoothing = explainables.smoothing
    smoothing.paperFact = smoothing.paperFact.replace('0.1', '0.15')
    const optimizer = explainables.optimizer
    optimizer.paperFact = optimizer.paperFact.replace('d_model^(-0.5)', 'd_model^(-0.6)')
    const labels = lessons.find(lesson => lesson.id === 'train').steps.find(step => step.id === 'labels')
    labels.paperFact = labels.paperFact.replace('0.1', '0.15')
    labels.body = labels.body.replace('0.1', '0.15')
    const opt = lessons.find(lesson => lesson.id === 'train').steps.find(step => step.id === 'opt')
    opt.paperFact = opt.paperFact.replace('d_model^(-0.5)', 'd_model^(-0.6)')
    opt.body = opt.body.replace('d_model^(-0.5)', 'd_model^(-0.6)')
    const result = await audit()
    console.log(JSON.stringify(result))
    process.exitCode = result.issues.length ? 1 : 0
  `)
  assert.equal(status, 1)
  const issues = report.issues.join('\n')
  assert.match(issues, /smoothing\.regularization\.label_smoothing/)
  assert.match(issues, /optimizer\.equation3\.model_width_exponent/)
})

test('rejects scientific notation with a flattened exponent', () => {
  const { status, report } = run(['--input-type=module'], `
    import { audit } from './scripts/attention-audit.mjs'
    import { paperTables } from './src/components/paper/paperTables.ts'
    const big = paperTables.translation.rows.find(row => row.label === 'Transformer (big)')
    big.cells[2] = { text: '2.3 · 1019', span: 2 }
    const result = await audit()
    console.log(JSON.stringify(result))
    process.exitCode = result.issues.length ? 1 : 0
  `)
  assert.equal(status, 1)
  assert.match(report.issues.join('\n'), /Table 2.*scientific notation/)
})

test('rejects missing or shifted Chinese appendix captions by stable figure ID', () => {
  const { status, report } = run(['--input-type=module'], `
    import { audit } from './scripts/attention-audit.mjs'
    import { fulltextZh } from './src/data/papers/attention/fulltext-zh.ts'
    const appendix = fulltextZh.find(block => block.id === 'appendix')
    appendix.paragraphs = appendix.paragraphs.filter(paragraph => !paragraph.startsWith('图 4'))
    const result = await audit()
    console.log(JSON.stringify(result))
    process.exitCode = result.issues.length ? 1 : 0
  `)
  assert.equal(status, 1)
  assert.match(report.issues.join('\n'), /figure-4.*appendix caption/)
})

test('rejects appendix Figure 4 head metadata mutations', () => {
  const { status, report } = run(['--input-type=module'], `
    import { audit } from './scripts/attention-audit.mjs'
    import { fulltextZh } from './src/data/papers/attention/fulltext-zh.ts'
    const appendix = fulltextZh.find(block => block.id === 'appendix')
    appendix.paragraphs = appendix.paragraphs.map(paragraph => paragraph.startsWith('图 4')
      ? paragraph.replace('第 5、6 个头', '第 7、8 个头') : paragraph)
    const result = await audit()
    console.log(JSON.stringify(result))
    process.exitCode = result.issues.length ? 1 : 0
  `)
  assert.equal(status, 1)
  assert.match(report.issues.join('\n'), /figure-4.*appendix caption/)
})

test('rejects duplicate, reversed, and wrong-section appendix Figure 4 evidence', () => {
  const mutations = [
    `appendix.paragraphs.push(appendix.paragraphs.find(paragraph => paragraph.startsWith('图 4')))`,
    `appendix.paragraphs = appendix.paragraphs.map(paragraph => paragraph.startsWith('图 4') ? paragraph.replace('非常集中', '非常分散') : paragraph)`,
    `figures.find(figure => figure.id === 'figure-4').source.section = 'sec3-2-3'`,
    `figures.push({ ...figures.find(figure => figure.id === 'figure-4') })`,
    `const hardware = explainables.hardware; const swapped = '基础模型训练 3.5 天，大模型训练 12 小时'; hardware.paperFact = hardware.paperFact.replace('基础模型训练 12 小时，大模型训练 3.5 天', swapped); const hardwareStep = lessons.find(lesson => lesson.id === 'train').steps.find(step => step.id === 'size'); hardwareStep.paperFact = hardwareStep.paperFact.replace('基础模型训练 12 小时，大模型训练 3.5 天', swapped); hardwareStep.body = hardwareStep.body.replace('基础模型训练 12 小时，大模型训练 3.5 天', swapped)`,
  ]
  for (const mutation of mutations) {
    const { status, report } = run(['--input-type=module'], `
      import { audit } from './scripts/attention-audit.mjs'
      import { fulltextZh } from './src/data/papers/attention/fulltext-zh.ts'
      import { figures } from './src/data/papers/attention/figures.ts'
      import { explainables } from './src/data/papers/attention/explainables.ts'
      import { lessons } from './src/data/papers/attention/lessons.ts'
      const appendix = fulltextZh.find(block => block.id === 'appendix')
      ${mutation}
      const result = await audit()
      console.log(JSON.stringify(result))
      process.exitCode = result.issues.length ? 1 : 0
    `)
    assert.equal(status, 1)
    assert.ok(report.issues.length > 0)
  }
})
