import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCatalog, hasInteractivePage } from '../data/papers/catalog'
import type { Topic } from '../data/timeline'
import { TOPICS } from '../data/timeline'
import '../styles/library.css'

export function LibraryPage() {
  const catalog = useMemo(() => getCatalog(), [])
  const [topic, setTopic] = useState<Topic | '全部'>('全部')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return catalog.filter((e) => {
      const okTopic = topic === '全部' || e.topics.includes(topic)
      const okQ = !query
        || `${e.title} ${e.org} ${e.blurb} ${e.why}`.toLowerCase().includes(query)
      return okTopic && okQ
    })
  }, [catalog, topic, q])

  return (
    <div className="library-page">
      <header className="library-hero">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            PAPER LIBRARY / 已收录
          </div>
          <h1>
            已收录论文
            <span>.</span>
          </h1>
          <p>浏览图谱中已整理的论文与开源节点。有可视化的可进入驾驶舱；其余可查看中文摘要与原文链接。</p>
        </div>
        <div className="library-count">
          <strong>{String(list.length).padStart(2, '0')}</strong>
          <span>ENTRIES</span>
        </div>
      </header>

      <div className="library-toolbar">
        <input
          className="search-box"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索已收录论文…"
          aria-label="搜索已收录论文"
        />
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${topic === '全部' ? 'active' : ''}`}
            onClick={() => setTopic('全部')}
          >
            全部主题
          </button>
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${topic === t ? 'active' : ''} ${t === 'AI Infra' ? 'accent-infra' : ''} ${t === 'AI Agent' ? 'accent-agent' : ''}`}
              onClick={() => setTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="library-grid">
        {list.map((paper) => {
          const interactive = hasInteractivePage(paper)
          const to = interactive && paper.visual ? paper.visual : `/library/${paper.id}`
          return (
            <Link key={paper.id} to={to} className="library-card">
              <div className="library-card-top">
                <span className="mono">{paper.date}</span>
                <span className="library-kind">{paper.kind}</span>
              </div>
              <div className="library-org">{paper.org}</div>
              <h2>{paper.title}</h2>
              <p>{paper.blurb}</p>
              <div className="library-tags">
                {paper.topics.map((t) => (
                  <span key={t} className={`event-tag ${t === 'AI Infra' ? 'infra' : ''} ${t === 'AI Agent' ? 'agent' : ''}`}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="library-card-foot">
                {interactive ? '进入可视化 →' : '查看详情 →'}
              </div>
            </Link>
          )
        })}
      </div>

      {!list.length && <p className="event-empty">没有匹配的已收录条目。</p>}
    </div>
  )
}
