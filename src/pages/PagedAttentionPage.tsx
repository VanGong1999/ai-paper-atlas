import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FigureGallery } from '../components/paper/pagedattention/FigureGallery'
import { KVCacheDiagram } from '../components/paper/pagedattention/KVCacheDiagram'
import { PagedAttentionStage } from '../components/paper/pagedattention/PagedAttentionStage'
import { allFigures } from '../data/papers/pagedattention/figures'
import { concepts } from '../data/papers/pagedattention/explainables'
import { lessons, type PagedHotspot } from '../data/papers/pagedattention/lessons'
import { findTooltip, tooltips } from '../data/papers/pagedattention/tooltips'
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

  useEffect(() => setSelectedHotspot(null), [lessonIndex, stepIndex])
  useLayoutEffect(() => { document.querySelector<HTMLElement>('.pa-detail-scroll')?.scrollTo({ top: 0 }) }, [lessonIndex, stepIndex, selectedHotspot])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '[') setBlockSize(value => Math.max(2, value - 1))
      if (event.key === ']') setBlockSize(value => Math.min(8, value + 1))
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

  return <div className="pa-reader">
    <header className="pa-reader-header">
      <button type="button" className="pa-reader-brand" onClick={() => selectLesson(0)}><span className="pa-brandmark">✳</span><span><strong>ORBIT</strong><small>RESEARCH ATLAS</small></span></button>
      <nav className="pa-mode-tabs" aria-label="论文视图模式">
        {([['learn', '交互导读'], ['cheatsheet', '速查表'], ['figures', 'Figures'], ['fulltext', '全文中译'], ['pdf', 'PDF']] as [ViewMode, string][]).map(([value, label]) => <button type="button" key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}
      </nav>
      <div className="pa-reader-actions"><a href="https://arxiv.org/abs/2309.06180" target="_blank" rel="noreferrer">arXiv ↗</a><Link to="/">← 返回时间线</Link></div>
    </header>
    {mode === 'learn' && <div className="pa-reader-body">
      <aside className="pa-course-nav" aria-label="论文章节导航"><div className="pa-course-head"><strong>论文导读</strong><span>{flatIndex + 1}/{flatSteps.length} STEPS</span></div><progress max={flatSteps.length} value={flatIndex + 1} aria-label="论文阅读进度" />{lessons.map((item, index) => <div className="pa-course-group" key={item.id}><button type="button" className={`pa-course-section ${lessonIndex === index ? 'active' : ''}`} onClick={() => selectLesson(index)}><span>{String(item.index).padStart(2, '0')}</span><strong>{item.title}</strong><small>{item.steps.length}</small></button>{lessonIndex === index && <div className="pa-course-steps">{item.steps.map((entry, childIndex) => <button type="button" key={entry.id} className={stepIndex === childIndex ? 'active' : ''} onClick={() => { setStepIndex(childIndex); setMode('learn') }}>{entry.title}<small>{entry.eyebrow}</small></button>)}</div>}</div>)}<div className="pa-course-footer"><a href="/article/pagedattention/2309.06180v1.pdf" target="_blank" rel="noreferrer">原文 PDF ↗</a><Link to="/library">论文库</Link></div></aside>
      <main className="pa-stage-column"><div className="pa-stage-heading"><div><span className="pa-kicker">{step.eyebrow}</span><h1>{step.title}</h1><p>{lesson.subtitle}</p></div><div className="pa-stage-controls"><button type="button" onClick={() => { setPlaybackKey(value => value + 1); setPlaying(true) }} aria-label="重放本步动画">↻</button><button type="button" className={playing ? 'active' : ''} onClick={() => setPlaying(value => !value)} aria-label={playing ? '暂停动画' : '播放动画'}>{playing ? 'Ⅱ' : '▶'}</button><span>{Math.round((flatIndex + 1) / flatSteps.length * 100)}%</span></div></div><div className="pa-stage-frame">{lesson.id === 'source' ? <SourceStage activeFigure={activeFigure} onSelect={setActiveFigure} /> : <PagedAttentionStage step={step} blockSize={blockSize} requestCount={requestCount} sharing={sharing} playing={playing} playbackKey={playbackKey} activeHotspot={selectedHotspot} onHoverHotspot={setSelectedHotspot} />}</div><div className="pa-stage-legend"><span><i className="legend-shared" /> shared / reusable</span><span><i className="legend-physical" /> physical block</span><span><i className="legend-logical" /> logical sequence</span><small>悬浮图中标签查看详细注解</small></div><div className="pa-bottom-nav"><button type="button" disabled={flatIndex <= 0} onClick={() => selectFlat(flatIndex - 1)}>←</button><span>STEP {flatIndex + 1} / {flatSteps.length}</span><button type="button" disabled={flatIndex >= flatSteps.length - 1} onClick={() => selectFlat(flatIndex + 1)}>→</button><div className="pa-step-pills">{lesson.steps.map((entry, index) => <button type="button" className={index === stepIndex ? 'active' : ''} key={entry.id} onClick={() => setStepIndex(index)}>{index + 1} {entry.title}</button>)}</div></div></main>
      <aside className="pa-detail-panel" aria-label="步骤详解与悬浮注解"><div className="pa-detail-scroll"><div className="pa-detail-kicker">{hotspot ? 'HOVER ANNOTATION' : '本步解释'}<span>STEP {stepIndex + 1}/{lesson.steps.length}</span></div>{hotspot ? <HotspotDetail hotspot={hotspot} onClear={() => setSelectedHotspot(null)} /> : <><SourceRefs figureIds={step.figureIds} /><h2>{step.fact}</h2><section><h3>论文原意</h3><p className="pa-paper-fact">{step.fact}</p>{step.formula && <code className="pa-formula">{step.formula}</code>}</section><section><h3>第一性原理解释</h3><p>{step.explanation}</p></section><section><h3>概念跳转</h3><div className="pa-concept-list">{concepts.filter(item => step.conceptIds.includes(item.id)).map(item => <button type="button" className={activeConcept === item.id ? 'active' : ''} key={item.id} onClick={() => setActiveConcept(item.id)}>{item.label}</button>)}</div></section><div className="pa-detail-callout"><strong>{concept.title}</strong><p>{concept.plain}</p><small>{concept.why}</small></div></>}</div><div className="pa-detail-footer"><span>HOVER A NODE TO INSPECT</span><button type="button" onClick={() => setSelectedHotspot(step.hotspots[0]?.id ?? null)}>查看本步重点</button></div></aside>
    </div>}
    {mode === 'cheatsheet' && <CheatSheet />}
    {mode === 'figures' && <div className="pa-full-panel"><FigureGallery figures={allFigures} activeId={activeFigure} onSelect={setActiveFigure} /></div>}
    {mode === 'fulltext' && <FulltextView />}
    {mode === 'pdf' && <div className="pa-pdf-panel"><iframe src="/article/pagedattention/2309.06180v1.pdf" title="PagedAttention PDF" /></div>}
  </div>
}

