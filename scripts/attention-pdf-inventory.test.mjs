// Run with node --test, using the same PDF_PYTHON as the inventory CLI.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

function auditMutation(mutation) {
  // ESM imports share the generated registries in this child process only.
  const child = spawnSync(process.execPath, ['--input-type=module'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    input: mutation + "\nawait import('./scripts/attention-pdf-inventory.mjs')",
    encoding: 'utf8',
  })
  assert.equal(child.status, 1, child.stderr || 'Inventory accepted the mutation')
  return JSON.parse(child.stdout).validation.issues.join('\n')
}

test('identifies the BLEU step when its source is changed to another valid passage', () => {
  const issues = auditMutation(`
    import { lessons } from './src/data/papers/attention/lessons.ts'
    import { originals } from './src/data/papers/attention/originals-en.ts'
    const mt = lessons.find(l => l.id === 'results').steps.find(s => s.id === 'mt')
    mt.originalId = 'ack'
    mt.source = originals.ack.source
    // A locator can also exist on the right page while pointing at a different passage.
    const translation = lessons.find(l => l.id === 'abstract').steps.find(s => s.id === 'translation')
    translation.source = originals['sec6-1'].source
  `)
  assert.match(issues, /results\/mt:.*bleu/)
  assert.match(issues, /abstract\/translation:.*bleu/)
})

test('identifies omitted author credits and numbered references in the Chinese reader', () => {
  const issues = auditMutation(`
    import { fulltextZh } from './src/data/papers/attention/fulltext-zh.ts'
    const credits = fulltextZh.find(b => b.id === 'author-notes')
    if (credits) credits.paragraphs = []
    const references = fulltextZh.find(b => b.id === 'references')
    references.paragraphs = references.paragraphs.filter(p => !p.startsWith('[12]'))
  `)
  assert.match(issues, /author-notes/)
  assert.match(issues, /References.*\[12\]/)
})
