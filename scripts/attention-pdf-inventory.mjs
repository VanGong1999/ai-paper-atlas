// Node >=22.18 and Python with pdfplumber. Set PDF_PYTHON if it is outside PATH.
// Use --scan to inspect the PDF independently of the TypeScript registries.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const asset = '/article/1706.03762v7.pdf'
const path = fileURLToPath(new URL('../public' + asset, import.meta.url))

function printedReferences(pages, headings) {
  const start = headings.find(h => h.text === 'References')
  const appendix = headings.find(h => h.text === 'Attention Visualizations')
  if (!start || !appendix) throw new Error('Missing PDF heading bounding References or Attention Visualizations')
  const entries = []
  for (let page = start.page; page < appendix.page; page++) {
    const lines = pages[page - 1].split('\n').slice(page === start.page ? start.line : 0)
    for (const line of lines) {
      if (line === String(page)) continue // printed page footer
      const marker = line.match(/^\[(\d+)\] /)
      if (marker) entries.push({ number: Number(marker[1]), page, text: line })
      else if (entries.length) entries.at(-1).text += '\n' + line
    }
  }
  return entries
}

function scan() {
  const pages = JSON.parse(execFileSync(process.env.PDF_PYTHON || 'python3', ['-c', `
import json, sys, pdfplumber
with pdfplumber.open(sys.argv[1]) as pdf:
    print(json.dumps([p.extract_text(x_tolerance=1.5) or '' for p in pdf.pages]))
  `, path], { encoding: 'utf8' }))

  const headings = []
  const captions = []
  const ranges = pages.map((text, index) => {
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      const location = { page: index + 1, line: i + 1, text: line }
      if (/^(Abstract|References|Attention Visualizations|Acknowledgements)\b|^\d+(?:\.\d+)* [A-Z][a-zA-Z -]+$/.test(line)) headings.push(location)
      if (/^(Figure|Table) \d+:/.test(line)) captions.push(location)
    })
    return { page: index + 1, lines: lines.length, characters: text.length, first: lines[0], last: lines.at(-1) }
  })
  const authorNotes = pages[0].match(/^∗Equal contribution\.[\s\S]*?^‡[^\n]+/m)?.[0]
  const references = printedReferences(pages, headings)
  const inventory = {
    asset, sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
    pageCount: pages.length, ranges, headings, captions, authorNotes, references,
  }
  return { pages, inventory }
}

function normalized(text) {
  return text.replace(/-\s*\n/g, '-').replace(/\s+/g, ' ').trim()
}

