import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import katex from 'katex'
import { chapters, benchmarks } from '../src/data/papers/deepseek-v2/content.ts'
import { concepts } from '../src/data/papers/deepseek-v2/concepts.ts'

test('all 19 chapters have valid prerequisite links and renderable formulas', () => {
  assert.equal(chapters.length,19)
  for(const c of chapters) {
    assert.equal(c.steps.length,4)
    for(const id of c.prerequisites) assert.ok(chapters.some(x=>x.id===id),id)
    for(const s of c.steps) {
      assert.ok(s.body.length>65,c.id+': '+s.title)
      assert.doesNotThrow(()=>katex.renderToString(s.formula,{throwOnError:true,displayMode:true}),c.id+': '+s.formula)
      assert.ok(!/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(s.formula),'Accidental JS escape in formula')
    }
  }
  for(const c of Object.values(concepts)) assert.doesNotThrow(()=>katex.renderToString(c.math,{throwOnError:true,displayMode:true}))
})
test('original inventory preserves all numbered equations and tables from arXiv v5', async () => {
  const s=JSON.parse(await readFile(new URL('../src/data/papers/deepseek-v2/source-inventory.json',import.meta.url),'utf8'))
  assert.deepEqual(s.formulas.map(f=>f.number),Array.from({length:47},(_,i)=>i+1))
  assert.deepEqual(s.tables.map(t=>t.number),Array.from({length:37},(_,i)=>i+1))
  for(const f of s.formulas) assert.doesNotThrow(()=>katex.renderToString(f.latex.replaceAll('\\mathds','\\mathbb').replaceAll('\\color[rgb]{0,0,1}',''),{throwOnError:true,displayMode:true}),`Original equation ${f.number}`)
  const table=s.tables.find(t=>t.number===2)
  const mmlu=table.rows.find(r=>r[0].text.startsWith('MMLU'))
  assert.deepEqual(mmlu.slice(2).map(c=>Number(c.text)),benchmarks[0].values)
})
