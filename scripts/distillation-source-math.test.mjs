import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { center, distillationExample, l2, softmax } from '../src/data/papers/distillation/math.ts'
import { lessons } from '../src/data/papers/distillation/lessons.ts'
import { findTooltip } from '../src/data/papers/distillation/tooltips.ts'
import { jftResults, regularizationResults, sourceInventory, specialistCoverage, speechResults } from '../src/data/papers/distillation/evidence.ts'
const close = (a,b,tol=1e-9) => assert.ok(Math.abs(a-b)<tol, `${a} ≠ ${b}`)

test('stable softmax preserves normalization, translation and argmax across temperatures',()=>{
  for(const t of [1,2,4,20]) {
    const a=softmax([10002,10000,9998],t), b=softmax([2,0,-2],t)
    close(a.reduce((a,b)=>a+b,0),1)
    a.forEach((x,i)=>close(x,b[i]))
    assert.ok(a[0]>a[1] && a[1]>a[2])
  }
  assert.ok(softmax([2,0],20)[0]<softmax([2,0],1)[0])
})
test('invalid temperatures, nonfinite logits and class mismatches are rejected',()=>{
  for(const t of [0,-1,NaN,Infinity]) assert.throws(()=>softmax([1,2],t))
  assert.throws(()=>softmax([Infinity,0])); assert.throws(()=>softmax([]))
  assert.throws(()=>distillationExample([1],[1,2],2,0))
  assert.throws(()=>distillationExample([1,2],[1,2],2,3))
})
test('soft CE and KL differ exactly by teacher entropy, and identical distributions have KL zero',()=>{
  for(const t of [1,3,20]) {
    const x=distillationExample([-5,2,7,9],[-10,0,3,12],t,3)
    close(x.softCE,x.entropy+x.kl)
    assert.ok(x.kl>=0)
    close(distillationExample([1,2],[1,2],t,0).kl,0)
  }
  const x=distillationExample([0,0],[0,0],1,0)
  close(x.kl,0);close(x.softCE,Math.log(2))
})
test('exact soft gradient matches finite differences of KL and CE for every class',()=>{
  const z=[1.2,.4,-.5,-1.1],v=[1.5,.1,-.4,-1.2],eps=1e-5
  for(const t of [1,2,5,20]) for(let i=0;i<z.length;i++) {
    const plus=[...z],minus=[...z];plus[i]+=eps;minus[i]-=eps
    const a=distillationExample(plus,v,t,0),b=distillationExample(minus,v,t,0),x=distillationExample(z,v,t,0)
    close((a.kl-b.kl)/(2*eps),x.rawGradient[i],1e-8)
    close((a.softCE-b.softCE)/(2*eps),x.rawGradient[i],1e-8)
    close((a.hardCE-b.hardCE)/(2*eps),x.hardGradient[i],1e-8)
  }
})
test('T² compensation is exact, high-temperature zero-mean limit converges',()=>{
  const z=center([4,2,1,-2]),v=center([5,1,0,-3]),t=10000
  const x=distillationExample(z,v,t,0)
  x.rawGradient.forEach((g,i)=>close(g*t*t,x.scaledGradient[i]))
  x.scaledGradient.forEach((g,i)=>close(g,(z[i]-v[i])/4,1e-4))
  assert.ok(l2(distillationExample(z,v,20,0).rawGradient)<l2(distillationExample(z,v,2,0).rawGradient))
})
test('mixed hard/soft objective gradient matches finite differences including α endpoints',()=>{
  const z=[-5,2,7,9],v=[-10,0,3,12],t=3,eps=1e-5
  for(const alpha of [0,.7,1]) for(let i=0;i<z.length;i++) {
    const loss=s=>{const x=distillationExample(s,v,t,3);return alpha*t*t*x.kl+(1-alpha)*x.hardCE}
    const a=[...z],b=[...z];a[i]+=eps;b[i]-=eps
    const x=distillationExample(z,v,t,3)
    close((loss(a)-loss(b))/(2*eps),alpha*x.scaledGradient[i]+(1-alpha)*x.hardGradient[i],1e-8)
  }
})
test('Tables 1, 3 and 5 preserve actual source metrics and column meanings',()=>{
  assert.deepEqual(speechResults.map(x=>[x.frame,x.wer]),[[58.9,10.9],[61.1,10.7],[60.8,10.7]])
  assert.deepEqual(jftResults.map(x=>[x.conditional,x.overall]),[[43.1,25],[45.9,26.1]])
  assert.deepEqual(regularizationResults.map(x=>[x.train,x.test]),[[63.4,58.9],[67.3,44.5],[65.4,57]])
  close((26.1-25)/25,.044)
})
test('Table 4 includes all 11 original rows and does not conceal nonmonotonic last group',()=>{
  assert.equal(specialistCoverage.length,11)
  assert.deepEqual(specialistCoverage[0],['0',350037,0,0])
  assert.deepEqual(specialistCoverage.at(-1),['≥10',9082,324,14.1])
  assert.ok(specialistCoverage.at(-1)[3]<specialistCoverage.at(-2)[3])
  assert.equal(specialistCoverage.reduce((s,r)=>s+r[2],0),6821)
})
test('every lesson hotspot resolves to substantive Chinese annotation',()=>{
  for(const lesson of lessons) for(const step of lesson.steps) for(const h of step.hotspots){
    const tip=findTooltip(h.id)
    assert.ok(tip,`${step.id} / ${h.id} annotation missing`)
    for(const field of ['main','why','mechanism','counterfactual','anchor','example','computation','limit']) assert.ok(tip[field].length>3,`${h.id}.${field}`)
  }
  for(const id of ['soft','dark','hard','temperature','t2-scale','soft-kl','hard-loss','matching','specialist-results']){
    const tip=findTooltip(id)
    for(const f of ['example','computation','limit'])assert.ok(tip[f]?.length>20,`${id}.${f} missing detail`)
  }
})
test('source map covers Eq1–5 and Tables1–5, flags unproven specialist distillation and test-set calibration',()=>{
  const all=sourceInventory.map(x=>x.source+' '+x.detail).join('\n')
  for(const x of ['Eq.(1)','Eq.(2)–(4)','Eq.(5)','Table 1','Table 2','Tables 3–4','Table 5','未证明','测试集'])assert.ok(all.includes(x),x)
  const scenes=readFileSync(new URL('../src/components/paper/distillation/KDScenes.tsx',import.meta.url),'utf8')
  assert.ok(!scenes.includes('1.8 / temperature'))
  assert.ok(!scenes.includes('soft KL ≈ −Σ'))
  assert.ok(!scenes.includes('FIG. 1'))
  assert.ok(findTooltip('discussion-limit').main.includes('没有证明'))
})

test('all literal scene annotation IDs resolve instead of silently hiding details',()=>{
  const scenes=readFileSync(new URL('../src/components/paper/distillation/KDScenes.tsx',import.meta.url),'utf8')
  const ids=[...scenes.matchAll(/onHover\('([^']+)'\)/g)].map(m=>m[1])
  for(const id of new Set(ids))assert.ok(findTooltip(id),'unresolved visual node '+id)
})
