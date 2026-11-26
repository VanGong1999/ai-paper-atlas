import type { Kind, Org, Topic } from '../../data/timeline'
import { KINDS, ORGS, TOPICS } from '../../data/timeline'

type Props = {
  org: Org | '全部'
  topic: Topic | '全部'
  kind: Kind | '全部'
  query: string
  onOrg: (v: Org | '全部') => void
  onTopic: (v: Topic | '全部') => void
  onKind: (v: Kind | '全部') => void
  onQuery: (v: string) => void
  onReset: () => void
}

export function FilterChips({
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
  return (
    <div className="home-filters">
      <div className="filter-toolbar">
        <input
          className="search-box"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="搜索论文 / 公司 / 关键词"
          aria-label="搜索时间线"
        />
        <button type="button" className="chip" onClick={onReset}>
          重置 ↺
        </button>
      </div>

      <div className="filter-row">
        <span className="filter-label">
          机构 <small>ORG</small>
        </span>
        <div className="chip-row">
          <button type="button" className={`chip ${org === '全部' ? 'active' : ''}`} onClick={() => onOrg('全部')}>
            全部
          </button>
          {ORGS.map((o) => (
            <button
              key={o}
              type="button"
              className={`chip ${org === o ? 'active' : ''}`}
              onClick={() => onOrg(o)}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">
          主题 <small>TOPIC</small>
        </span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${topic === '全部' ? 'active' : ''}`}
            onClick={() => onTopic('全部')}
          >
            全部
          </button>
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${topic === t ? 'active' : ''} ${t === 'AI Infra' ? 'accent-infra' : ''} ${t === 'AI Agent' ? 'accent-agent' : ''}`}
              onClick={() => onTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">
          类型 <small>KIND</small>
        </span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${kind === '全部' ? 'active' : ''}`}
            onClick={() => onKind('全部')}
          >
            全部
          </button>
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className={`chip ${kind === k ? 'active' : ''}`}
              onClick={() => onKind(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
