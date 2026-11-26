import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { orgStats, topicStats } from '../../data/graph'
import type { TimelineEvent } from '../../data/timeline'
import { hasInteractivePage } from '../../data/papers/catalog'
import { AnimatedNumber } from './AnimatedNumber'
import { FilterChips, type FilterChipsProps } from './FilterChips'

type Props = FilterChipsProps & {
  events: TimelineEvent[]
  allCount: number
  infraCount: number
  agentCount: number
  hover: TimelineEvent | null
}

export function DashboardPanels({
  events,
  allCount,
  infraCount,
  agentCount,
  hover,
  org,
  topic,
  kind,
  query,
  onOrg,
  onTopic,
  onKind,
  onQuery,
  onReset,
}: Props) {
  const topics = topicStats(events).slice(0, 5)
  const orgs = orgStats(events)
  const maxTopic = Math.max(1, ...topics.map((t) => t.count))
  const recent = [...events].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const visualCount = events.filter((e) => hasInteractivePage(e)).length

  return (
    <aside className="dash-panels">
      <div className="dash-card dash-filter-card">
        <div className="eyebrow">FILTER GRAPH</div>
        <FilterChips
          org={org}
          topic={topic}
          kind={kind}
          query={query}
          onOrg={onOrg}
          onTopic={onTopic}
          onKind={onKind}
          onQuery={onQuery}
          onReset={onReset}
        />
      </div>
      <motion.div className="dash-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="eyebrow">SYSTEM STATUS</div>
        <div className="status-row">
          <span className="status-pill live">ACTIVE</span>
          <span className="status-pill">GRAPH READY</span>
        </div>
        <div className="dash-metrics">
          <div>
            <strong>
              <AnimatedNumber value={events.length} />
            </strong>
            <span>可见事件</span>
          </div>
          <div>
            <strong>
              <AnimatedNumber value={infraCount} />
            </strong>
            <span>AI Infra</span>
          </div>
          <div>
            <strong>
              <AnimatedNumber value={agentCount} />
            </strong>
            <span>AI Agent</span>
          </div>
        </div>
        <div className="mini-bar">
          <div style={{ width: `${(events.length / Math.max(1, allCount)) * 100}%` }} />
        </div>
        <p className="dash-note">筛选后占图谱 {Math.round((events.length / Math.max(1, allCount)) * 100)}%</p>
      </motion.div>

      <motion.div
        className="dash-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="eyebrow">TOPIC MIX</div>
        <div className="topic-bars">
          {topics.map((t, i) => (
            <div key={t.topic} className="topic-bar-row">
              <div className="topic-bar-label">
                <span>{t.topic}</span>
                <b>{t.count}</b>
              </div>
              <div className="topic-bar-track">
                <motion.div
                  className="topic-bar-fill"
                  style={{ background: t.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(t.count / maxTopic) * 100}%` }}
                  transition={{ delay: 0.12 + i * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="dash-card hover-panel"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <div className="eyebrow">FOCUS NODE</div>
        <AnimatePresence mode="wait">
          {hover ? (
            <motion.div
              key={hover.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="focus-meta">NODE ACTIVE · {hover.date} · {hover.org}</div>
              <p className="dash-note">完整摘要已在节点旁展开；点击节点可进入详情或可视化。</p>
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              className="dash-note"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              悬停网络节点查看摘要；点击论文节点进入详情 / 可视化。
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="dash-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="eyebrow">ORG SIGNAL</div>
        <ul className="org-list">
          {orgs.map((o) => (
            <li key={o.org}>
              <span>{o.org}</span>
              <b>{String(o.count).padStart(2, '0')}</b>
            </li>
          ))}
        </ul>
        <div className="viz-chip">
          可视化页 <strong>{String(visualCount).padStart(2, '0')}</strong>
        </div>
      </motion.div>

      <motion.div
        className="dash-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
      >
        <div className="eyebrow">RECENT PULSE</div>
        <ul className="recent-list">
          {recent.map((e) => (
            <li key={e.id}>
              <Link to={hasInteractivePage(e) && e.visual ? e.visual! : `/library/${e.id}`}>
                <small>{e.date}</small>
                <span>{e.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </motion.div>
    </aside>
  )
}
