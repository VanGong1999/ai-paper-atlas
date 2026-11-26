// Read-only. Requires Node 22.18+ and the reader asset generator's Python environment.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { explainables } from '../src/data/papers/attention/explainables.ts'
import { figures } from '../src/data/papers/attention/figures.ts'
import { fulltextZh } from '../src/data/papers/attention/fulltext-zh.ts'
import { furtherReading, lessons } from '../src/data/papers/attention/lessons.ts'
import { originals } from '../src/data/papers/attention/originals-en.ts'
import { paperTables, table3Context } from '../src/components/paper/paperTables.ts'

const root = new URL('../', import.meta.url)
const cwd = fileURLToPath(root)
const compact = text => text.replace(/\s+/g, '')
const plain = text => text.replace(/\s+/g, ' ').trim()
const offPaper = /\b(?:BERT|(?:Chat)?GPT(?:-\d+)?|FlashAttention\d*|MLA|RoPE|KV[ -]cache)\b|聊天模型|工具调用|\bMoE 与 MLA\b/i

// Evidence spans are on one-based physical pages of the supplied edition.
const claims = [
  ['28.4/41.8 BLEU · Abstract', 1, 'abstract',
    [/28\.4 BLEU on the WMT 2014 English- to-German/, /English-to-French translation task, our model.*BLEU score of 41\.8/],
    [/英译德.*28\.4 BLEU/, /英译法.*41\.8 BLEU/], 'contribution', [/摘要.*28\.4 BLEU.*41\.8 BLEU/]],
  ['41.0 BLEU · §6.1 prose; 41.8 · Abstract and Table 2', 8, 'sec6-1',
    [/Transformer \(big\) 28\.4 41\.8/, /English-to-French translation task, our big model achieves a BLEU score of 41\.0/,
      /dropout rate P = 0\.1, instead of 0\.3/],
    [/正文报告大模型取得 41\.0 BLEU.*0\.3 调为 0\.1.*译注：摘要与第 8 页表 2.*41\.8/],
    'bleu', [/表 2.*41\.8.*§6\.1 正文.*41\.0/]],
  ['base encoder/decoder depth and model width · §3.1', 3, 'sec3-1',
    [/Encoder:.*N = 6/, /Decoder:.*N = 6/, /produce outputs of dimension d = 512/],
    [/编码器堆叠 N=6.*d_model=512/, /解码器也堆叠 N=6/], 'encoder', [/6 个.*512/]],
  ['base head count and Q/K/V dimensions · §3.2.2', 5, 'sec3-2-2',
    [/h = 8 parallel attention layers/, /d = d = d \/h = 64/],
    [/h=8.*dₖ=dᵥ=d_model\/h=64/], 'heads', [/h=8.*dₖ=dᵥ=d_model\/h=64/]],
  ['FFN model and inner dimensions · §3.3', 5, 'sec3-3',
    [/input and output is d = 512.*inner-layer has dimensionality (?:model )?d = 2048/],
    [/d_model=512.*d_ff=2048/], 'ffn', [/512、2048、512/]],
  ['corpus sizes, vocabularies and two-sided batch tokens · §5.1', 7, 'sec5-1',
    [/4\.5 million sentence pairs/, /37000 tokens/, /36M sentences/, /32000 word-piece/, /25000 source tokens and 25000 target tokens/],
    [/450 万个句对.*37000.*3600 万个句子.*32000.*25000 个源词元和 25000 个目标词元/],
    'batch', [/450 万句对.*37000.*3600 万句.*32000/, /25000 个源词元和 25000 个目标词元/]],
  ['P100 count, steps, step time and total time · §5.2', 7, 'sec5-2',
    [/8 NVIDIA P100 GPUs/, /0\.4 seconds.*100,000 steps or 12 hours/, /1\.0 seconds.*300,000 steps \(3\.5 days\)/],
    [/8 块 NVIDIA P100 GPU.*0\.4 秒.*100000 步.*12 小时.*1\.0 秒.*300000 步.*3\.5 天/],
    'hardware', [/8 块 P100/, /0\.4 秒\/步.*100000 步.*1\.0 秒\/步.*300000 步/, /12 小时.*3\.5 天/]],
  ['Adam parameters and warmup · §5.3', 7, 'sec5-3',
    [/β = 0\.9, β = 0\.98 and ϵ = 10−9/, /warmup_steps = 4000/],
    [/β₁=0\.9、β₂=0\.98、ε=10⁻⁹/, /warmup_steps=4000/], 'optimizer', [/β₁=0\.9、β₂=0\.98、ε=10⁻⁹/, /4000 个预热步/]],
  ['regularization lead-in · §5.4', 7, 'sec5-4',
    [/We employ three types of regularization during training/],
    [/三种正则化。译注：.*残差 dropout 与标签平滑两个具名段落/]],
  ['base residual dropout and label smoothing · §5.4', 8, 'sec5-4',
    [/Residual Dropout.*P = 0\.1/, /Label Smoothing.*ϵ = 0\.1/],
    [/P_drop=0\.1.*ε_ls=0\.1/], 'dropout', [/P_drop=0\.1/]],
  ['test conditions for machine translation · §6.1', 8, 'sec6-1',
    [/last 5 checkpoints.*10-minute intervals.*last 20 checkpoints/, /beam size of 4 and length penalty α = 0\.6/, /input length \+ 50/],
    [/10 分钟.*最后 5 个.*最后 20 个.*束宽为 4.*α=0\.6.*输入长度加 50/]],
  ['WSJ parsing results under separate training conditions · §6.3 and Table 4', 10, 'sec6-3',
    [/Transformer \(4 layers\) WSJ only, discriminative 91\.3/, /Transformer \(4 layers\) semi-supervised 92\.7/, /beam size of 21 and α = 0\.3/],
    [/仅用 WSJ.*91\.3，半监督为 92\.7/, /束宽均为 21，α=0\.3/], 'parsing', [/91\.3 F1.*92\.7 F1/]],
  ['stated future research · §7', 10, 'sec7',
    [/plan to extend.*other than text.*local, restricted attention.*Making generation less sequential/],
    [/计划.*非文本.*局部、受限的注意力.*另一个研究目标是减少生成过程中的顺序计算/]],
]