function SourceRefs({ figureIds }: { figureIds: string[] }) { return <div className="pa-source-refs"><span>SOURCE</span>{figureIds.slice(0, 5).map(id => <a key={id} href={`/article/pagedattention/2309.06180v1.pdf#page=${allFigures.find(item => item.id === id)?.page ?? 1}`} target="_blank" rel="noreferrer">{id.replace('fig-', 'Figure ')} ↗</a>)}</div> }
function HotspotDetail({ hotspot, onClear }: { hotspot: PagedHotspot; onClear: () => void }) {
  const tooltip = findTooltip(hotspot.label)
  return <><div className="pa-hover-title"><span>⌁</span><button type="button" onClick={onClear}>×</button></div><h2>{tooltip?.term ?? hotspot.label}</h2><p className="pa-paper-fact">{tooltip?.main ?? hotspot.plain}</p><section><h3>为什么需要它</h3><p>{tooltip?.expanded ?? hotspot.detail}</p></section>{tooltip && <div className="pa-tooltip-anchor"><span>论文锚点</span><strong>{tooltip.anchor}</strong></div>}<div className="pa-detail-callout"><strong>把它想成</strong><p>{hotspot.label === 'block table' || hotspot.label === 'block_table' ? '操作系统的页表：程序看到连续地址，硬件把它翻译到分散的物理页。' : '一条可观察的系统链路：它改变了显存如何被占用、释放和共享。'}</p></div></>
}
function SourceStage({ activeFigure, onSelect }: { activeFigure: string; onSelect: (id: string) => void }) { const figure = allFigures.find(item => item.id === activeFigure) ?? allFigures[0]; return <div className="pa-source-stage"><img src={figure.originalAsset} alt={`论文${figure.number}原文页`} /><div className="pa-source-strip">{allFigures.map(item => <button type="button" key={item.id} className={item.id === activeFigure ? 'active' : ''} onClick={() => onSelect(item.id)}><img src={item.originalAsset} alt="" /><span>FIG {item.number}</span></button>)}</div></div> }
function CheatSheet() { return <div className="pa-mode-panel"><div className="pa-mode-heading"><span className="pa-kicker">CHEATSHEET / COMPLETE GLOSSARY</span><h1>PagedAttention 速查</h1><p>下面每条术语都保留完整的定义、机制、反事实、OS 对应与论文锚点；悬浮节点时使用同一套文案。</p></div><div className="pa-cheat-grid">{[['01', 'KV Cache', 'decode 阶段逐 token 增长的历史 K/V。它是服务吞吐的主要动态内存。'], ['02', 'Paging', '固定大小 block + block table，逻辑连续与物理连续解耦。'], ['03', 'Sharing', '共享只读前缀，发生写入时 copy-on-write。'], ['04', 'Scheduling', 'scheduler 把 block 预算纳入 continuous batching。'], ['05', 'Payoff', '更少浪费 → 更大 batch → 同延迟下更高 throughput。'], ['06', 'Evidence', '图 1–19、表 1 与 PDF 保留完整证据链。']].map(item => <article key={item[0]}><span>{item[0]}</span><h2>{item[1]}</h2><p>{item[2]}</p></article>)}</div><section className="pa-term-sheet" aria-label="完整术语速查">{tooltips.map(item => <article className="pa-term-card" key={item.id}><header><span className="pa-kicker">{item.id}</span><h2>{item.term}</h2></header><p className="pa-term-main"><strong>一句话定义：</strong>{item.main}</p><p><strong>展开详解：</strong>{item.expanded}</p><small>论文锚点：{item.anchor}</small></article>)}</section><KVCacheDiagram blockSize={4} requestCount={4} sharing /></div> }

function FulltextView() { return <div className="pa-mode-panel pa-fulltext"><div className="pa-mode-heading"><span className="pa-kicker">中文导读 / STRUCTURED TRANSLATION</span><h1>从问题到系统结论</h1></div><div className="pa-fulltext-grid">{lessons.slice(0, 10).map(lesson => <article key={lesson.id}><span className="pa-kicker">{String(lesson.index).padStart(2, '0')} · {lesson.title}</span>{lesson.steps.map(step => <section key={step.id}><h2>{step.title}</h2><p><strong>{step.fact}</strong></p><p>{step.explanation}</p></section>)}</article>)}</div></div> }
