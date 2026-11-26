import type { TimelineEvent } from '../../data/timeline'

type Props = {
  event: TimelineEvent
  x: number
  y: number
}

export function HoverCard({ event, x, y }: Props) {
  return (
    <div className="hover-card" style={{ left: x, top: y }} role="tooltip">
      <div className="eyebrow">
        {event.date} · {event.org} · {event.kind}
      </div>
      <h4>{event.title}</h4>
      <div className="tags">
        {event.topics.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </div>
      <p>{event.blurb}</p>
      <p className="why">为何重要：{event.why}</p>
      <p className="cta">
        {event.visual ? '点击进入该论文可视化页 →' : event.url ? '点击打开原文链接 ↗' : ''}
      </p>
    </div>
  )
}
