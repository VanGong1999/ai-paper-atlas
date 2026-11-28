import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FigureGallery } from '../components/paper/pagedattention/FigureGallery'
import { KVCacheDiagram } from '../components/paper/pagedattention/KVCacheDiagram'
import { PagedAttentionStage } from '../components/paper/pagedattention/PagedAttentionStage'
import { allFigures } from '../data/papers/pagedattention/figures'
import { concepts } from '../data/papers/pagedattention/explainables'
import { lessons, type PagedHotspot } from '../data/papers/pagedattention/lessons'
import { findTooltip, tooltips } from '../data/papers/pagedattention/tooltips'
import { getCoverageForPaper, type CoverageItem } from '../data/papers/coverage'
import { PaperCoveragePanel } from '../components/paper/PaperCoveragePanel'
import { CrossPaperBridge } from '../components/paper/CrossPaperBridge'
import { ExplainableScope } from '../components/paper/Explainable'
import { SourceInventory } from '../components/paper/pagedattention/SourceInventory'
import { TooltipSections } from '../components/paper/pagedattention/PagedHelp'
import '../styles/pagedattention.css'

type ViewMode = 'learn' | 'cheatsheet' | 'figures' | 'fulltext' | 'pdf'

export function PagedAttentionPage() {
  const [mode, setMode] = useState<ViewMode>('learn')
  const [lessonIndex, setLessonIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [blockSize, setBlockSize] = useState(4)
  const [requestCount, setRequestCount] = useState(3)
  const [sharing, setSharing] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [playbackKey, setPlaybackKey] = useState(0)
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null)
  const [activeConcept, setActiveConcept] = useState('kv')
  const [activeFigure, setActiveFigure] = useState('fig-1')
  const lesson = lessons[lessonIndex]
  const step = lesson.steps[stepIndex]
  const concept = concepts.find(item => item.id === activeConcept) ?? concepts[0]
  const hotspot = step.hotspots.find(item => item.id === selectedHotspot) ?? null
  const flatSteps = useMemo(() => lessons.flatMap((item, index) => item.steps.map((entry, step) => ({ lesson: index, step, entry }))), [])
  const flatIndex = flatSteps.findIndex(item => item.lesson === lessonIndex && item.step === stepIndex)
  const pagedCoverage = getCoverageForPaper('pagedattention')

  useEffect(() => { setSelectedHotspot(null); setActiveConcept(step.conceptIds[0] ?? 'kv') }, [lessonIndex, stepIndex, step.conceptIds])
  useLayoutEffect(() => { document.querySelector<HTMLElement>('.pa-detail-scroll')?.scrollTo({ top: 0 }) }, [lessonIndex, stepIndex, selectedHotspot])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('input,textarea,select,button,[contenteditable=true]')) return
      if (event.key === '[') setBlockSize(value => value > 4 ? 4 : 2)
      if (event.key === ']') setBlockSize(value => value < 4 ? 4 : 8)
      if (event.key === '-') setRequestCount(value => Math.max(1, value - 1))
      if (event.key === '=') setRequestCount(value => Math.min(6, value + 1))
      if (event.key.toLowerCase() === 'c') setSharing(value => !value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function selectLesson(index: number) { setLessonIndex(index); setStepIndex(0); setMode('learn') }
  function selectFlat(index: number) {
    const next = flatSteps[Math.max(0, Math.min(flatSteps.length - 1, index))]
    setLessonIndex(next.lesson); setStepIndex(next.step); setMode('learn')
  }

  return <ExplainableScope><div className="pa-reader">
    <header className="pa-reader-header">
      <button type="button" className="pa-reader-brand" onClick={() => selectLesson(0)}><span className="pa-brandmark">✳</span><span><strong>ORBIT</strong><small>RESEARCH ATLAS</small></span></button>
      <nav className="pa-mode-tabs" aria-label="论文视图模式">
        {([['learn', '交互导读'], ['cheatsheet', '速查表'], ['figures', 'Figures'], ['fulltext', '中文分节导读'], ['pdf', 'PDF']] as [ViewMode, string][]).map(([value, label]) => <button type="button" key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}
      </nav>
      <div className="pa-reader-actions"><a href="https://arxiv.org/abs/2309.06180" target="_blank" rel="noreferrer">arXiv ↗</a><Link to="/">← 返回时间线</Link></div>
    </header>
    {mode === 'learn' && <div className="pa-reader-body">
      <aside className="pa-course-nav" aria-label="论文章节导航"><div className="pa-course-head"><strong>论文导读</strong><span>{flatIndex + 1}/{flatSteps.length} STEPS</span></div><progress max={flatSteps.length} value={flatIndex + 1} aria-label="论文阅读进度" />{lessons.map((item, index) => <div className="pa-course-group" key={item.id}><button type="button" className={`pa-course-section ${lessonIndex === index ? 'active' : ''}`} onClick={() => selectLesson(index)}><span>{String(item.index).padStart(2, '0')}</span><strong>{item.title}</strong><small>{item.steps.length}</small></button>{lessonIndex === index && <div className="pa-course-steps">{item.steps.map((entry, childIndex) => <button type="button" key={entry.id} className={stepIndex === childIndex ? 'active' : ''} onClick={() => { setStepIndex(childIndex); setMode('learn') }}>{entry.title}<small>{entry.eyebrow}</small></button>)}</div>}</div>)}<div className="pa-course-footer"><a href="/article/pagedattention/2309.06180v1.pdf" target="_blank" rel="noreferrer">原文 PDF ↗</a><Link to="/library">论文库</Link></div></aside>
      <main className="pa-stage-column"><div className="pa-stage-heading"><div><span className="pa-kicker">{step.eyebrow}</span><h1>{step.title}</h1><p>{lesson.subtitle}</p></div><div className="pa-stage-controls"><button type="button" onClick={() => { setPlaybackKey(value => value + 1); setPlaying(true) }} aria-label="重放本步动画">↻</button><button type="button" className={playing ? 'active' : ''} onClick={() => setPlaying(value => !value)} aria-label={playing ? '暂停动画' : '播放动画'}>{playing ? 'Ⅱ' : '▶'}</button><span>{Math.round((flatIndex + 1) / flatSteps.length * 100)}%</span></div></div><div className="pa-visible-controls" aria-label="教学沙盘参数"><label>块大小 B<select aria-label="教学块大小" value={blockSize} onChange={e => setBlockSize(Number(e.target.value))}>{[2,4,8].map(n=><option key={n} value={n}>{n} tokens</option>)}</select></label><label>对比请求数<input type="range" aria-label="教学请求数" min="1" max="6" value={requestCount} onChange={e=>setRequestCount(Number(e.target.value))}/><output>{requestCount}</output></label><label><input type="checkbox" checked={sharing} onChange={e=>setSharing(e.target.checked)}/>共享场景初始 fork</label><small>B=2/4/8用于教学；原文默认16</small></div><div className="pa-stage-frame">{lesson.id === 'source' ? <SourceStage activeFigure={activeFigure} onSelect={setActiveFigure} /> : <PagedAttentionStage step={step} blockSize={blockSize} requestCount={requestCount} sharing={sharing} playing={playing} playbackKey={playbackKey} activeHotspot={selectedHotspot} onHoverHotspot={setSelectedHotspot} />}</div><div className="pa-stage-legend"><span><i className="legend-shared" /> shared / reusable</span><span><i className="legend-physical" /> physical block</span><span><i className="legend-logical" /> logical sequence</span><small>悬浮 / 聚焦标签查看详解；点击检查状态</small></div><div className="pa-bottom-nav"><button type="button" disabled={flatIndex <= 0} onClick={() => selectFlat(flatIndex - 1)}>←</button><span>STEP {flatIndex + 1} / {flatSteps.length}</span><button type="button" disabled={flatIndex >= flatSteps.length - 1} onClick={() => selectFlat(flatIndex + 1)}>→</button><div className="pa-step-pills">{lesson.steps.map((entry, index) => <button type="button" className={index === stepIndex ? 'active' : ''} key={entry.id} onClick={() => setStepIndex(index)}>{index + 1} {entry.title}</button>)}</div></div></main>
      <aside className="pa-detail-panel" aria-label="步骤详解与悬浮注解"><div className="pa-detail-scroll"><div className="pa-detail-kicker">{hotspot ? 'HOVER ANNOTATION' : '本步解释'}<span>STEP {stepIndex + 1}/{lesson.steps.length}</span></div>{hotspot ? <HotspotDetail hotspot={hotspot} onClear={() => setSelectedHotspot(null)} /> : <><SourceRefs figureIds={step.figureIds} /><h2>{step.fact}</h2><section><h3>论文原意</h3><p className="pa-paper-fact">{step.fact}</p>{step.formula && <code className="pa-formula">{step.formula}</code>}</section><section><h3>第一性原理解释</h3><p>{step.explanation}</p></section><section><h3>概念跳转</h3><div className="pa-concept-list">{concepts.filter(item => step.conceptIds.includes(item.id)).map(item => <button type="button" className={activeConcept === item.id ? 'active' : ''} key={item.id} onClick={() => setActiveConcept(item.id)}>{item.label}</button>)}</div></section><div className="pa-detail-callout"><strong>{concept.title}</strong><p>{concept.plain}</p><small>{concept.why}</small></div></>}</div><div className="pa-detail-footer"><span>HOVER A NODE TO INSPECT</span><button type="button" onClick={() => setSelectedHotspot(step.hotspots[0]?.id ?? null)}>查看本步重点</button></div></aside>
    </div>}
    {mode === 'cheatsheet' && <CheatSheet coverage={pagedCoverage.items} />}
    {mode === 'figures' && <div className="pa-full-panel"><FigureGallery figures={allFigures} activeId={activeFigure} onSelect={setActiveFigure} /></div>}
    {mode === 'fulltext' && <FulltextView />}
    {mode === 'pdf' && <div className="pa-pdf-panel"><iframe src="/article/pagedattention/2309.06180v1.pdf" title="PagedAttention PDF" /></div>}
  </div></ExplainableScope>
}

function SourceRefs({ figureIds }: { figureIds: string[] }) { return <div className="pa-source-refs"><span>SOURCE</span>{figureIds.slice(0, 5).map(id => <a key={id} href={`/article/pagedattention/2309.06180v1.pdf#page=${allFigures.find(item => item.id === id)?.page ?? 1}`} target="_blank" rel="noreferrer">{id.startsWith('table-') ? id.replace('table-', 'Table ') : id.replace('fig-', 'Figure ')} ↗</a>)}</div> }
function HotspotDetail({ hotspot, onClear }: { hotspot: PagedHotspot; onClear: () => void }) {
  const tooltip = findTooltip(hotspot.label)
  return <><div className="pa-hover-title"><span>⌁ 本步节点</span><button type="button" aria-label="关闭节点详解" onClick={onClear}>×</button></div><h2>{tooltip?.term ?? hotspot.label}</h2><p className="pa-paper-fact">{hotspot.plain}</p><p>{hotspot.detail}</p>{tooltip ? <><p className="pa-paper-fact">{tooltip.main}</p><TooltipSections tooltip={tooltip}/><div className="pa-tooltip-anchor"><span>论文锚点</span><strong>{tooltip.anchor}</strong></div></> : <div className="pa-detail-callout"><strong>来源与边界</strong><p>这是本步的教学概括。论文事实与对应图表请通过 SOURCE 链接回到原文核对；不是额外测量结果。</p></div>}</>
}
function SourceStage({ activeFigure, onSelect }: { activeFigure: string; onSelect: (id: string) => void }) { const figure = allFigures.find(item => item.id === activeFigure) ?? allFigures[0]; return <div className="pa-source-stage"><div className="pa-source-stage-caption"><strong>{figure.kind==='table'?'Table':'Figure'} {figure.number} · {figure.title}</strong><p>{figure.interpretation}</p><a href={`/article/pagedattention/2309.06180v1.pdf#page=${figure.page}`} target="_blank" rel="noreferrer">完整原文页 p.{figure.page} ↗</a></div><img src={figure.originalAsset} alt={`论文第${figure.page}页，含${figure.kind==='table'?'表':'图'}${figure.number}`} /><div className="pa-source-strip">{allFigures.map(item => <button type="button" aria-label={`${item.kind==='table'?'Table':'Figure'} ${item.number}: ${item.title}`} key={item.id} className={item.id === activeFigure ? 'active' : ''} onClick={() => onSelect(item.id)}><img src={item.originalAsset} alt="" /><span>{item.kind==='table'?'TABLE':'FIG'} {item.number}</span></button>)}</div></div> }
function CheatSheet({ coverage }: { coverage: CoverageItem[] }) { return <div className="pa-mode-panel"><div className="pa-mode-heading"><span className="pa-kicker">CHEATSHEET / SOURCE-ALIGNED GLOSSARY</span><h1>PagedAttention 速查</h1><p>术语给出定义、输入输出、计算示例、工程实现与适用边界；沙盘悬浮使用同一套文案。逐节索引明确区分可操作内容、概括与仅保留原文的部分。</p></div><div className="pa-cheat-grid">{[['01', 'KV Cache', 'decode 阶段逐 token 增长的历史 K/V。它是服务吞吐的主要动态内存。'], ['02', 'Paging', '固定大小 block + block table，逻辑连续与物理连续解耦。'], ['03', 'Sharing', '共享只读前缀，发生写入时 copy-on-write。'], ['04', 'Scheduling', 'scheduler 把 block 预算纳入 continuous batching。'], ['05', 'Payoff', '更少浪费 → 更大 batch → 同延迟下更高 throughput。'], ['06', 'Evidence', '图 1–19、表 1 与 PDF 保留完整证据链。']].map(item => <article key={item[0]}><span>{item[0]}</span><h2>{item[1]}</h2><p>{item[2]}</p></article>)}</div><SourceInventory /><PaperCoveragePanel paper="pagedattention" items={coverage} /><CrossPaperBridge activePaper="pagedattention" /><section className="pa-term-sheet" aria-label="完整术语速查">{tooltips.map(item => <article className="pa-term-card" key={item.id}><header><span className="pa-kicker">{item.id}</span><h2>{item.term}</h2></header><p className="pa-term-main"><strong>一句话定义：</strong>{item.main}</p><TooltipSections tooltip={item}/><small>论文锚点：{item.anchor}</small></article>)}</section><KVCacheDiagram blockSize={4} requestCount={4} sharing /></div> }

function FulltextView() { return <div className="pa-mode-panel pa-fulltext"><div className="pa-mode-heading"><span className="pa-kicker">中文分节导读 / SOURCE REVIEW</span><h1>从原文到可验证的机制</h1><p>这是中文分节概括和教学解释，不是逐句全文翻译。下面索引覆盖原文的章节、公式与图表；鸣谢和64条参考文献保留于PDF。</p></div><SourceInventory /><div className="pa-fulltext-grid">{lessons.filter(lesson=>lesson.id!=='source').map(lesson => <article key={lesson.id}><span className="pa-kicker">{String(lesson.index).padStart(2, '0')} · {lesson.title}</span>{lesson.steps.map(step => <section key={step.id}><h2>{step.title}</h2><SourceRefs figureIds={step.figureIds}/><p><strong>{step.fact}</strong></p>{step.formula&&<code className="pa-formula">{step.formula}</code>}<p>{step.explanation}</p></section>)}</article>)}</div></div> }