// The visual notation below was transcribed from the equation layouts. The
// PDF text layer flattens fractions, subscripts and exponents.
const formulas = [
  ['sec3-1', 3, 'LayerNorm(x + Sublayer(x))', 'ffn/res'],
  ['sec3-2-1', 4, 'Attention(Q,K,V) = softmax(QKᵀ/√dₖ)V', 'sdp/scale'],
  ['sec3-2-2', 5, 'MultiHead(Q,K,V) = Concat(head₁,…,headₕ)Wᴼ'],
  ['sec3-2-2', 5, 'headᵢ = Attention(QWᵢᑫ, KWᵢᴷ, VWᵢⱽ)'],
  ['sec3-3', 5, 'FFN(x) = max(0, xW₁ + b₁)W₂ + b₂', 'ffn/ffn'],
  ['sec3-4', 5, '√d_model'],
  ['sec3-5', 6, 'PE(pos,2i) = sin(pos/10000^(2i/d_model))'],
  ['sec3-5', 6, 'PE(pos,2i+1) = cos(pos/10000^(2i/d_model))'],
  ['sec5-3', 7, 'lrate = d_model^(-0.5) · min(step_num^(-0.5), step_num · warmup_steps^(-1.5))'],
]
const positionFormula = 'θ = pos / 10000^(2i/d_model)，PE(pos,2i) = sin θ，PE(pos,2i+1) = cos θ'

const trainingFacts = [
  ['batch', 'sec5-1', 7, [/450 万句对/, /37000/, /3600 万句/, /32000/, /25000 个源词元/, /25000 个目标词元/], [/25000 个源词元/, /25000 个目标词元/]],
  ['hardware', 'sec5-2', 7, [/8 块 P100/, /0\.4 秒/, /100000 步/, /12 小时/, /1\.0 秒/, /300000 步/, /3\.5 天/], [/12 小时/, /3\.5 天/]],
  ['optimizer', 'sec5-3', 7, [/β₁=0\.9/, /β₂=0\.98/, /ε=10⁻⁹/, /4000 个预热步/, /warmup\^\(-1\.5\)/], [/4000 个预热步/, /warmup\^\(-1\.5\)/]],
  ['dropout', 'sec5-4', 8, [/P_drop=0\.1/], [/P_drop=0\.1/]],
  ['smoothing', 'sec5-4', 8, [/ε_ls=0\.1/], [/ε_ls=0\.1/]],
]

