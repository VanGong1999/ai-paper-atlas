import { Link } from 'react-router-dom'
import { crossPaperLinks } from '../../data/papers/cross-paper'
import type { PaperSlug } from '../../data/papers/coverage'

export function CrossPaperBridge({ activePaper }: { activePaper: PaperSlug }) {
  return (
    <section className="cross-paper-bridge" aria-labelledby={`${activePaper}-bridge-heading`}>
      <div className="cross-paper-bridge-head">
        <span className="paper-label">CROSS-PAPER BRIDGE</span>
        <h2 id={`${activePaper}-bridge-heading`}>把公式接到系统</h2>
        <p>Attention 决定“读哪些 K/V”，PagedAttention 决定“这些 K/V 如何被缓存与找到”。</p>
      </div>
      <div className="cross-paper-bridge-grid">
        {crossPaperLinks.map(link => (
          <article className="cross-paper-card" key={link.id}>
            <h3>{link.title}</h3>
            <div className="cross-paper-path"><span>{link.attentionConcept}</span><b>→</b><span>{link.pagedConcept}</span></div>
            <p>{link.explanation}</p>
            <small>{link.attentionSource} · {link.pagedAttentionSource}</small>
            <Link to={`/papers/${link.targetPaper}`}>查看 PagedAttention 导读</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
