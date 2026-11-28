import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('已收录论文列表只包含有可视化页面的论文', () => {
  return readFile(new URL('../src/data/papers/catalog.ts', import.meta.url), 'utf8').then(catalog => {
    assert.match(catalog, /\.filter\(\(e\) => hasInteractivePage\(e\)\)/)
    assert.match(catalog, /Boolean\(paperRegistry\[slug\]\)/)
  })
})