const appendixFacts = {
  'figure-3': { page: 13, pattern: /^图 3（第 13 页）展示了编码器 6 层中第 5 层的自注意力/ },
  'figure-4': { page: 14, pattern: /^图 4（第 14 页）中，同一层的两个头似乎参与了指代消解/ },
  'figure-5': { page: 15, pattern: /^图 5（第 15 页）展示了同一层中两个不同的编码器自注意力头/ },
}

const tableColumns = {
  complexity: ['Layer Type', 'Complexity per Layer', 'Sequential Operations', 'Maximum Path Length'],
  translation: ['Model', 'BLEU · EN-DE', 'BLEU · EN-FR', 'FLOPs · EN-DE', 'FLOPs · EN-FR'],
  variants: ['Model', 'N', 'd_model', 'd_ff', 'h', 'dₖ', 'dᵥ', 'P_drop', 'ϵ_ls', 'train steps', 'PPL (dev)', 'BLEU (dev)', 'params ×10⁶'],
  parsing: ['Parser', 'Training', 'WSJ 23 F1'],
}

function runJson(command, args) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
  if (result.error) throw result.error
  if (!result.stdout) throw new Error(result.stderr.trim() || `${command} exited ${result.status}`)
  return JSON.parse(result.stdout)
}

function normalizeCell(cell) {
  if (cell === null) return null
  if (typeof cell === 'object') return { text: normalizeCell(cell.text), span: cell.span }
  // Preserve superscript exponents. NFKC would turn 10¹⁹ into 1019.
  return compact(cell)
    .replace(/10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g, (_, exponent) => `10^${exponent
      .replaceAll('⁰', '0').replaceAll('¹', '1').replaceAll('²', '2').replaceAll('³', '3')
      .replaceAll('⁴', '4').replaceAll('⁵', '5').replaceAll('⁶', '6').replaceAll('⁷', '7')
      .replaceAll('⁸', '8').replaceAll('⁹', '9').replaceAll('⁻', '-')}`)
    .replace(/([a-z])([¹²³⁴⁵⁶⁷⁸⁹])/g, (_, base, exponent) => `${base}${
      { '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }[exponent]}`)
}

