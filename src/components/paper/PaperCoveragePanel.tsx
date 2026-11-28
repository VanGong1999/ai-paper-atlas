import { getCoverageForPaper, type CoverageItem, type PaperSlug } from '../../data/papers/coverage'

type Props = {
  paper: PaperSlug
  items?: CoverageItem[]
  onNavigate?: (item: CoverageItem) => void
}

const kindLabel: Record<CoverageItem['kind'], string> = {
  concept: '概念', formula: '公式', flow: '流程', implementation: '实现',
  experiment: '实验', limitation: '边界', figure: '图表', bridge: '连接',
}

export function PaperCoveragePanel({ paper, items, onNavigate }: Props) {
  const coverage = getCoverageForPaper(paper)
  const visibleItems = items ?? coverage.items
  const covered = visibleItems.filter(item => item.status === 'covered').length
  return (
    <section className="paper-coverage" aria-labelledby={`${paper}-coverage-heading`}>
      <div className="paper-coverage-head">
        <div>
          <span className="paper-label">PAPER COVERAGE / SOURCE INDEX</span>
          <h2 id={`${paper}-coverage-heading`}>论文覆盖矩阵</h2>
          <p>{coverage.subtitle}。每项都保留章节或页码锚点。</p>
        </div>
        <div className="paper-coverage-meter" aria-label={`已覆盖 ${covered} 项，共 ${visibleItems.length} 项`}>
          <strong>{covered}/{visibleItems.length}</strong>
          <span>已绑定原文</span>
        </div>
      </div>
      <div className="paper-coverage-grid">
        {visibleItems.map(item => (
          <article className="paper-coverage-card" key={item.id}>
            <div className="paper-coverage-card-top"><span>{kindLabel[item.kind]}</span><small>{item.section}</small></div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <div className="paper-coverage-source"><span>{item.source}</span>{item.figureIds?.slice(0, 3).map(id => <em key={id}>{id.replace('figure-', 'Figure ').replace('fig-', 'Figure ')}</em>)}</div>
            {onNavigate && item.relatedLessonId && item.relatedStepId && <button type="button" onClick={() => onNavigate(item)}>进入对应导读</button>}
          </article>
        ))}
      </div>
    </section>
  )
}
