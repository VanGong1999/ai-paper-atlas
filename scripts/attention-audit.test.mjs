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
