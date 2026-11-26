import type { ReactNode } from 'react'
import type { ExplainableId } from '../../data/papers/attention/explainables'
import { Explainable } from './Explainable'

export type StageProps = { highlight: ReadonlySet<ExplainableId> }

export function StageSvg({ label, height, children }: { label: string; height: number; children: ReactNode }) {
  return (
    <svg className="stage-svg" viewBox={`0 0 640 ${height}`} role="group" aria-label={label}>
      <defs>
        <marker id="stage-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0L8 4L0 8Z" fill="context-stroke" />
        </marker>
      </defs>
      {children}
    </svg>
  )
}

export function StageFlow({ d, active, arrow = true, branch = false, explanation, label, example, kind = 'data-flow' }: {
  d: string; active?: boolean; arrow?: boolean; branch?: boolean
  explanation?: ExplainableId; label?: string; example?: string; kind?: string
}) {
  const state = active ? ' flow-active' : ''
  const style = branch ? ' flow-branch' : ''
  if (explanation) {
    return (
      <Explainable as="g" explanation={explanation} kind={kind} label={label} example={example}
        className={`stage-flow-target${state}${style}`}>
        <path d={d} className="stage-edge" markerEnd={arrow ? 'url(#stage-arrow)' : undefined} />
        <path d={d} className="stage-flow-hit" />
        <path d={d} className="stage-flow" />
      </Explainable>
    )
  }
  return (
    <g aria-hidden="true" className={state + style}>
      <path d={d} className="stage-edge" markerEnd={arrow ? 'url(#stage-arrow)' : undefined} />
      <path d={d} className="stage-flow" />
    </g>
  )
}

export function StageBlock({ id, kind = 'stage-node', text, caption, x, y, w, h = 34, tone = 'io', active, example, selected, onActivate }: {
  id: ExplainableId; kind?: string; text: string; caption?: string
  x: number; y: number; w: number; h?: number; tone?: string; active?: boolean
  example?: string; selected?: boolean; onActivate?: () => void
}) {
  return (
    <Explainable as="g" explanation={id} kind={kind} label={caption ? `${text} · ${caption}` : text}
      className={`stage-node${active ? ' active' : ''}`} example={example}
      aria-pressed={selected} onActivate={onActivate}>
      <rect className={`group-${tone}`} x={x} y={y} width={w} height={h} rx={6} />
      <text x={x + w / 2} y={y + h / 2 - (caption ? 9 : 0)}>{text}</text>
      {caption && <text className="stage-node-caption" x={x + w / 2} y={y + h / 2 + 13}>{caption}</text>}
    </Explainable>
  )
}
