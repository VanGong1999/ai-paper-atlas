import { Link, Navigate, useParams } from 'react-router-dom'
import { getCatalogEntry, hasInteractivePage } from '../data/papers/catalog'
import '../styles/library.css'

export function LibraryDetailPage() {
  const { id = '' } = useParams()
  const entry = getCatalogEntry(id)

  if (!entry) {
    return (
      <div className="library-detail">
        <h1>未找到该条目</h1>
        <Link to="/library" className="entry-link">
          ← 返回已收录论文
        </Link>
      </div>
    )
  }

  if (hasInteractivePage(entry) && entry.visual) {
    return <Navigate to={entry.visual} replace />
  }

  return (
    <div className="library-detail">
      <div className="library-detail-nav">
        <Link to="/library">← 已收录论文</Link>
        <Link to="/">时间线</Link>
      </div>

      <div className="eyebrow">
        {entry.date} · {entry.org} · {entry.kind}
      </div>
      <h1>{entry.title}</h1>

      <div className="library-tags" style={{ margin: '14px 0 20px' }}>
        {entry.topics.map((t) => (
          <span key={t} className={`event-tag ${t === 'AI Infra' ? 'infra' : ''} ${t === 'AI Agent' ? 'agent' : ''}`}>
            {t}
          </span>
        ))}
      </div>

      <section className="detail-block">
        <h2>摘要</h2>
        <p>{entry.blurb}</p>
      </section>

      <section className="detail-block">
        <h2>为何重要</h2>
        <p>{entry.why}</p>
      </section>

      {entry.related && entry.related.length > 0 && (
        <section className="detail-block">
          <h2>相关节点</h2>
          <ul>
            {entry.related.map((rid) => {
              const rel = getCatalogEntry(rid)
              return (
                <li key={rid}>
                  {rel ? (
                    <Link to={hasInteractivePage(rel) && rel.visual ? rel.visual : `/library/${rel.id}`}>
                      {rel.title}
                    </Link>
                  ) : (
                    rid
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="detail-actions">
        {entry.url && (
          <a className="chip active" href={entry.url} target="_blank" rel="noreferrer">
            查看原文 ↗
          </a>
        )}
        <Link className="chip" to="/library">
          返回列表
        </Link>
      </div>
    </div>
  )
}
