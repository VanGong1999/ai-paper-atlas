import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { figurePages, inventory, pdfPath } from './pagedattention-pdf-inventory.mjs'

test('pagedattention source PDF and page inventory exist', () => {
  assert.equal(fs.existsSync(pdfPath), true)
  const items = inventory()
  assert.equal(items.length, 19)
  assert.deepEqual(items.at(0), {
    number: 1,
    page: 1,
    asset: '/article/pagedattention/figures/page-01.png',
  })
  assert.equal(Object.keys(figurePages).length, 19)
  for (const item of items) assert.equal(fs.existsSync(`public${item.asset}`), true)
})
