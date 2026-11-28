import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { reactChapters, reactTable1, reactTable2, reactTable3, reactTable4, reactTable5, reactTrajectories } from '../data/papers/react/content'
import type { CourseStep, StageKind } from '../data/papers/react/types'
import '../styles/react.css'
import { ConceptHelp, ConceptHelpScope } from '../components/paper/ConceptHelp'
import { reactConcepts } from '../components/paper/react/reactConcepts'
import { ContextTrajectory, FallbackExperiment, GroundingComparison, ReActSourceStage, ScalingStage, TrainingDetails } from '../components/paper/react/ReActMechanisms'

const alfworldLabels = ['Pick', 'Clean', 'Heat', 'Cool', 'Look', 'Pick 2', 'All']
const table1Labels = ['HotpotQA EM', 'FEVER Acc']
const table4Labels = ['Score (%)', 'SR (%)']

function allSteps() {
  return reactChapters.flatMap((chapter, chapterIndex) => chapter.steps.map((step, stepIndex) => ({ chapter, chapterIndex, step, stepIndex })))
}

function TooltipTerm({ children, detail }: { children: React.ReactNode; detail: string }) {
  return <ConceptHelp concept={{...reactConcepts.table2,title:String(children),what:detail}}>{children}</ConceptHelp>
}

function EvidenceBadge({ step }: { step: CourseStep }) {
  return <div className="react-source"><span>PDF p.{step.evidence.page}</span><a href={`/article/2210.03629v3.pdf#page=${step.evidence.page}`} target="_blank" rel="noreferrer"><strong>{step.evidence.locator} ↗</strong></a><small>{step.evidence.note}</small></div>
}

function EvidenceTable({ kind }: { kind: StageKind }) {
  if (kind === 'table2') return <div className="react-table-evidence"><ConceptHelp concept={reactConcepts.table2}>Table 2 · 先读分母：成功 / 失败分组内百分比</ConceptHelp><p>人工抽样合计200条：每种方法50成功＋50失败；下表不是全体问题的发生概率。保留原表舍入值。</p><div className="react-table-wrap"><table className="react-data-table"><thead><tr><th>模式</th><th>定义</th><th>ReAct</th><th>CoT</th></tr></thead><tbody>{reactTable2.map(row => <tr key={row.type}><td><TooltipTerm detail={`${row.type}：${row.definition}`}>{row.type}</TooltipTerm></td><td>{row.definition}</td><td>{row.react}%</td><td>{row.cot === null ? '—' : `${row.cot}%`}</td></tr>)}</tbody></table></div></div>
  const isAlf = kind === 'alfworld'
  const rows = isAlf ? reactTable3 : kind === 'webshop' ? reactTable4 : kind === 'appendix' ? reactTable5 : reactTable1
  const headers = isAlf ? alfworldLabels : kind === 'webshop' ? table4Labels : kind === 'appendix' ? ['HotpotQA EM', 'ALFWorld SR'] : table1Labels
  return <div className="react-table-evidence">{isAlf && <><ConceptHelp concept={reactConcepts.bestof}>best-of-6 = 六组示范提示中最好的一组</ConceptHelp><p>ReAct平均57%，最佳71%；每类3条示范取2条排列，不是每道题采样六个答案再选最好。</p></>}{kind === 'webshop' && <p>500条测试指令；Score为期望属性覆盖的平均值，SR为满足全部要求的比例。Table 4的66.6与40.0是两个不同指标。</p>}{kind === 'appendix' && <p>Table 5 · HotpotQA仅500个随机验证问题；ALFWorld为134个任务，使用按PaLM选出的最好提示。不是Table 1全量评测。</p>}<div className="react-table-wrap"><table className="react-data-table"><thead><tr><th>Method / Model</th>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map(row => { const rowLabel = 'method' in row ? row.method : row.model; return <tr key={rowLabel}><td><strong>{rowLabel}</strong></td>{row.values.map((value, index) => <td key={`${rowLabel}-${index}`}><ConceptHelp className="react-number" concept={{title:`${rowLabel} · ${headers[index]}`,what:`原表记录为 ${value}${isAlf?'%':''}。`,why:'把质量分数放回方法、数据与评测条件，才能做有意义的比较。',how:kind==='appendix'?(index===0?'HotpotQA使用答案精确匹配EM，这里仅随机抽样500个验证问题。':'ALFWorld使用134个未见任务的成功率；提示按PaLM结果选定后用于两模型。'):isAlf?'成功率是完成任务实例数占评测任务实例的比例；最佳提示与提示平均要分开看。':kind==='webshop'?'Score是所需属性覆盖程度的平均值；SR是所选商品满足全部要求的任务比例。':'HotpotQA使用答案精确匹配EM；FEVER使用预测标签准确率。不同表格与评测子集不能混用。',shape:'实验记录：方法 × 指标；不是单条轨迹成功的预测概率。',source:`${kind==='appendix'?'Table 5 · PDF p.14':isAlf?'Table 3 · PDF p.8':kind==='webshop'?'Table 4 · PDF p.8':'Table 1 · PDF p.5'}`,href:`/article/2210.03629v3.pdf#page=${kind==='appendix'?14:isAlf||kind==='webshop'?8:5}`,caution:isAlf?'best-of-6指六组提示中最好的一组；总体评测134个未见任务。':kind==='appendix'?'Table5只使用500个HotpotQA问题与134个ALFWorld任务，后者按PaLM选择最好提示。':'这是论文报告值；请查看对应表格的脚注与设置。'}}>{value}{isAlf || index === 1 && kind !== 'appendix' ? '%' : ''}</ConceptHelp></td>)}</tr> })}</tbody></table></div></div>
}

