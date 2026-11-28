import test from 'node:test'
import assert from 'node:assert/strict'
import { sourceSections, sourceEquations, batchEvidence, sharingEvidence, hardware } from '../src/data/papers/pagedattention/source-review.ts'
import { allFigures } from '../src/data/papers/pagedattention/figures.ts'
import { lessons } from '../src/data/papers/pagedattention/lessons.ts'

test('source inventory maps all numbered sections and four equations to real lesson steps', () => {
 const ids=new Set(lessons.flatMap(l=>l.steps.map(s=>s.id)))
 for(const id of ['1','2','2.1','2.2','2.3','3','3.1','4','4.1','4.2','4.3','4.4','4.5','4.6','5','5.1','5.2','6','6.1','6.2','6.3','6.4','6.5','7','7.1','7.2','7.3','8','9','10','references']) assert.ok(sourceSections.some(s=>s.id===id),id)
 for(const s of sourceSections) for(const step of s.steps) assert.ok(ids.has(step),`${s.id}: ${step}`)
 assert.deepEqual(sourceEquations.map(e=>e.number),[1,2,3,4]); assert.equal(sourceSections.find(s=>s.id==='references').status,'source-only')
 assert.equal(allFigures.length,20); assert.equal(allFigures.find(f=>f.id==='table-1').page,9)
})
test('plotted evidence uses exactly the labeled source values, model and units', () => {
 assert.deepEqual(batchEvidence.ShareGPT,[7,9.81,13.62,30.42]);assert.deepEqual(batchEvidence.Alpaca,[7,43.24,72.75,132.44])
 assert.deepEqual(sharingEvidence.sampling,[6.09,8.53,9.79]);assert.deepEqual(sharingEvidence.beam,[37.56,53.13,55.16])
 assert.deepEqual(hardware.map(h=>h.model),['13B','66B','175B']); assert.deepEqual(hardware.map(h=>h.kvGB),[12,21,264])
})

test('shared registry links point to existing PagedAttention lessons and kernel evidence is Fig18a', async () => {
 const { getCoverageForPaper }=await import('../src/data/papers/coverage.ts')
 const items=getCoverageForPaper('pagedattention').items
 for(const item of items) {
  const lesson=lessons.find(l=>l.id===item.relatedLessonId)
  assert.ok(lesson,item.id); assert.ok(lesson.steps.some(s=>s.id===item.relatedStepId),item.id)
 }
 assert.match(items.find(i=>i.id==='paged-kernel-overhead').source,/Figure 18a/)
 assert.equal(items.find(i=>i.id==='paged-limits').section,'§8')
})
