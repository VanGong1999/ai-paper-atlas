import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TimelineEvent } from '../../data/timeline'
import { HoverCard } from './HoverCard'

type Props = {
  events: TimelineEvent[]
}

type Pt = { x: number; y: number; event: TimelineEvent }

const W = 1400
const H = 720
const MIN_ZOOM = 0.55
const MAX_ZOOM = 2.8

function pathD() {
  return `M 60 ${H * 0.72}
    C ${W * 0.22} ${H * 0.18}, ${W * 0.38} ${H * 0.18}, ${W * 0.5} ${H * 0.5}
    S ${W * 0.78} ${H * 0.82}, ${W - 60} ${H * 0.28}`
}

function pointOnCurve(t: number): { x: number; y: number } {
  const samples = 200
  const pts: { x: number; y: number }[] = []
  const p0 = { x: 60, y: H * 0.72 }
  const p1 = { x: W * 0.22, y: H * 0.18 }
  const p2 = { x: W * 0.38, y: H * 0.18 }
  const p3 = { x: W * 0.5, y: H * 0.5 }
  const p4 = { x: W * 0.62, y: H * 0.82 }
  const p5 = { x: W * 0.78, y: H * 0.82 }
  const p6 = { x: W - 60, y: H * 0.28 }

  const bez = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
    d: { x: number; y: number },
    u: number,
  ) => {
    const m = 1 - u
    return {
      x: m * m * m * a.x + 3 * m * m * u * b.x + 3 * m * u * u * c.x + u * u * u * d.x,
      y: m * m * m * a.y + 3 * m * m * u * b.y + 3 * m * u * u * c.y + u * u * u * d.y,
    }
  }

  for (let i = 0; i <= samples / 2; i++) pts.push(bez(p0, p1, p2, p3, i / (samples / 2)))
  for (let i = 1; i <= samples / 2; i++) pts.push(bez(p3, p4, p5, p6, i / (samples / 2)))

  const idx = Math.min(pts.length - 1, Math.max(0, Math.round(t * (pts.length - 1))))
  return pts[idx]
}

function colorFor(event: TimelineEvent) {
  if (event.topics.includes('AI Infra')) return '#7eb8d4'
  if (event.topics.includes('AI Agent')) return '#b8a4e3'
  if (event.topics.includes('推理')) return '#f3a776'
  return '#d3fa72'
}

export function CurvedTimeline({ events }: Props) {
  const navigate = useNavigate()
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)

  const [hover, setHover] = useState<{ event: TimelineEvent; x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)

  const points: Pt[] = useMemo(() => {
    if (!events.length) return []
    const min = new Date(events[0].date + '-01').getTime()
    const max = new Date(events[events.length - 1].date + '-01').getTime()
    const span = Math.max(1, max - min)
    return events.map((event, i) => {
      const t = (new Date(event.date + '-01').getTime() - min) / span
      const base = pointOnCurve(t)
      const offset = ((i % 5) - 2) * 22
      return { event, x: base.x, y: Math.min(H - 48, Math.max(48, base.y + offset)) }
    })
  }, [events])

  const years = useMemo(() => {
    const ys = Array.from(new Set(events.map((e) => e.year))).sort((a, b) => a - b)
    return ys.length ? ys : [2017, 2026]
  }, [events])

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

  const zoomAt = useCallback((nextZoom: number, cx: number, cy: number) => {
    setZoom((prev) => {
      const z = clampZoom(nextZoom)
      const ratio = z / prev
      setPan((p) => ({
        x: cx - (cx - p.x) * ratio,
        y: cy - (cy - p.y) * ratio,
      }))
      return z
    })
  }, [])

  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      zoomAt(zoomRef.current * factor, cx, cy)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as Element
    if (target.closest('.node-hit')) return
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    }
    stageRef.current?.setPointerCapture(e.pointerId)
    setPanning(true)
    setHover(null)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
    setPan({ x: drag.originX + dx, y: drag.originY + dy })
  }

  const endPan = (e: ReactPointerEvent) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null
    setPanning(false)
  }

  const openEvent = (event: TimelineEvent) => {
    if (dragRef.current?.moved) return
    if (event.visual) navigate(event.visual)
    else if (event.url) window.open(event.url, '_blank', 'noreferrer')
  }

  return (
    <div
      className={`home-stage ${panning ? 'is-panning' : ''}`}
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
      <div className="stage-controls">
        <button type="button" aria-label="缩小" onClick={() => zoomAt(zoom * 0.85, (stageRef.current?.clientWidth || 0) / 2, (stageRef.current?.clientHeight || 0) / 2)}>
          −
        </button>
        <button
          type="button"
          aria-label="重置缩放"
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" aria-label="放大" onClick={() => zoomAt(zoom * 1.15, (stageRef.current?.clientWidth || 0) / 2, (stageRef.current?.clientHeight || 0) / 2)}>
          +
        </button>
        <span className="stage-hint">拖拽平移 · 滚轮缩放 · 点击节点进入论文页</span>
      </div>

      {!events.length && <div className="empty-hint">没有匹配节点，试试重置筛选。</div>}

      <div
        className="timeline-world"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <svg className="timeline-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="弯曲研究时间线">
          <defs>
            <linearGradient id="lane" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#d3fa72" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#7eb8d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#b8a4e3" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <path d={pathD()} stroke="url(#lane)" strokeWidth="28" fill="none" opacity="0.35" />
          <motion.path
            className="timeline-path active-glow"
            d={pathD()}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {points.map(({ event, x, y }, i) => {
            const fill = colorFor(event)
            return (
              <g
                key={event.id}
                className="node-hit"
                transform={`translate(${x}, ${y})`}
                onPointerDown={(ev) => ev.stopPropagation()}
                onMouseEnter={(ev) => {
                  if (panning) return
                  const stage = stageRef.current?.getBoundingClientRect()
                  if (!stage) return
                  setHover({
                    event,
                    x: Math.min(stage.width - 340, Math.max(12, ev.clientX - stage.left + 14)),
                    y: Math.min(stage.height - 160, Math.max(48, ev.clientY - stage.top + 14)),
                  })
                }}
                onMouseMove={(ev) => {
                  if (panning) return
                  const stage = stageRef.current?.getBoundingClientRect()
                  if (!stage) return
                  setHover({
                    event,
                    x: Math.min(stage.width - 340, Math.max(12, ev.clientX - stage.left + 14)),
                    y: Math.min(stage.height - 160, Math.max(48, ev.clientY - stage.top + 14)),
                  })
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() => openEvent(event)}
              >
                <motion.circle
                  className="node-core"
                  r={7}
                  fill={fill}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.015 * i, type: 'spring', stiffness: 260, damping: 18 }}
                  style={{ filter: `drop-shadow(0 0 6px ${fill})` }}
                />
                <circle r={16} fill={fill} opacity={0.12} />
                <text className="node-label" x={12} y={-8}>
                  {event.title.length > 24 ? event.title.slice(0, 22) + '…' : event.title}
                </text>
                <text className="node-sub" x={12} y={8}>
                  {event.org} · {event.date}
                  {event.visual ? ' · 可视化 →' : ''}
                </text>
              </g>
            )
          })}
        </svg>

        <div className="year-axis">
          {years.map((y) => (
            <span key={y}>{y}</span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {hover && !panning && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
            <HoverCard event={hover.event} x={hover.x} y={hover.y} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
