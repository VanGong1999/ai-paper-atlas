import test from 'node:test'
import assert from 'node:assert/strict'
import { cheatSheet } from '../src/data/papers/attention/cheatsheet.ts'
import { lessons } from '../src/data/papers/attention/lessons.ts'

test('速查卡片都能跳转到真实的导读步骤，并包含重点解释', () => {
  assert.ok(cheatSheet.length >= 6)
  for (const card of cheatSheet) {
    const lesson = lessons.find(item => item.id === card.lessonId)
    assert.ok(lesson, card.title)
    assert.ok(lesson.steps.some(step => step.id === card.stepId), card.title)
    assert.ok(card.summary && card.detail && card.emphasis, card.title)
  }
})
