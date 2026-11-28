import fs from 'node:fs'
import path from 'node:path'

export const coveragePath = path.resolve('src/data/papers/coverage.ts')

export function readCoverageSource() {
  if (!fs.existsSync(coveragePath)) throw new Error(`Missing ${coveragePath}`)
  return fs.readFileSync(coveragePath, 'utf8')
}

export function auditCoverage(text = readCoverageSource()) {
  const ids = [...text.matchAll(/id:\s*'([^']+)'/g)].map(match => match[1])
  const sources = [...text.matchAll(/source:\s*'([^']+)'/g)].map(match => match[1])
  const attention = (text.match(/paper: 'attention'/g) ?? []).length
  const pagedattention = (text.match(/paper: 'pagedattention'/g) ?? []).length
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
  const missingSources = sources.filter(source => !source.trim())
  return {
    total: ids.length,
    byPaper: { attention, pagedattention },
    duplicateIds: [...new Set(duplicateIds)],
    missingSources,
    complete: ids.length >= 50 && duplicateIds.length === 0 && missingSources.length === 0,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = auditCoverage()
  console.log(JSON.stringify(result, null, 2))
  if (!result.complete) process.exitCode = 1
}
