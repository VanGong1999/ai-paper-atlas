import test from 'node:test'
import assert from 'node:assert/strict'
import { reactChapters } from '../src/data/papers/react/content.ts'
import { trajectoryContext, chooseFallback } from '../src/data/papers/react/simulation.ts'

test('ReAct task-specific lessons display their own evidence rather than an unrelated table',()=>{
 const steps=reactChapters.flatMap(c=>c.steps)
 assert.equal(steps.find(s=>s.id==='decision-3').stage,'alfworld')
 assert.equal(steps.find(s=>s.id==='decision-5').stage,'webshop')
 assert.equal(steps.find(s=>s.id==='appendix-5').stage,'prompts')
 assert.equal(steps.find(s=>s.id==='appendix-6').stage,'trajectories')
 assert.equal(steps.find(s=>s.id==='analysis-4').stage,'human-edit')
})
test('Thought updates model context without manufacturing an environment observation',()=>{
 const events=[{kind:'thought',label:'T1',text:'先找实体'},{kind:'action',label:'A1',text:'Search[entity]'},{kind:'observation',label:'O1',text:'真实环境返回'}]
 assert.deepEqual(trajectoryContext(events,0).observations,[])
 assert.equal(trajectoryContext(events,1).pendingAction,'Search[entity]')
 assert.deepEqual(trajectoryContext(events,2).observations,['真实环境返回'])
})
test('published fallback rules use strict majority threshold and task-specific step budgets',()=>{
 assert.equal(chooseFallback('cot',4,2,0,'hotpotqa'),'continue')
 assert.equal(chooseFallback('cot',5,2,0,'hotpotqa'),'react')
 assert.equal(chooseFallback('react',0,0,7,'hotpotqa'),'cot-sc')
 assert.equal(chooseFallback('react',0,0,5,'fever'),'cot-sc')
})
