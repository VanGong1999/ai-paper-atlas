import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { reactChapters, reactTable1, reactTable2, reactTable3, reactTable4, reactTable5, reactTrajectories } from '../data/papers/react/content'
import type { CourseStep, StageKind, TrajectoryEvent } from '../data/papers/react/types'
import '../styles/react.css'

const alfworldLabels = ['Pick', 'Clean', 'Heat', 'Cool', 'Look', 'Pick 2', 'All']
const table1Labels = ['HotpotQA EM', 'FEVER Acc']
const table4Labels = ['Score', 'SR']

function allSteps() {
  return reactChapters.flatMap((chapter, chapterIndex) => chapter.steps.map((step, stepIndex) => ({ chapter, chapterIndex, step, stepIndex })))
}

function TooltipTerm({ children, detail }: { children: React.ReactNode; detail: string }) {
  return <span className="react-term" tabIndex={0} data-tip={detail}>{children}</span>
}

function EvidenceBadge({ step }: { step: CourseStep }) {
  return <div className="react-source"><span>PDF p.{step.evidence.page}</span><strong>{step.evidence.locator}</strong><small>{step.evidence.note}</small></div>
}

function TrajectoryPlayer({ events, speed, onSpeedChange }: { events: TrajectoryEvent[]; speed: number; onSpeedChange: (speed: number) => void }) {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setActive(current => {
        if (current >= events.length - 1) { setPlaying(false); return current }
        return current + 1
      })
    }, 1300 / speed)
    return () => window.clearInterval(timer)
  }, [events.length, playing, speed])

  useEffect(() => { setActive(0); setPlaying(false) }, [events])

  const event = events[active]
  return (
    <div className="react-player">
      <div className="react-player-top">
        <div><span className="react-kicker">TRAJECTORY PLAYER</span><strong>{event.label} · {active + 1}/{events.length}</strong></div>
        <div className="react-player-actions">
          <button type="button" onClick={() => { setActive(0); setPlaying(false) }}>重放 R</button>
          <button type="button" className="react-accent-btn" aria-label={playing ? '暂停轨迹' : '播放轨迹'} title={playing ? '暂停轨迹（Space）' : '播放轨迹（Space）'} onClick={() => setPlaying(value => !value)}>{playing ? '❚❚' : '▶'}</button>
          {[0.7, 1, 1.5].map(value => <button type="button" key={value} aria-pressed={speed === value} onClick={() => onSpeedChange(value)}>{value}×</button>)}
        </div>
      </div>
      <input className="react-progress" type="range" min="0" max={events.length - 1} value={active} onChange={event => setActive(Number(event.target.value))} aria-label="轨迹进度" />
      <div className="react-event-track">
        {events.map((item, index) => <button type="button" key={`${item.label}-${index}`} className={`react-event-dot react-${item.kind} ${index === active ? 'active' : ''}`} onClick={() => { setActive(index); setPlaying(false) }} aria-label={`${item.label}: ${item.text}`}><span>{item.kind === 'thought' ? 'T' : item.kind === 'action' ? 'A' : item.kind === 'observation' ? 'O' : '✓'}</span></button>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${event.label}-${active}`} className={`react-event-card react-${event.kind}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <span>{event.kind.toUpperCase()}</span><strong>{event.label}</strong><p>{event.text}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function LoopStage({ dense = false }: { dense?: boolean }) {
  const nodes = dense ? ['Thought', 'Action', 'Observation', 'Thought', 'Action', 'Observation'] : ['Thought', 'Action', 'Observation', 'Action', 'Action', 'Thought']
  return <div className="react-loop-stage"><div className="react-loop-line" />{nodes.map((node, index) => <motion.div key={`${node}-${index}`} className={`react-loop-node node-${node.toLowerCase()}`} animate={{ y: [0, -7, 0], opacity: [0.68, 1, 0.68] }} transition={{ duration: 2.5, delay: index * 0.25, repeat: Infinity }}><b>{node === 'Thought' ? 'T' : node === 'Action' ? 'A' : 'O'}</b><span>{node}</span><small>{index + 1}</small></motion.div>)}</div>
}

function ComparisonStage() {
  const [value, setValue] = useState(58)
  return <div className="react-comparison-stage"><div className="react-compare-panels"><div className="compare-panel cot"><span>CoT · Reason only</span><strong>内部链条</strong><div className="compare-stream">猜测 → 流畅解释 → <i>事实幻觉</i> → 错误答案</div></div><div className="compare-panel react"><span>ReAct · Reason + Act</span><strong>闭环轨迹</strong><div className="compare-stream">Thought → Search → <i>Observation</i> → 更新计划</div></div></div><label className="react-slider-label">Grounding 对比 <b>{value}% ReAct</b><input type="range" min="0" max="100" value={value} onChange={event => setValue(Number(event.target.value))} /></label><p>拖动滑块：左侧更像<strong>自由推理</strong>，右侧更像<strong>外部证据约束</strong>。</p></div>
}

function EvidenceTable({ kind, onMetricSelect }: { kind: StageKind; onMetricSelect?: (label: string) => void }) {
  if (kind === 'table2') return <div className="react-table-wrap"><table className="react-data-table"><thead><tr><th>模式</th><th>定义</th><th>ReAct</th><th>CoT</th></tr></thead><tbody>{reactTable2.map(row => <tr key={row.type}><td><TooltipTerm detail={`${row.type}：${row.definition}`}>{row.type}</TooltipTerm></td><td>{row.definition}</td><td>{row.react}%</td><td>{row.cot === null ? '—' : `${row.cot}%`}</td></tr>)}</tbody></table></div>
  const isAlf = kind === 'alfworld'
  const rows = isAlf ? reactTable3 : kind === 'webshop' ? reactTable4 : kind === 'appendix' ? reactTable5 : reactTable1
  const headers = isAlf ? alfworldLabels : kind === 'webshop' ? table4Labels : kind === 'appendix' ? ['HotpotQA EM', 'ALFWorld SR'] : table1Labels
  return <div className="react-table-wrap"><table className="react-data-table"><thead><tr><th>Method / Model</th>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map(row => { const rowLabel = 'method' in row ? row.method : row.model; return <tr key={rowLabel}><td><strong>{rowLabel}</strong></td>{row.values.map((value, index) => <td key={`${rowLabel}-${index}`}><button type="button" className="react-number" title="点击查看论文原始位置" onClick={() => onMetricSelect?.(`${rowLabel} · ${headers[index]} = ${value}`)}>{value}{isAlf || index === 1 && kind !== 'appendix' ? '%' : ''}</button></td>)}</tr> })}</tbody></table></div>
}

function Stage({ step, onMetricSelect }: { step: CourseStep; onMetricSelect?: (label: string) => void }) {
  if (step.stage === 'loop') return <><LoopStage dense={step.id === 'paradigm-4'} /><TrajectoryPlayer events={step.id === 'overview-5' ? reactTrajectories.appleRemote : reactTrajectories.pepperShaker} speed={1} onSpeedChange={() => undefined} /></>
  if (step.stage === 'compare') return <ComparisonStage />
  if (['table1', 'table2', 'alfworld', 'webshop', 'appendix'].includes(step.stage)) return <EvidenceTable kind={step.stage} onMetricSelect={onMetricSelect} />
  if (step.stage === 'wikipedia') return <><LoopStage dense /><TrajectoryPlayer events={reactTrajectories.appleRemote} speed={1} onSpeedChange={() => undefined} /></>
  if (step.stage === 'scale') return <div className="react-scale-stage">{['Prompt 8B', 'Prompt 62B', 'Prompt 540B', 'Fine-tune 8B', 'Fine-tune 62B'].map((label, index) => <div key={label} className="scale-bar"><span>{label}</span><i style={{ height: `${34 + index * 12}px` }} /><b>{index < 3 ? ['12', '18', '25'][index] : ['20', '31'][index - 3]} EM</b></div>)}</div>
  if (step.stage === 'ablation') return <div className="react-ablation-stage"><div className="ablation-card good"><strong>ReAct</strong><span>高层目标 + 常识 + 稀疏 thought</span><b>71%</b></div><div className="ablation-card bad"><strong>ReAct-IM</strong><span>密集外部反馈，无目标分解</span><b>53%</b></div><div className="react-arrow">内部计划 = 压缩搜索空间</div></div>
  if (step.stage === 'related') return <div className="react-related-stage">{['CoT\nReason', 'STaR\nFinetune', 'WebGPT\nBrowse', 'SayCan\nGround', 'Inner Monologue\nFeedback', 'ReAct\nReason + Act'].map((label, index) => <motion.div key={label} className={index === 5 ? 'related-node selected' : 'related-node'} animate={index === 5 ? { scale: [1, 1.05, 1] } : undefined} transition={{ repeat: Infinity, duration: 2.2 }}><span>{label.split('\n')[0]}</span><small>{label.split('\n')[1]}</small></motion.div>)}</div>
  return <div className="react-overview-stage"><div className="react-axiom"><span>Reason to Act</span><b>+</b><span>Act to Reason</span></div><LoopStage /></div>
}

export function ReactPage() {
  const entries = useMemo(allSteps, [])
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [replayKey, setReplayKey] = useState(0)
  const [search, setSearch] = useState('')
  const [navOpen, setNavOpen] = useState(true)
  const [selectedEvidence, setSelectedEvidence] = useState<CourseStep | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const current = entries[activeIndex]
  const step = current.step

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setActiveIndex(index => index === entries.length - 1 ? 0 : index + 1), 4200 / speed)
    return () => window.clearInterval(timer)
  }, [entries.length, playing, speed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.code === 'Space') { event.preventDefault(); setPlaying(value => !value) }
      if (event.key.toLowerCase() === 'r') setReplayKey(key => key + 1)
      if (event.key === 'ArrowRight') setActiveIndex(index => Math.min(entries.length - 1, index + 1))
      if (event.key === 'ArrowLeft') setActiveIndex(index => Math.max(0, index - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entries.length])

  const filtered = reactChapters.map(chapter => ({ ...chapter, steps: chapter.steps.map(step => ({ step, index: entries.findIndex(entry => entry.step.id === step.id) })).filter(item => !search || `${item.step.title} ${item.step.summary} ${item.step.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())) })).filter(chapter => chapter.steps.length)

  return <div className="react-cockpit">
    <div className="react-cockpit-bar"><Link to="/" className="react-back">← ORBIT / PAPER ATLAS</Link><div className="react-title"><span className="react-logo">R</span><span><strong>ReAct</strong><small>SYNERGIZING REASONING + ACTING</small></span></div><div className="react-top-actions"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索课程与概念…" aria-label="搜索课程与概念" /><button type="button" onClick={() => setNavOpen(value => !value)}>{navOpen ? '收起导航' : '打开导航'}</button><a href="/article/2210.03629v3.pdf" target="_blank" rel="noreferrer">PDF ↗</a></div></div>
    <div className={`react-reader ${navOpen ? '' : 'nav-collapsed'}`}>
      <aside className="react-nav" aria-label="ReAct 课程章节导航"><div className="react-nav-head"><span>课程目录 · CURRICULUM</span><strong>7 章 · 49 步</strong><div className="react-total-progress"><i style={{ width: `${((activeIndex + 1) / entries.length) * 100}%` }} /></div></div>{filtered.map(chapter => <div className="react-chapter" key={chapter.id}><button type="button" className="react-chapter-button" onClick={() => setActiveIndex(chapter.steps[0]?.index ?? 0)}><b>{chapter.number}</b><span>{chapter.title}</span><small>{chapter.steps.length}/7</small></button>{chapter.steps.map(({ step: item, index }) => <button type="button" key={item.id} className={`react-step-button ${index === activeIndex ? 'active' : ''}`} onClick={() => setActiveIndex(index)}><span>{String(item.id.split('-').pop()).padStart(2, '0')}</span>{item.title}</button>)}</div>)}<div className="react-nav-foot">{activeIndex + 1} / {entries.length}<small>用证据读懂 agent loop</small></div></aside>
      <main className="react-stage-pane"><div className="react-stage-head"><div><span className="react-kicker">{current.chapter.number}. {current.chapter.title} <i>/</i> STEP {current.stepIndex + 1}/7</span><h1>{step.title}</h1><p>{step.summary}</p></div><div className="react-stage-meta"><span>{step.stage.toUpperCase()}</span><span>{step.tags.slice(0, 2).join(' · ')}</span></div></div><div className="react-stage-toolbar"><button type="button" onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} aria-label="上一步">←</button><button type="button" onClick={() => setPlaying(value => !value)} className="react-play-button" aria-label={playing ? '暂停动画' : '播放动画'} title={playing ? '暂停动画（Space）' : '播放动画（Space）'}>{playing ? '❚❚' : '▶'}</button><button type="button" onClick={() => setActiveIndex(Math.min(entries.length - 1, activeIndex + 1))} disabled={activeIndex === entries.length - 1} aria-label="下一步">→</button><label>速度 <select value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="0.7">0.7×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label></div><div className="react-stage-canvas"><div key={`${step.id}-${replayKey}`} className="react-stage-inner"><Stage step={step} onMetricSelect={label => setSelectedMetric(label)} /></div></div><div className="react-stage-caption"><b>FIG / EVIDENCE</b><span>{step.evidence.locator}</span><small>悬停关键词可查看第一性原理；点击数字查看证据。</small></div></main>
      <aside className="react-detail" aria-label="步骤详解与学习收获"><div className="react-detail-top"><span>{step.kicker}</span><span>STEP {current.stepIndex + 1} / 7</span></div><h2>{step.title}</h2><p>{step.summary}</p><div className="react-principles"><span>第一性原理 · WHY</span><strong>{step.firstPrinciples}</strong></div><div className="react-why"><span>为什么重要</span><p>{step.importance}</p></div><EvidenceBadge step={step} />{['table1', 'table2', 'alfworld', 'webshop', 'appendix'].includes(step.stage) && <button type="button" className="react-evidence-button" onClick={() => setSelectedEvidence(step)}>查看论文证据详情</button>}<div className="react-keyboard"><span>← →</span> 切步 <span>Space</span> 播放 <span>R</span> 重置当前步</div><div className="react-next"><button type="button" onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0}>上一步</button><button type="button" onClick={() => setActiveIndex(Math.min(entries.length - 1, activeIndex + 1))} disabled={activeIndex === entries.length - 1}>下一步</button></div></aside>
    </div>
    {(selectedEvidence || selectedMetric) && <div className="react-evidence-modal" role="dialog" aria-modal="true"><div className="react-modal-card"><button type="button" className="react-modal-close" onClick={() => { setSelectedEvidence(null); setSelectedMetric(null) }}>×</button><span className="react-kicker">PAPER EVIDENCE</span><h2>{selectedMetric ?? selectedEvidence?.title}</h2>{selectedEvidence && <EvidenceBadge step={selectedEvidence} />}<p>{selectedEvidence?.firstPrinciples ?? '这是论文表格中的原始实验数字。它不是教学估算，而是直接对应 PDF 中的表格单元格。'}</p><p className="react-modal-note">完整上下文见本地论文 PDF 第 {selectedEvidence?.evidence.page ?? step.evidence.page} 页的 {selectedEvidence?.evidence.locator ?? step.evidence.locator}。课程中的动画是对原文机制的教学重绘，不替代原始实验。</p></div></div>}
  </div>
}
