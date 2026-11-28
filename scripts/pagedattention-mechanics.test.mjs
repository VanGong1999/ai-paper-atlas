import test from 'node:test'
import assert from 'node:assert/strict'
import { createPool, allocateSequence, appendToken, forkSequence, freeSequence, readSequence, blockAttention, scheduleExample } from '../src/data/papers/pagedattention/mechanics.ts'
import { findTooltip } from '../src/data/papers/pagedattention/tooltips.ts'

test('physical addresses are non-contiguous but reads preserve token order; append uses the tail before allocating', () => {
 let s=createPool(4,9); s=allocateSequence(s,'A',['Four','score','and','seven','years','ago','our'])
 assert.deepEqual(s.sequences.A.blocks,[7,1]); assert.deepEqual(readSequence(s,'A'),['Four','score','and','seven','years','ago','our'])
 s=appendToken(s,'A','fathers'); assert.deepEqual(s.sequences.A.blocks,[7,1]); assert.equal(s.blocks[1].tokens.length,4)
 s=appendToken(s,'A','brought'); assert.deepEqual(s.sequences.A.blocks,[7,1,3]); assert.equal(readSequence(s,'A').at(-1),'brought')
 const f=freeSequence(s,'A'); assert.equal(Object.keys(f.sequences).length,0); assert.ok(f.blocks.every(b=>b.refs===0&&b.tokens.length===0))
})
test('fork shares exact prefix; COW copies only a partially filled shared tail and free respects remaining owners', () => {
 let s=allocateSequence(createPool(4,9),'A',['Four','score','and','seven','years','ago','our'])
 s=forkSequence(s,'A','B'); assert.equal(s.blocks[7].refs,2); assert.equal(s.blocks[1].refs,2)
 s=appendToken(s,'A','fathers'); assert.deepEqual(s.sequences.A.blocks,[7,3]); assert.deepEqual(s.sequences.B.blocks,[7,1])
 assert.equal(s.blocks[1].refs,1); assert.equal(s.blocks[3].refs,1); assert.equal(readSequence(s,'B').length,7)
 s=appendToken(s,'B','mothers'); assert.equal(s.sequences.B.blocks.at(-1),1); assert.equal(readSequence(s,'A').at(-1),'fathers')
 s=freeSequence(s,'A'); assert.equal(s.blocks[7].refs,1); assert.equal(s.blocks[3].refs,0); assert.equal(readSequence(s,'B').at(-1),'mothers')
})
test('full shared block is never copied merely to append, and OOM preserves the previous state', () => {
 let s=allocateSequence(createPool(2,2),'A',['a','b']); s=forkSequence(s,'A','B'); s=appendToken(s,'B','c')
 assert.equal(s.blocks[s.sequences.A.blocks[0]].refs,2); assert.equal(s.sequences.B.blocks.length,2)
 assert.throws(()=>appendToken(s,'A','d'),/不足/); assert.deepEqual(readSequence(s,'A'),['a','b'])
})
test('attention uses one denominator across all valid token slots and matches contiguous attention', () => {
 for(const size of [2,4,8]) { const r=blockAttention(7,size,5); assert.ok(r.error<1e-12); assert.ok(Math.abs(r.rows.reduce((a,r)=>a+r.weight,0)-1)<1e-12); assert.equal(r.rows.length,7) }
})
test('scheduler preempts the latest group as a unit then resumes it before admitting new work', () => {
 const frames=scheduleExample('swap'); assert.equal(frames[0].used,6); assert.equal(frames[1].groups.find(g=>g.id==='B').status,'CPU')
 assert.equal(frames[1].used,4); assert.equal(frames[2].groups.find(g=>g.id==='B').status,'GPU'); assert.equal(frames[2].groups.find(g=>g.id==='C').status,'等待')
 assert.equal(frames[3].used,5); assert.ok(frames.every(f=>f.used<=6))
})
test('tooltip lookup retains Chinese and uses explicit aliases instead of empty or substring matches', () => {
 assert.equal(findTooltip('内部碎片')?.id,'internal-fragmentation'); assert.equal(findTooltip('COW')?.id,'cow'); assert.equal(findTooltip('block_table')?.id,'block-table')
 assert.equal(findTooltip('完全无关的词'),undefined); assert.equal(findTooltip(''),undefined)
})