// A hyphen at a printed line break can be either discretionary or part of a name/title.
function citationPattern(printed) {
  const parts = printed.split('-\n').map(part => normalized(part).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp('^' + parts.join('-?') + '$')
}

async function validate(pages, inventory) {
  const { originals, pdfAsset } = await import('../src/data/papers/attention/originals-en.ts')
  const { fulltextZh } = await import('../src/data/papers/attention/fulltext-zh.ts')
  const { figures } = await import('../src/data/papers/attention/figures.ts')
  const { explainables } = await import('../src/data/papers/attention/explainables.ts')
  const { lessons } = await import('../src/data/papers/attention/lessons.ts')
  const issues = []

  function check(test, message) {
    if (!test) issues.push(message)
  }

  function checkSource(label, source, originalId) {
    const original = originals[originalId]
    check(original, `${label}: missing original ${originalId}`)
    if (!source?.section || !source.locator || !Number.isInteger(source.page)) {
      issues.push(`${label}: missing section, page or locator`)
      return
    }
    const end = source.endPage ?? source.page
    check(end >= source.page && end <= pages.length, `${label}: invalid page range ${source.page}–${end}`)
    check(normalized(pages[source.page - 1] ?? '').includes(source.locator),
      `${label}: missing "${source.locator}" on PDF page ${source.page}`)
    if (original) {
      const range = original.source
      check(source.section === range.section && source.page >= range.page && end <= (range.endPage ?? range.page),
        `${label}: outside cited section ${original.section}`)
    }
  }

  check(pdfAsset === asset, 'Original passages reference a different PDF asset')
  check(inventory.sha256 === 'bdfaa68d8984f0dc02beaca527b76f207d99b666d31d1da728ee0728182df697',
    'Supplied PDF differs from the edition used to verify the data')
  inventory.ranges.forEach(p => check(p.characters > 0, `No extractable text on page ${p.page}`))

  const sectionIds = Object.keys(originals)
  check(sectionIds.length === fulltextZh.length, 'English and Chinese section counts differ')
  const blocks = [...inventory.headings]
  if (inventory.authorNotes) blocks.splice(1, 0, { text: inventory.authorNotes, page: 1 })
  check(sectionIds.length === blocks.length, 'Section count differs from PDF content block count')
  for (const [i, heading] of blocks.entries()) {
    const section = fulltextZh[i]
    check(section?.source?.page === heading.page && heading.text.startsWith(section.source.locator),
      `Missing or out-of-order translation for "${heading.text}" (PDF p. ${heading.page})`)
  }
  for (const [i, section] of fulltextZh.entries()) {
    const label = `Section ${section.id}`
    check(section.originalId === sectionIds[i] && section.id === section.originalId, `${label}: bilingual order/ID mismatch`)
    check(section.paragraphs.length && section.paragraphs.every(p => p.trim()), `${label}: missing Chinese text`)
    checkSource(label, section.source, section.originalId)
    const en = originals[section.originalId]
    if (en?.source && section.source) {
      check(en.id === section.originalId && en.source.locator === section.source.locator &&
        en.source.page === section.source.page && en.source.endPage === section.source.endPage,
      `${label}: source differs between languages`)
      const range = pages.slice(en.source.page - 1, en.source.endPage ?? en.source.page).join('\n')
      const pageReference = `${en.section} · ${en.pdfNote}`
      // The bibliography spans printed page footers; compare its individual entries below.
      check(en.en && (section.id === 'references' || en.en === pageReference || normalized(range).includes(en.en)),
        `${label}: English excerpt missing from cited PDF pages ${en.pdfNote}`)
    }
  }

  const credits = fulltextZh.find(b => b.id === 'author-notes')?.paragraphs.join('\n') ?? ''
  check(inventory.authorNotes && originals['author-notes']?.en === normalized(inventory.authorNotes),
    'author-notes: incomplete English contribution or affiliation footnote on PDF page 1')
  for (const credit of ['∗', '贡献', '随机', 'Jakob', 'Ashish', 'Illia', 'Noam', 'Niki', 'Llion', 'Lukasz',
    'Aidan', '†', 'Google Brain', '‡', 'Google Research']) {
    check(credits.includes(credit), `author-notes: missing Chinese credit for ${credit} (PDF p. 1)`)
  }
  const englishRefs = originals.references?.en.split('\n') ?? []
  const chineseRefs = fulltextZh.find(b => b.id === 'references')?.paragraphs ?? []
  check(inventory.references.length > 0 && englishRefs.length === inventory.references.length &&
    chineseRefs.length === inventory.references.length, 'References: bibliography count differs from PDF')
  for (const [i, entry] of inventory.references.entries()) {
    const citation = englishRefs[i]
    const label = `References [${entry.number}] (PDF p. ${entry.page})`
    check(citation && citationPattern(entry.text).test(citation), `${label}: missing or incorrect English citation`)
    const zh = chineseRefs[i] ?? ''
    const translatedTitle = zh.match(/（题名中译：(.+)）$/u)?.[1] ?? ''
    check(citation && zh.startsWith(citation) && /\p{Script=Han}/u.test(translatedTitle),
      `${label}: missing or out-of-order citation or translated title in Chinese registry`)
  }

  const assets = figures.map(f => ({ id: f.id, originalAsset: f.originalAsset, source: f.source, redrawType: f.redrawType }))
  const assetIds = new Set(assets.map(a => a.id))
  check(assetIds.size === figures.length, 'Duplicate figure/table ID')
  for (const { page, text } of inventory.captions) {
    const locator = text.split(':')[0] + ':'
    check(figures.some(f => f.source.page === page && f.source.locator === locator),
      `Missing asset for ${locator} on page ${page}`)
  }
  for (const f of figures) {
    checkSource(f.id, f.source, f.originalId)
    const locator = `${f.kind} ${f.number}:`
    check(normalized(pages[f.source.page - 1] ?? '').includes(`${locator} ${f.caption}`),
      `${f.id}: caption missing from PDF page ${f.source.page}`)
    check(f.originalAsset === `${asset}#page=${f.source.page}`, `${f.id}: invalid original asset link`)
  }
  for (const [id, item] of Object.entries(explainables)) {
    checkSource(id, item.source, item.originalId)
    check(item.title && item.plain && item.role && item.detail.length && item.teachingExplanation && item.paperFact,
      `${id}: incomplete explainable`)
  }
  for (const lesson of lessons) {
    const nodes = new Set(lesson.nodes.map(n => n.id))
    for (const n of lesson.nodes) check(explainables[n.explainableId], `${lesson.id}/${n.id}: missing node explanation`)
    for (const edge of lesson.edges) check(edge.every(id => nodes.has(id)), `${lesson.id}: missing node for edge ${edge}`)
    for (const step of lesson.steps) {
      const primaryId = step.explainableIds[0]
      const primary = explainables[primaryId]
      const source = step.source
      check(primary && source && step.originalId === primary.originalId &&
        source.section === primary.source.section && source.locator === primary.source.locator &&
        source.page === primary.source.page && (source.endPage ?? source.page) === (primary.source.endPage ?? primary.source.page),
      `${lesson.id}/${step.id}: citation ${step.originalId} (${source?.locator}) disagrees with primary explainable "${primaryId}" (${primary?.originalId}, ${primary?.source.locator})`)
    }
    for (const item of [lesson, ...lesson.steps]) {
      const label = `${lesson.id}/${item.id}`
      checkSource(label, item.source, item.originalId)
      check(item.stage && item.explainableIds.length, `${label}: missing stage or explanation`)
      for (const id of item.figureIds) check(assetIds.has(id), `${label}: missing asset ${id}`)
      for (const id of item.explainableIds) check(explainables[id], `${label}: missing explanation ${id}`)
      for (const id of item.highlight ?? []) check(nodes.has(id), `${label}: missing highlighted node ${id}`)
    }
  }
  return {
    assets, sections: sectionIds.length, explainables: Object.keys(explainables).length,
    lessons: lessons.length, steps: lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0), issues,
  }
}

try {
  const { pages, inventory } = scan()
  if (!process.argv.includes('--scan')) {
    inventory.validation = await validate(pages, inventory)
    if (inventory.validation.issues.length) process.exitCode = 1
  }
  console.log(JSON.stringify(inventory, null, 2))
} catch (error) {
  console.error(JSON.stringify({ asset, error: error.message }))
  process.exitCode = 1
}
