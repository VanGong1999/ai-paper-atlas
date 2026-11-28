import test from 'node:test'
import assert from 'node:assert/strict'
import { filterEvidenceRows, isolationBudget } from '../src/data/papers/deepseek-moe/evidence.ts'
import { moeLessons } from '../src/data/papers/deepseek-moe/content.ts'
test('filtering experiment rows preserves model identities in original header',()=>{
 const rows=[[{text:'Metric'},{text:'Dense'},{text:'MoE'}],[{text:'MMLU'},{text:'48.2'},{text:'45.0'}],[{text:'PIQA'},{text:'79.2'},{text:'80.2'}]]
 assert.deepEqual(filterEvidenceRows(rows,'MMLU'),rows.slice(0,2))
})
test('shared isolation preserves stored and active expert budgets',()=>{
 for(const ks of [0,1,2]){const b=isolationBudget(64,8,ks);assert.equal(b.routed+ks,64);assert.equal(b.topK+ks,8)}
})
test('specialization lesson preserves the actual masking and from-scratch controls',()=>{
 const a=moeLessons.find(l=>l.id==='ablation'),s=moeLessons.find(l=>l.id==='specialization')
 assert.match(JSON.stringify(a),/1\.808.*1\.806.*1\.811/)
 assert.match(JSON.stringify(s),/重新.*Top-K/)
 assert.match(JSON.stringify(s),/从零训练/)
})
