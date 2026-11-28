import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAttentionScores } from '../src/components/paper/attentionSoftmaxExplainable.ts'

test('attention rows normalize large logits without overflow', () => {
  const row = normalizeAttentionScores([10000, 10001, 10002])
  assert.ok(row.every(Number.isFinite))
  assert.ok(Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-12)
  assert.ok(row[2] > row[1] && row[1] > row[0])
})

test('causal masking excludes future positions before normalization', () => {
  assert.deepEqual(normalizeAttentionScores([1, 100], 0), [1, 0])
  const row = normalizeAttentionScores([1, 1, 100], 1)
  assert.deepEqual(row, [0.5, 0.5, 0])
})
