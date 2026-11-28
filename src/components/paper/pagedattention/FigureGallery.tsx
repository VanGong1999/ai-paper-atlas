import type { PagedFigure } from '../../../data/papers/pagedattention/figures'

export function FigureGallery({ figures, activeId, onSelect }: { figures: PagedFigure[]; activeId: string; onSelect: (id: string) => void }) {
  const active = figures.find(figure => figure.id === activeId) ?? figures[0]
  return <div className="figure-gallery">
    <div className="figure-grid" aria-label="论文图表目录">
      {figures.map(figure => <button type="button" key={figure.id} className={`figure-thumb ${activeId === figure.id ? 'active' : ''}`} onClick={() => onSelect(figure.id)}>
        <img src={figure.originalAsset} alt={`${figure.kind === 'table' ? '表' : '图'}${figure.number}：${figure.title}`} loading="eager" onError={event => { event.currentTarget.replaceWith(document.createTextNode('图像加载失败，请打开原文 PDF')) }} />
        <span>{figure.kind === 'table' ? 'TABLE' : 'FIG'} {String(figure.number).padStart(2, '0')} · p.{figure.page}</span>
      </button>)}
    </div>
    <article className="figure-detail">
      <div className="figure-detail-img"><img src={active.originalAsset} alt={`论文第 ${active.number} ${active.kind === 'table' ? '表' : '图'}原文页`} loading="eager" onError={event => { event.currentTarget.replaceWith(document.createTextNode('图像加载失败，请打开原文 PDF')) }} /></div>
      <div><span className="pa-kicker">SOURCE {active.kind === 'table' ? 'TABLE' : 'FIGURE'} {String(active.number).padStart(2, '0')} · PAGE {active.page}</span><h3>{active.title}</h3><p><strong>这张图在说什么：</strong> {active.interpretation}</p><a className="pa-link" href={`/article/pagedattention/2309.06180v1.pdf#page=${active.page}`} target="_blank" rel="noreferrer">打开原文 PDF ↗</a></div>
    </article>
  </div>
}
