import { lazy, Suspense, useMemo, useState } from 'react'
import type { Kind, Org, Topic, TimelineEvent } from '../data/timeline'
import { filterTimeline, timeline } from '../data/timeline'
import { CurvedTimeline } from '../components/timeline/CurvedTimeline'
import { DashboardPanels } from '../components/timeline/DashboardPanels'
import { EventList } from '../components/timeline/EventList'
import { FilterChips } from '../components/timeline/FilterChips'
import { LiveTicker } from '../components/timeline/LiveTicker'
import '../styles/home.css'

const ForceOrbit = lazy(() =>
  import('../components/timeline/ForceOrbit').then((m) => ({ default: m.ForceOrbit })),
)

type ViewMode = 'graph' | 'curve'

export function HomePage() {
  const [org, setOrg] = useState<Org | '全部'>('全部')
  const [topic, setTopic] = useState<Topic | '全部'>('全部')
  const [kind, setKind] = useState<Kind | '全部'>('全部')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('graph')
  const [hover, setHover] = useState<TimelineEvent | null>(null)

  const events = useMemo(
    () => filterTimeline(timeline, { org, topic, kind, q: query }),
    [org, topic, kind, query],
  )

  const infraCount = events.filter((e) => e.topics.includes('AI Infra')).length
  const agentCount = events.filter((e) => e.topics.includes('AI Agent')).length

  return (
    <div className="home">
      <section className="home-hero">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            FORCE ORBIT · RESEARCH GRAPH / 2017 → 2026
          </div>
          <h1>
            让研究脉络
            <span>活起来</span>
          </h1>
          <p>
            力导向网络自动展开机构、主题与论文关系。拖拽节点、悬停读摘要、点击进入详情。筛选会实时重塑整张图。
          </p>
        </div>
        <div className="view-switch" role="tablist" aria-label="视图切换">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'graph'}
            className={view === 'graph' ? 'active' : ''}
            onClick={() => setView('graph')}
          >
            力导向网络
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'curve'}
            className={view === 'curve' ? 'active' : ''}
            onClick={() => setView('curve')}
          >
            弯曲时间线
          </button>
        </div>
      </section>

      <FilterChips
        org={org}
        topic={topic}
        kind={kind}
        query={query}
        onOrg={setOrg}
        onTopic={setTopic}
        onKind={setKind}
        onQuery={setQuery}
        onReset={() => {
          setOrg('全部')
          setTopic('全部')
          setKind('全部')
          setQuery('')
        }}
      />

      <LiveTicker events={events} />

      <div className={`home-body ${view === 'graph' ? 'is-graph' : 'is-curve'}`}>
        {view === 'graph' ? (
          <>
            <div className="graph-stage panel">
              <Suspense fallback={<div className="empty-hint">加载力导向图谱…</div>}>
                <ForceOrbit events={events} onHoverEvent={setHover} />
              </Suspense>
            </div>
            <DashboardPanels
              events={events}
              allCount={timeline.length}
              infraCount={infraCount}
              agentCount={agentCount}
              hover={hover}
            />
          </>
        ) : (
          <CurvedTimeline events={events} />
        )}
      </div>

      <EventList events={events} />
    </div>
  )
}