export function audit() {
  const inventory = runJson(process.execPath, ['scripts/attention-pdf-inventory.mjs', '--validate'])
  if (inventory.error) throw new Error(inventory.error)
  const { reading, pages, tables, previews } = runJson(process.env.PDF_PYTHON || 'python3',
    ['scripts/attention-reader-assets.py', '--audit'])
  const actualReading = JSON.parse(readFileSync(new URL('src/components/paper/attention-original-text.json', root), 'utf8'))
  const issues = [...inventory.validation.issues]
  const check = (condition, issue) => { if (!condition) issues.push(issue) }
  const chinese = new Map(fulltextZh.map(block => [block.id, block.paragraphs.join(' ')]))
  const steps = new Map(lessons.flatMap(lesson => lesson.steps.map(step => [`${lesson.id}/${step.id}`, step])))
  const cited = new Set(lessons.flatMap(lesson => [
    ...lesson.explainableIds, ...lesson.nodes.map(node => node.explainableId),
    ...lesson.steps.flatMap(step => step.explainableIds),
  ]))

  for (const [id, section, page, patterns, lessonPatterns] of trainingFacts) {
    const entry = explainables[id]
    const lessonStep = steps.get(`train/${id === 'smoothing' ? 'labels' : id === 'dropout' ? 'reg' : id === 'optimizer' ? 'opt' : id === 'hardware' ? 'size' : 'batch'}`)
    const entryCopy = [entry?.title, entry?.plain, ...(entry?.detail ?? []), entry?.paperFact, entry?.teachingExplanation].filter(Boolean).join(' ')
    const lessonCopy = [lessonStep?.title, lessonStep?.body, lessonStep?.paperFact, lessonStep?.teachingExplanation].filter(Boolean).join(' ')
    check(entry?.source?.section === originals[entry.originalId]?.source.section && entry.source.page === page && entry.originalId === section,
      `${id}: training fact source must be ${section} p. ${page}`)
    check(lessonStep?.source?.section === originals[lessonStep.originalId]?.source.section && lessonStep.source.page === page && lessonStep.originalId === section,
      `${id}: Learn entry source must be ${section} p. ${page}`)
    check(patterns.every(pattern => pattern.test(entryCopy)), `${id}: training fact value or schedule differs from PDF-grounded expected values`)
    check(lessonPatterns.every(pattern => pattern.test(lessonCopy)), `${id}: Learn training fact value or schedule differs from PDF-grounded expected values`)
  }

  check(isDeepStrictEqual(Object.keys(actualReading), Object.keys(reading)), 'English reader: missing or out-of-order PDF blocks')
  for (const [id, paragraphs] of Object.entries(reading)) {
    check(isDeepStrictEqual(actualReading[id], paragraphs), `English reader/${id}: differs from supplied PDF extraction`)
  }

  const claimResults = claims.map(([claim, page, id, fromPdf, fromChinese, explanation, fromLearn]) => {
    const pdfText = plain(pages[page - 1])
    const entry = explainables[explanation]
    const matches = fromPdf.every(pattern => pattern.test(pdfText)) &&
      fromChinese.every(pattern => pattern.test(chinese.get(id) ?? '')) &&
      (fromLearn ?? []).every(pattern => pattern.test([entry.plain, ...entry.detail, entry.paperFact].join(' ')))
    check(matches, `${claim}: PDF p. ${page} or workbench copy (${id}) differs from the audited reading`)
    return { claim, page, section: id, matches }
  })

  const formulaKey = text => compact(text.replace(/[…]/g, '...').replace(/\^−([\d.]+)/g, '^(-$1)'))
  const formulaResults = formulas.map(([id, page, formula, learn]) => {
    const needle = formulaKey(formula)
    const matches = formulaKey(reading[id].join(' ')).includes(needle) &&
      formulaKey(chinese.get(id) ?? '').includes(needle) &&
      (!learn || formulaKey(steps.get(learn)?.formula ?? '') === needle)
    check(matches, `${learn ?? id}: formula differs from PDF p. ${page}: ${formula}`)
    return { section: id, page, formula, matches }
  })
  const learnFormulas = new Set(formulas.flatMap(([, , , id]) => id ? [id] : []))
  check(steps.get('posenc/sin')?.formula === positionFormula, 'posenc/sin: Learn phase formula differs from PDF p. 6')
  learnFormulas.add('posenc/sin')

  const missingPreviews = []
  const tableResults = []
  const figureResults = []
  const checkExplainable = (entry, label) => {
    const { page, section, locator } = entry.source ?? {}
    const range = originals[entry.originalId]?.source
    check(range && page >= range.page && page <= (range.endPage ?? range.page) &&
      range.section === section && locator && plain(pages[page - 1] ?? '').includes(locator),
    `${label}: missing or incorrect PDF locator`)
    check(entry.paperFact?.trim() && entry.teachingExplanation?.trim(), `${label}: missing paper fact or teaching label content`)
  }

  for (const figure of figures) {
    const { id, kind, source: { page }, redrawType, title, originalAsset } = figure
    const preview = previews[`${id}-p${page}`] ?? 'missing'
    if (preview === 'missing') missingPreviews.push({ id, page, fallback: originalAsset })
    check(preview === 'matches PDF crop', `${id}: preview ${preview}`)
    check(title?.trim(), `${id}: missing display title`)
    if (kind === 'Figure') {
      figureResults.push({ id, page, preview })
      continue
    }

    const table = paperTables[redrawType]
    const expected = tables[id] ?? []
    const headers = [table.firstColumn, ...table.columns.map(column => column.label)]
    check(isDeepStrictEqual(headers, tableColumns[redrawType]), `${kind} ${figure.number}: incorrect column labels or order`)
    check(table.rows.length === expected.length, `${kind} ${figure.number}: PDF row count differs`)
    let matchedRows = 0
    for (const [index, row] of table.rows.entries()) {
      const actual = [row.label, ...row.cells].map(normalizeCell)
      const printed = expected[index]?.map(normalizeCell)
      if (isDeepStrictEqual(actual, printed)) matchedRows++
      else {
        const message = `${kind} ${figure.number} (p. ${page}) row ${index + 1} (${row.label}): expected ${JSON.stringify(printed)}, got ${JSON.stringify(actual)}`
        issues.push(/10\^\d+/.test(JSON.stringify(printed)) || /10\^\d+/.test(JSON.stringify(actual))
          ? `${message} · scientific notation exponent structure differs`
          : message)
      }
      if (row.content) checkExplainable(row.content, `${id} row ${index + 1}`)
      for (const cell of row.cells) {
        if (cell?.content) checkExplainable(cell.content, `${id} row ${index + 1} cell`)
      }
    }
    for (const column of table.columns) {
      check(explainables[column.explanation], `${id}/${column.label}: unresolved explanation ${column.explanation}`)
      cited.add(column.explanation)
      if (column.content) checkExplainable(column.content, `${id}/${column.label}`)
    }
    tableResults.push({ id, page, rows: expected.length, matchedRows, preview })
  }
  for (const [id, entry] of Object.entries(table3Context)) checkExplainable(entry, `table-3 context/${id}`)

  const appendix = fulltextZh.find(block => block.id === 'appendix')
  for (const [figureId, expected] of Object.entries(appendixFacts)) {
    const figure = figures.find(item => item.id === figureId)
    const paragraph = appendix?.paragraphs.find(text => text.startsWith(`图 ${figure?.number}`)) ?? ''
    check(figure?.originalId === 'appendix' && figure.source.page === expected.page,
      `${figureId}: appendix source mapping is incorrect`)
    check(expected.pattern.test(paragraph), `${figureId}: appendix caption is missing or attached to the wrong stable figure ID`)
  }

  const offPaperContent = []
  const checkMainCopy = (label, text) => {
    if (offPaper.test(text)) offPaperContent.push(label)
  }
  for (const [id, item] of Object.entries(explainables)) {
    checkMainCopy(id, [item.title, item.plain, item.role, ...item.detail, item.paperFact, item.misconception].join(' '))
  }
  for (const [id, text] of chinese) {
    if (id !== 'references') checkMainCopy(id, text)
  }
  for (const lesson of lessons) {
    checkMainCopy(lesson.id, [lesson.title, lesson.subtitle, ...lesson.learn, ...lesson.nodes.map(node => node.label)].join(' '))
  }
  for (const [id, step] of steps) {
    const primary = explainables[step.explainableIds[0]]
    checkMainCopy(id, step.body.replace(` 教学解释：${step.teachingExplanation}`, ''))
    check(primary && step.title === primary.title && step.paperFact === primary.paperFact &&
      step.teachingExplanation === primary.teachingExplanation && isDeepStrictEqual(step.diffs, primary.detail) &&
      step.body === `${primary.plain} ${primary.paperFact} 教学解释：${primary.teachingExplanation}`,
    `${id}: copy outside its sourced explanation or explicit teaching field`)
    check(!step.formula || learnFormulas.has(id), `${id}: unaudited Learn formula`)
  }
  for (const label of offPaperContent) issues.push(`${label}: off-paper topic in main content`)

  const orphanedExplainables = Object.keys(explainables).filter(id => !cited.has(id))
  for (const id of orphanedExplainables) issues.push(`Orphaned explainable: ${id}`)
  check(furtherReading.title === '延伸阅读' && furtherReading.visibleByDefault === false,
    'Off-paper reading must be marked as extension content and hidden by default')

  return {
    pdf: { asset: inventory.asset, sha256: inventory.sha256, pages: inventory.pageCount },
    coverage: {
      sections: inventory.validation.sections,
      englishReaderBlocksMatchingPdf: Object.entries(reading).filter(([id, blocks]) => isDeepStrictEqual(actualReading[id], blocks)).length,
      references: inventory.references.length,
      appendixCaptions: reading.appendix.length,
      stableAppendixCaptions: Object.keys(appendixFacts).length,
      lessons: lessons.length,
      steps: steps.size,
      explainables: Object.keys(explainables).length,
      keyClaims: { matched: claimResults.filter(result => result.matches).length, total: claims.length },
      formulas: { matched: formulaResults.filter(result => result.matches).length, total: formulas.length },
    },
    claims: claimResults, formulas: formulaResults, figures: figureResults, tables: tableResults,
    missingPreviews, orphanedExplainables, offPaperContent,
    teaching: {
      stepsWithSeparateExplanation: [...steps.values()].filter(step => step.teachingExplanation?.trim()).length,
      hiddenExtensionTopics: furtherReading.topics,
    },
    issues,
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const report = audit()
    console.log(JSON.stringify(report, null, 2))
    if (report.issues.length) process.exitCode = 1
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
