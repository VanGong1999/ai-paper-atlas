import test from 'node:test'
import assert from 'node:assert/strict'
import { matmul, softmax, attention, cacheBytes, rotate, route, lowRankExample, absorptionExample, routingBatch, multiHeadAttention, parseMatrixInput } from '../src/data/papers/deepseek-v2/math.ts'

test('matrix multiplication executes real row-column dot products and rejects incompatible shapes', () => {
  assert.deepEqual(matmul([[1,2],[3,4]], [[5,6],[7,8]]), [[19,22],[43,50]])
  assert.throws(() => matmul([[1,2]], [[1]]), /dimension/i)
})
test('softmax is stable for large logits and masked positions', () => {
  const p=softmax([1000,1001,-Infinity]); assert.ok(Math.abs(p.reduce((a,b)=>a+b,0)-1)<1e-12)
  assert.equal(p[2],0); assert.ok(p[1]>p[0]); assert.deepEqual(softmax([-Infinity,-Infinity]),[0,0])
})
test('causal attention cannot attend to future tokens', () => {
  const a=attention([[1,0],[0,1]],[[1,0],[0,1]],[[2,4],[6,8]])
  assert.deepEqual(a.weights[0],[1,0]); assert.deepEqual(a.output[0],[2,4])
  assert.ok(a.output[1][0]>2 && a.output[1][0]<6)
})
test('cache calculator respects batch, layers, precision and latent/RoPE dimensions', () => {
  const c={batch:1,sequence:1024,layers:60,heads:128,kvHeads:8,headDim:128,latent:512,rope:64,bytes:2}
  assert.equal(cacheBytes('MLA',c),70778880)
  assert.equal(cacheBytes('MHA',c),4026531840)
  assert.equal(cacheBytes('GQA',c),251658240)
  assert.equal(cacheBytes('MQA',c),31457280)
  assert.equal(cacheBytes('MLA',{...c,batch:2}),2*cacheBytes('MLA',c))
})
test('RoPE preserves length and dot product depends on relative position', () => {
  const r=rotate([3,4],1.2); assert.ok(Math.abs(Math.hypot(...r)-5)<1e-12)
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0)
  assert.ok(Math.abs(dot(rotate([1,0],3),rotate([1,0],5))-Math.cos(2))<1e-12)
})
test('routing selects Top-K globally softmaxed scores without silently renormalizing selected experts', () => {
  const r=route([1,4,3,0],2); assert.deepEqual(r.selected,[1,2])
  assert.ok(r.gates.reduce((a,b)=>a+b,0)<1); assert.equal(r.gates[0],0)
})
test('low rank simulation recomputes results and absorption is algebraically equivalent', () => {
  const a=lowRankExample(4,2,1), b=lowRankExample(4,2,2)
  assert.equal(a.latent.length,2); assert.equal(a.keys.length,4); assert.notDeepEqual(a.latent,b.latent)
  const result=absorptionExample(3); assert.ok(result.error<1e-10)
})
test('device-limited routing respects destination limit and real Top-K assignments', () => {
  const a=routingBatch(1,3),b=routingBatch(1,6)
  assert.equal(a.expertCounts.reduce((x,y)=>x+y,0),20*3)
  assert.equal(b.expertCounts.reduce((x,y)=>x+y,0),20*6)
  assert.ok(b.tokens.every(t=>new Set(t.selected.map(i=>Math.floor(i/20))).size<=3))
  assert.ok(a.losses.every(Number.isFinite)); assert.equal(a.deviceCounts.length,8)
})
test('multi-head computation splits heads, concatenates outputs, and executes output projection', () => {
  const h=[[1,0],[0,1]],w=[[1,0,1,0],[0,1,0,1]],wo=[[1,0],[0,1],[1,0],[0,1]]
  const r=multiHeadAttention(h,w,w,w,wo,2)
  assert.equal(r.heads.length,2)
  assert.deepEqual(r.heads[0].output,r.heads[1].output)
  assert.deepEqual(r.output[0],[2,0])
  assert.throws(()=>multiHeadAttention(h,w,w,w,wo,3),/dimension/i)
})
test('editable matrix input requires rectangular finite numeric values', () => {
  assert.deepEqual(parseMatrixInput('1, 0; 0, 1',2,2,2),[[1,0],[0,1]])
  assert.equal(parseMatrixInput('1, ; 0, 1',2,2,2),null)
  assert.equal(parseMatrixInput('NaN, 1; 0, 1',2,2,2),null)
  assert.equal(parseMatrixInput('',2,2,6),null)
})