function Stage({ step, speed, onSpeedChange }: { step: CourseStep; speed:number; onSpeedChange:(speed:number)=>void }) {
  if (step.id === 'analysis-7') return <ReActSourceStage page={10} title="ReAct · 复现与伦理声明" />
  if (step.stage === 'loop' || step.stage === 'wikipedia' || step.id === 'motivation-4' || step.id === 'decision-2') return <ContextTrajectory events={step.id === 'overview-5' || step.stage === 'wikipedia' ? reactTrajectories.appleRemote : reactTrajectories.pepperShaker} speed={speed} onSpeedChange={onSpeedChange} />
  if (step.stage === 'compare') return <GroundingComparison />
  if (step.stage === 'combination') return <FallbackExperiment />
  if (['table1', 'table2', 'alfworld', 'webshop', 'appendix'].includes(step.stage)) return <EvidenceTable kind={step.stage} />
  if (step.stage === 'scale') return <ScalingStage />
  if (step.stage === 'training') return <TrainingDetails />
  if (step.stage === 'prompts') return <ReActSourceStage page={16} title="ReAct · 附录C完整提示" />
  if (step.stage === 'trajectories') return <ReActSourceStage page={26} title="ReAct · 附录D–E完整案例" />
  if (step.stage === 'freshness') return <div className="react-source-stage"><h3>Figure 4 · 数据集标签也可能过时</h3><p>3,104 与旧标签2,664的差异是原文酒店规模案例；这说明时间新鲜度与EM标签匹配可能冲突，不是一次当前网络事实核查。</p><ReActSourceStage page={14} title="ReAct · 新鲜知识案例" /></div>
  if (step.stage === 'human-edit') return <div className="react-source-stage"><h3>Figure 5 · 编辑两处思考，改变后续行为</h3><p>原案例在Act 17删除虚构句子，并在Act 23加入提示；对比修改前的失败轨迹与修改后的成功轨迹。该单例不证明每次语言干预都能成功。</p><ReActSourceStage page={15} title="ReAct · 人类协作" /></div>
  if (step.stage === 'ablation') return <div className="react-ablation-stage"><div className="ablation-card good"><strong>ReAct</strong><span>目标分解、完成判断、下一子目标与内部常识</span><b>71%</b><small>平均57%；这里为最好提示</small></div><div className="ablation-card bad"><strong>ReAct-IM</strong><span>保留受限的密集外部反馈思考</span><b>53%</b><small>平均48%；这里为最好提示</small></div><ConceptHelp concept={reactConcepts.bestof}>Table 3 · 相同示范来源与六组提示条件</ConceptHelp><ReActSourceStage page={25} title="ReAct · IM原始提示" /></div>
  if (step.stage === 'related') return <div className="react-related-stage">{['CoT\nReason', 'STaR\nFinetune', 'WebGPT\nBrowse', 'SayCan\nGround', 'Inner Monologue\nFeedback', 'ReAct\nReason + Act'].map(label => <div key={label} className="related-node"><span>{label.split('\n')[0]}</span><small>{label.split('\n')[1]}</small></div>)}<p>§5区分推理训练、工具行动、具身反馈与自由语言思考。相邻方法并非使用同样数据、任务或训练成本。</p><a href="/article/2210.03629v3.pdf#page=9" target="_blank" rel="noreferrer">阅读相关工作原文 ↗</a></div>
  return <div className="react-overview-stage"><div className="react-axiom"><span>Reason to Act</span><b>＋</b><span>Act to Reason</span></div><ContextTrajectory events={reactTrajectories.appleRemote} speed={speed} onSpeedChange={onSpeedChange} /></div>
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
  const current = entries[activeIndex]
  const step = current.step

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setActiveIndex(index => index === entries.length - 1 ? 0 : index + 1), 4200 / speed)
    return () => window.clearInterval(timer)
  }, [entries.length, playing, speed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || (event.target instanceof HTMLElement && event.target.closest('button,a'))) return
      if (event.code === 'Space') { event.preventDefault(); setPlaying(value => !value) }
      if (event.key.toLowerCase() === 'r') setReplayKey(key => key + 1)
      if (event.key === 'ArrowRight') setActiveIndex(index => Math.min(entries.length - 1, index + 1))
      if (event.key === 'ArrowLeft') setActiveIndex(index => Math.max(0, index - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entries.length])

  const filtered = reactChapters.map(chapter => ({ ...chapter, steps: chapter.steps.map(step => ({ step, index: entries.findIndex(entry => entry.step.id === step.id) })).filter(item => !search || `${item.step.title} ${item.step.summary} ${item.step.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())) })).filter(chapter => chapter.steps.length)

  return <ConceptHelpScope><div className="react-cockpit">
    <div className="react-cockpit-bar"><Link to="/" className="react-back">← ORBIT / PAPER ATLAS</Link><div className="react-title"><span className="react-logo">R</span><span><strong>ReAct</strong><small>SYNERGIZING REASONING + ACTING</small></span></div><div className="react-top-actions"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索课程与概念…" aria-label="搜索课程与概念" /><button type="button" onClick={() => setNavOpen(value => !value)}>{navOpen ? '收起导航' : '打开导航'}</button><a href="/article/2210.03629v3.pdf" target="_blank" rel="noreferrer">PDF ↗</a></div></div>
    <div className={`react-reader ${navOpen ? '' : 'nav-collapsed'}`}>
      <aside className="react-nav" aria-label="ReAct 课程章节导航"><div className="react-nav-head"><span>课程目录 · CURRICULUM</span><strong>7 章 · 49 步</strong><div className="react-total-progress"><i style={{ width: `${((activeIndex + 1) / entries.length) * 100}%` }} /></div></div>{filtered.map(chapter => <div className="react-chapter" key={chapter.id}><button type="button" className="react-chapter-button" onClick={() => setActiveIndex(chapter.steps[0]?.index ?? 0)}><b>{chapter.number}</b><span>{chapter.title}</span><small>{chapter.steps.length}/7</small></button>{chapter.steps.map(({ step: item, index }) => <button type="button" key={item.id} className={`react-step-button ${index === activeIndex ? 'active' : ''}`} onClick={() => setActiveIndex(index)}><span>{String(item.id.split('-').pop()).padStart(2, '0')}</span>{item.title}</button>)}</div>)}<div className="react-nav-foot">{activeIndex + 1} / {entries.length}<small>用证据读懂 agent loop</small></div></aside>
      <main className="react-stage-pane"><div className="react-stage-head"><div><span className="react-kicker">{current.chapter.number}. {current.chapter.title} <i>/</i> STEP {current.stepIndex + 1}/7</span><h1>{step.title}</h1><p>{step.summary}</p></div><div className="react-stage-meta"><span>{step.stage.toUpperCase()}</span><span>{step.tags.slice(0, 2).join(' · ')}</span></div></div><div className="react-stage-toolbar"><button type="button" onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} aria-label="上一步">←</button><button type="button" onClick={() => setPlaying(value => !value)} className="react-play-button" aria-label={playing ? '暂停自动切步' : '播放课程步骤'} title={playing ? '暂停自动切步（Space）' : '自动切换课程步骤（Space）'}>{playing ? '❚❚' : '▶'}</button><button type="button" onClick={() => setActiveIndex(Math.min(entries.length - 1, activeIndex + 1))} disabled={activeIndex === entries.length - 1} aria-label="下一步">→</button><label>速度 <select value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="0.7">0.7×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label></div><div className="react-stage-canvas"><div key={`${step.id}-${replayKey}`} className="react-stage-inner"><Stage step={step} speed={speed} onSpeedChange={setSpeed} /></div></div><div className="react-stage-caption"><b>FIG / EVIDENCE</b><span>{step.evidence.locator}</span><small>悬停关键词可查看第一性原理；点击数字查看证据。</small></div></main>
      <aside className="react-detail" aria-label="步骤详解与学习收获"><div className="react-detail-top"><span>{step.kicker}</span><span>STEP {current.stepIndex + 1} / 7</span></div><h2>{step.title}</h2><p>{step.summary}</p><div className="react-principles"><span>第一性原理 · WHY</span><strong>{step.firstPrinciples}</strong></div><div className="react-why"><span>为什么重要</span><p>{step.importance}</p></div><EvidenceBadge step={step} />{['table1', 'table2', 'alfworld', 'webshop', 'appendix'].includes(step.stage) && <button type="button" className="react-evidence-button" onClick={() => setSelectedEvidence(step)}>查看论文证据详情</button>}<div className="react-keyboard"><span>← →</span> 切步 <span>Space</span> 播放 <span>R</span> 重置当前步</div><div className="react-next"><button type="button" onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0}>上一步</button><button type="button" onClick={() => setActiveIndex(Math.min(entries.length - 1, activeIndex + 1))} disabled={activeIndex === entries.length - 1}>下一步</button></div></aside>
    </div>
    {selectedEvidence && <div className="react-evidence-modal" role="dialog" aria-modal="true"><div className="react-modal-card"><button type="button" className="react-modal-close" onClick={() => { setSelectedEvidence(null) }}>×</button><span className="react-kicker">PAPER EVIDENCE</span><h2>{selectedEvidence?.title}</h2>{selectedEvidence && <EvidenceBadge step={selectedEvidence} />}<p>{selectedEvidence?.firstPrinciples ?? '这是论文表格中的原始实验数字。它不是教学估算，而是直接对应 PDF 中的表格单元格。'}</p><p className="react-modal-note">完整上下文见本地论文 PDF 第 {selectedEvidence?.evidence.page ?? step.evidence.page} 页的 {selectedEvidence?.evidence.locator ?? step.evidence.locator}。课程中的动画是对原文机制的教学重绘，不替代原始实验。</p></div></div>}
  </div></ConceptHelpScope>
}
