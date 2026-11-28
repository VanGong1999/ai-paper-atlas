import test from 'node:test'
import assert from 'node:assert/strict'
import { combinations, moeForward, expertBalance, deviceBalance } from '../src/data/papers/deepseek-moe/math.ts'
test('fine-grained combinations use actual binomial coefficients',()=>{
 assert.equal(combinations(16,2),'120');assert.equal(combinations(32,4),'35960');assert.equal(combinations(64,8),'4426165368')
})
test('MoE executes selected experts with unrenormalized gates and adds shared output and residual',()=>{
 const x=[.2,.8,-.3],r=moeForward(x,8,2,1,1)
 assert.equal(r.selected.length,2);assert.ok(r.gates.reduce((a,b)=>a+b,0)<1)
 for(let j=0;j<x.length;j++)assert.ok(Math.abs(r.output[j]-x[j]-r.sharedOutput[j]-r.routedOutput[j])<1e-12)
 assert.notDeepEqual(r.output,moeForward([.9,.1,-.3],8,2,1,1).output)
})
test('balance loss uses frequency normalization once, as paper Eq12–14',()=>{
 const r=expertBalance([[.5,.5],[.5,.5]],[[0],[1]],1,.01)
 assert.deepEqual(r.frequency,[1,1]);assert.equal(r.loss,.01)
 const skew=expertBalance([[.99,.01],[.99,.01]],[[0],[0]],1,.01)
 assert.ok(skew.loss>r.loss)
})
test('device balancing averages expert frequencies but sums probabilities, Eq15–17',()=>{
 const b={count:[4,0,2,2],frequency:[2,0,1,1],probability:[.6,.1,.2,.1]}
 const d=deviceBalance(b,2,.05)
 assert.deepEqual(d.count,[4,4]);assert.deepEqual(d.frequency,[1,1])
 assert.ok(Math.abs(d.probability[0]-.7)<1e-12)
 assert.ok(Math.abs(d.loss-.05)<1e-12)
 assert.throws(()=>deviceBalance(b,3,.05))
 const skew=deviceBalance({count:[8,0,0,0],frequency:[4,0,0,0],probability:[.8,.1,.05,.05]},2,.05)
 assert.ok(skew.loss>d.loss)
})
