import test from 'node:test'
import assert from 'node:assert/strict'
import { splitFormulaTerms } from '../src/components/paper/formulaTokens.ts'
test('formula hover does not mistake the V in Var for the Value tensor',()=>{
 const tokens=splitFormulaTerms('Var(QKᵀ) + V')
 assert.equal(tokens.filter(t=>t==='V').length,1)
 assert.ok(tokens.includes('Q'));assert.ok(tokens.includes('Kᵀ'))
 assert.ok(tokens.some(t=>t.includes('Var(')))
})
