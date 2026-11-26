import { Link } from 'react-router-dom'
import type { TimelineEvent } from '../../data/timeline'
import { hasInteractivePage } from '../../data/papers/catalog'

type Props = {
  events: TimelineEvent[]
}

function entryPath(event: TimelineEvent) {
  if (hasInteractivePage(event) && event.visual) return event.visual
  return `/library/${event.id}`
}

export function EventList({ events }: Props) {
  if (!events.length) {
    return (
      <section className="event-list">
        <div className="event-list-head">
          <h2>事件与摘要</h2>
          <span>0 条</span>
        </div>
        <p className="event-empty">没有匹配结果，试试其他筛选或重置。</p>
      </section>
    )
  }

  return (
    <section className="event-list" aria-label="事件列表">
      <div className="event-list-head">
        <div>
          <div className="eyebrow">EVENT LEDGER / 精选节点</div>
          <h2>事件与摘要</h2>
        </div>
        <span>{String(events.length).padStart(2, '0')} 条 · 与上方筛选同步</span>
      </div>

      <div className="event-list-cols" aria-hidden>
        <span>时间</span>
        <span>事件 / 摘要</span>
        <span>入口</span>
      </div>

      <div className="event-rows">
        {events.map((event) => {
          const path = entryPath(event)
          const interactive = hasInteractivePage(event)
          return (
            <article key={event.id} className="event-row">
              <div className="event-date">
                <strong>{event.date.replace('-', ' / ')}</strong>
                <small>{event.kind}</small>
              </div>
              <div className="event-main">
                <div className="event-meta">{event.org.toUpperCase()}</div>
                <h3>
                  <Link to={path}>{event.title}</Link>
                </h3>
                <p>{event.blurb}</p>
                <p className="event-why">{event.why}</p>
                <div className="event-topics">
                  {event.topics.map((t) => (
                    <span
                      key={t}
                      className={`event-tag ${t === 'AI Infra' ? 'infra' : ''} ${t === 'AI Agent' ? 'agent' : ''}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="event-action">
                <Link className="entry-link" to={path}>
                  {interactive ? '进入可视化 →' : '查看详情 →'}
                </Link>
                {!interactive && event.url && (
                  <a className="entry-link dim" href={event.url} target="_blank" rel="noreferrer">
                    原文 ↗
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
