import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { figures } from '../src/data/papers/attention/figures.ts'
import { fulltextZh } from '../src/data/papers/attention/fulltext-zh.ts'
import { bibliography, originals, pdfAsset } from '../src/data/papers/attention/originals-en.ts'

const assetPages = {
  'figure-1': 3, 'figure-2': 4, 'figure-3': 13, 'figure-4': 14, 'figure-5': 15,
  'table-1': 6, 'table-2': 8, 'table-3': 9, 'table-4': 10,
}

test('all nine captions and titles resolve to their exact supplied PDF page', () => {
  assert.equal(figures.length, 9)
  assert.deepEqual(Object.fromEntries(figures.map(figure => [figure.id, figure.source.page])), assetPages)
  for (const { id, kind, number, title, caption, source, originalId, originalAsset } of figures) {
    assert.ok(title.trim() && caption.trim() && originals[originalId], id)
    assert.equal(source.locator, `${kind} ${number}:`)
    assert.equal(originalAsset, `${pdfAsset}#page=${source.page}`)
    assert.ok(existsSync(new URL(`../public/article/attention/${id}-p${source.page}.png`, import.meta.url)), id)
  }
  assert.ok(existsSync(new URL('../public/article/1706.03762v7.pdf', import.meta.url)))
})

test('each Chinese section aligns with an English entry and its exact source range', () => {
  assert.equal(fulltextZh.length, 27)
  assert.deepEqual(fulltextZh.map(block => block.originalId), Object.keys(originals))
  for (const block of fulltextZh) {
    assert.deepEqual(block.source, originals[block.originalId].source, block.id)
    assert.ok(block.paragraphs.length && block.paragraphs.every(paragraph => paragraph.trim()), block.id)
  }
})

test('every section has a full English reading, including non-excerpt paragraphs and page continuations', () => {
  const asset = new URL('../src/components/paper/attention-original-text.json', import.meta.url)
  assert.ok(existsSync(asset), 'Full English reading is missing')
  const reading = JSON.parse(readFileSync(asset, 'utf8'))
  assert.deepEqual(Object.keys(reading), Object.keys(originals))
  for (const [id, paragraphs] of Object.entries(reading)) {
    assert.ok(paragraphs.length && paragraphs.every(paragraph => paragraph.trim()), id)
  }
  assert.match(reading.sec1[0], /Recurrent neural networks/)
  assert.match(reading['sec3-4'].join(' '), /share the same weight matrix/)
  assert.match(reading['sec5-4'].join(' '), /Residual Dropout.*Label Smoothing/)
  assert.match(reading['sec6-3'].join(' '), /During inference, we increased the maximum output length/)
  const normalize = text => text.replace(/\s/g, '').replace(/[‐‑–—]/g, '-').replace(/…/g, '...').replace(/[‘’]/g, "'")
  assert.deepEqual(reading.references.map(normalize), bibliography.map(({ citation }) => normalize(citation)))
  for (const [id, passage] of Object.entries(originals)) {
    // The placeholder has no excerpt. The optimizer's excerpt uses plain math formatting.
    if (['references', 'sec3-4', 'sec5-3'].includes(id)) continue
    assert.ok(normalize(reading[id].join(' ')).includes(normalize(passage.en)), id)
  }
  assert.equal(reading.appendix.length, 3)
})
