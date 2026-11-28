import test from 'node:test'
import assert from 'node:assert/strict'
import { reactChapters, reactTable1, reactTable4, reactTable5 } from '../src/data/papers/react/content.ts'

test('ReAct curriculum exposes seven chapters and forty-nine steps', () => {
  assert.equal(reactChapters.length, 7)
  assert.equal(reactChapters.reduce((total, chapter) => total + chapter.steps.length, 0), 49)
})

test('ReAct evidence keeps the published Table 1 values', () => {
  assert.deepEqual(reactTable1.find(row => row.method === 'ReAct')?.values, [27.4, 60.9])
  assert.deepEqual(reactTable1.find(row => row.method === 'ReAct→CoT-SC')?.values, [35.1, 62.0])
})

test('ReAct evidence keeps WebShop and GPT-3 comparison values', () => {
  assert.deepEqual(reactTable4.find(row => row.method === 'ReAct')?.values, [66.6, 40.0])
  assert.deepEqual(reactTable5.find(row => row.model === 'GPT-3')?.values, [30.8, 78.4])
})
