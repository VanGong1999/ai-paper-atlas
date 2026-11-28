import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('.')
const coveragePath = path.join(root, 'src/data/papers/coverage.ts')

function source() {
  return fs.readFileSync(coveragePath, 'utf8')
}

function ids(text) {
  return [...text.matchAll(/id:\s*'([^']+)'/g)].map(match => match[1])
}

test('coverage registry exists with unique stable ids and source anchors', () => {
  const text = source()
  const allIds = ids(text)
  assert.ok(allIds.length >= 50, `expected at least 50 coverage items, got ${allIds.length}`)
  assert.equal(new Set(allIds).size, allIds.length, 'coverage ids must be unique')
  assert.doesNotMatch(text, /source:\s*''/, 'every coverage item needs a source anchor')
  assert.match(text, /export function getCoverageForPaper/)
})

test('attention coverage names the paper mechanisms, training recipe and evidence', () => {
  const text = source()
  for (const phrase of [
    'scaled dot-product attention', 'causal mask', 'multi-head attention',
    'sinusoidal positional encoding', 'position-wise feed-forward',
    'Adam', 'warmup', 'label smoothing', 'beam search', 'BLEU', 'WSJ',
  ]) assert.match(text, new RegExp(phrase, 'i'), `missing Attention coverage: ${phrase}`)
})

test('pagedattention coverage names the system path, experiments and limits', () => {
  const text = source()
  for (const phrase of [
    'KV Cache', 'internal fragmentation', 'external fragmentation', 'block table',
    'copy-on-write', 'continuous batching', 'FCFS', 'prefill', 'decode',
    'swap', 'recompute', 'distributed execution', 'block size', 'ShareGPT',
  ]) assert.match(text, new RegExp(phrase, 'i'), `missing PagedAttention coverage: ${phrase}`)
})

test('cross-paper coverage states that paging preserves attention semantics', () => {
  const text = source()
  assert.match(text, /does not change attention mathematics/i)
  assert.match(text, /storage layout/i)
  assert.match(text, /logical.*physical/i)
})
