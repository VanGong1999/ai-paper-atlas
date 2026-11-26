import type { TimelineEvent } from '../../data/timeline'

type Props = {
  events: TimelineEvent[]
}

export function LiveTicker({ events }: Props) {
  const items = events.slice(0, 18).map((e) => `${e.date} · ${e.org} · ${e.title}`)
  const line = [...items, ...items].join('   ✳   ')

  return (
    <div className="live-ticker" aria-hidden>
      <span className="live-ticker-label">LIVE FEED</span>
      <div className="live-ticker-track">
        <div className="live-ticker-inner">{line || 'ORBIT RESEARCH GRAPH'}</div>
      </div>
    </div>
  )
}
