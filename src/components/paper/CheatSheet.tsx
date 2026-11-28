import { cheatSheet } from '../../data/papers/attention/cheatsheet'
import { PaperCoveragePanel } from './PaperCoveragePanel'
import type { CoverageItem } from '../../data/papers/coverage'

type Props = { onNavigate: (lessonId: string, stepId: string) => void; coverage?: CoverageItem[] }

export function CheatSheet({ onNavigate, coverage }: Props) {
  return (
    <div className="cheatsheet">
      <div className="cheatsheet-inner">
        <header className="cheatsheet-hero">
          <div>
            <div className="cheatsheet-eyebrow"><span /> PAPER FIELD NOTES <span className="cheatsheet-year">2017 / TRANSFORMER</span></div>
            <h1>一张速查表，<br /><em>读懂注意力。</em></h1>
            <p>从整体架构到核心公式，用简单的语言梳理 <strong>Attention Is All You Need</strong> 的关键思想。</p>
          </div>
          <div className="cheatsheet-hero-art" aria-hidden="true"><span>Q</span><i>×</i><span>K</span><i>→</i><span>V</span><small>ATTENTION IS ALL YOU NEED</small></div>
        </header>
        <div className="cheatsheet-section-heading"><div><span>THE ESSENTIALS</span><h2>核心概念速览</h2></div><p>8 个关键概念 · 点击卡片深入探索</p></div>
        <div className="cheatsheet-grid">
          {cheatSheet.map(card => (
            <article className="cheat-card" key={card.number}>
              <div className="cheat-card-top"><span>{card.tag}</span><span>{card.number} / 08</span></div>
              <h3>{card.title}</h3>
              <p className="cheat-summary">{card.summary}</p>
              <div className="cheat-insight"><strong>{card.emphasis}</strong><p>{card.detail}</p></div>
              <button type="button" onClick={() => onNavigate(card.lessonId, card.stepId)}>进入交互导读 <span>↗</span></button>
            </article>
          ))}
        </div>
        <PaperCoveragePanel paper="attention" items={coverage} onNavigate={item => onNavigate(item.relatedLessonId!, item.relatedStepId!)} />
        <div className="cheatsheet-footer">ATTENTION IS ALL YOU NEED <span>·</span> 从概念出发，回到论文原文。</div>
      </div>
    </div>
  )
}
