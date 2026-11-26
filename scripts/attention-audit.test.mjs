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
  assert.match(issues, /regularization\.label_smoothing/)
  assert.match(issues, /equation3\.model_width_exponent/)
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

function auditMutation(mutation) {
  return run(['--input-type=module'], `
    import { audit } from './scripts/attention-audit.mjs'
    import { fulltextZh } from './src/data/papers/attention/fulltext-zh.ts'
    import { figures } from './src/data/papers/attention/figures.ts'
    import { explainables } from './src/data/papers/attention/explainables.ts'
    import { lessons } from './src/data/papers/attention/lessons.ts'
    const appendix = fulltextZh.find(block => block.id === 'appendix')
    const figure = figures.find(item => item.id === 'figure-4')
    const captionIndex = appendix.paragraphs.findIndex(text => text.startsWith('图 4'))
    const caption = appendix.paragraphs[captionIndex]
    ${mutation}
    const result = audit()
    console.log(JSON.stringify(result))
    process.exitCode = result.issues.length ? 1 : 0
  `)
}

for (const [field, entryId, stepId, correct, wrong] of [
  ['equation3.model_width_exponent', 'optimizer', 'opt', 'd_model^(-0.5)', 'd_model^(-0.6)'],
  ['equation3.step_number_exponent', 'optimizer', 'opt', 'step^(-0.5)', 'step^(-0.6)'],
  ['hardware.base.duration', 'hardware', 'size', '基础模型训练 12 小时', '基础模型训练 3.5 天'],
  ['hardware.big.duration', 'hardware', 'size', '大模型训练 3.5 天', '大模型训练 12 小时'],
]) {
  test(`rejects a wrong ${field} even with its correct value in teaching copy`, () => {
    const { status, report } = auditMutation(`
      const entry = explainables[${JSON.stringify(entryId)}]
      const step = lessons.find(lesson => lesson.id === 'train').steps.find(step => step.id === ${JSON.stringify(stepId)})
      entry.teachingExplanation += ' ' + entry.paperFact
      entry.paperFact = entry.paperFact.replace(${JSON.stringify(correct)}, ${JSON.stringify(wrong)})
      step.teachingExplanation = entry.teachingExplanation
      step.paperFact = entry.paperFact
      step.body = entry.plain + ' ' + step.paperFact + ' 教学解释：' + step.teachingExplanation
    `)
    assert.equal(status, 1)
    const issues = report.issues.filter(issue => issue.includes(field))
    assert.ok(issues.some(issue => issue.includes('explainable')), issues)
    assert.ok(issues.some(issue => issue.includes('Learn')), issues)
  })
}

for (const [description, mutation, expectedIssue] of [
  ['prepended conflicting page', `appendix.paragraphs.unshift(caption.replace('第 14 页', '第 15 页').replace('似乎参与', '参与'))`, /figure-4: appendix caption/],
  ['appended conflicting page', `appendix.paragraphs.push(caption.replace('第 14 页', '第 15 页'))`, /figure-4: appendix caption/],
  ['duplicate caption', `appendix.paragraphs.push(caption)`, /figure-4: appendix caption/],
  ['reversed wording', `appendix.paragraphs[captionIndex] = caption.replace('非常集中', '非常分散')`, /figure-4: appendix caption/],
  ['unqualified claim', `appendix.paragraphs[captionIndex] = caption.replace('似乎参与', '参与')`, /figure-4: appendix caption/],
  ['wrong source section', `figure.source.section = '3.2.3 Applications of Attention in our Model'`, /figure-4: appendix source/],
  ['wrong source locator', `figure.source.locator = 'Figure 5:'`, /figure-4: appendix source/],
  ['duplicate figure ID', `figures.unshift({ ...figure })`, /duplicate stable IDs.*figure-4/],
]) {
  test(`rejects Figure 4 ${description}`, () => {
    const { status, report } = auditMutation(mutation)
    assert.equal(status, 1)
    assert.match(report.issues.join('\n'), expectedIssue)
  })
}

test('resolves reordered appendix captions and figures by ID', () => {
  const { status, report } = auditMutation(`
    appendix.paragraphs.reverse()
    figures.reverse()
  `)
  assert.deepEqual(report.issues, [])
  assert.equal(status, 0)
  assert.equal(report.coverage.stableAppendixCaptions, 3)
})

test('reports each equation exponent on the surface where it changed', () => {
  const { status, report } = auditMutation(`
    const entry = explainables.optimizer
    const step = lessons.find(lesson => lesson.id === 'train').steps.find(step => step.id === 'opt')
    entry.teachingExplanation += ' ' + entry.paperFact
    step.teachingExplanation = entry.teachingExplanation
    entry.paperFact = entry.paperFact.replace('d_model^(-0.5)', 'd_model^(-0.6)')
    step.paperFact = step.paperFact.replace('step^(-0.5)', 'step^(-0.7)')
    step.body = entry.plain + ' ' + step.paperFact + ' 教学解释：' + step.teachingExplanation
  `)
  assert.equal(status, 1)
  assert.deepEqual(report.issues.filter(issue => issue.startsWith('equation3.')), [
    'equation3.model_width_exponent: explainable optimizer.paperFact differs from sec5-3 p. 7',
    'equation3.step_number_exponent: Learn optimizer.paperFact differs from sec5-3 p. 7',
  ])
})
