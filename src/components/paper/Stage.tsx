import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import type { Lesson, LessonStep } from '../../data/papers/attention/lessons'
import { TooltipPop } from './TooltipPop'

type Props = {
  lesson: Lesson
  step: LessonStep
  playing: boolean
  zoom: number
}

const words = ['The', 'animal', 'ate', 'food']
const values = [
  [0.65, 0.15, 0.1, 0.1],
  [0.1, 0.55, 0.2, 0.15],
  [0.05, 0.25, 0.4, 0.3],
  [0.05, 0.15, 0.25, 0.55],
]

export function Stage({ lesson, step, playing, zoom }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  const [heatMsg, setHeatMsg] = useState('点击格子，查看示意注意力权重。')
  const highlight = new Set(step.highlight || [])

  const nodeMap = useMemo(() => {
    const m = new Map(lesson.nodes.map((n) => [n.id, n]))
    return m
  }, [lesson.nodes])

  return (
    <div className="stage-canvas" ref={wrapRef}>
      <svg
        className="stage-svg"
        viewBox="0 0 700 340"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        {lesson.edges.map(([a, b], i) => {
          const na = nodeMap.get(a)
          const nb = nodeMap.get(b)
          if (!na || !nb) return null
          const x1 = na.x + na.w / 2
          const y1 = na.y + na.h / 2
          const x2 = nb.x + nb.w / 2
          const y2 = nb.y + nb.h / 2
          return (
            <motion.line
              key={`${a}-${b}-${i}`}
              className="stage-edge"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              initial={{ '--edge-pulse': 0.2 }}
              animate={{
                '--edge-pulse': playing ? [0.35, 0.9, 0.35] : 0.55,
              }}
              transition={{
                '--edge-pulse': playing ? { duration: 1.8, repeat: Infinity } : { duration: 0.3 },
                delay: i * 0.04,
              }}
            />
          )
        })}

        {lesson.nodes.map((node, i) => {
          const active = highlight.has(node.id)
          const groupClass = node.group ? `group-${node.group}` : 'group-io'
          return (
            <g
              key={node.id}
              className={`stage-node ${active ? 'active' : ''}`}
              onMouseEnter={() => {
                const wrapElement = wrapRef.current
                const wrap = wrapElement?.getBoundingClientRect()
                const svg = wrapElement?.querySelector('svg')?.getBoundingClientRect()
                if (!wrapElement || !wrap || !svg) return
                const contentX = wrapElement.scrollLeft + svg.left - wrap.left + ((node.x + node.w / 2) / 700) * svg.width
                const contentY = wrapElement.scrollTop + svg.top - wrap.top + (node.y / 340) * svg.height
                const minX = wrapElement.scrollLeft + 8
                const maxX = Math.max(minX, wrapElement.scrollLeft + wrapElement.clientWidth - 270)
                const minY = wrapElement.scrollTop + 8
                const maxY = Math.max(minY, wrapElement.scrollTop + wrapElement.clientHeight - 120)
                setTip({
                  text: node.tip,
                  x: Math.min(Math.max(minX, contentX - 20), maxX),
                  y: Math.min(Math.max(minY, contentY - 12), maxY),
                })
              }}
              onMouseLeave={() => setTip(null)}
            >
              <motion.rect
                className={groupClass}
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx={8}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.04 * i, duration: 0.35 }}
              />
              <text x={node.x + 12} y={node.y + node.h / 2 + 4}>
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>

      {lesson.id === 'sdp' && step.id === 'heat' && (
        <div className="heatmap-panel">
          <div className="heat-grid">
            <span className="lab">Q↓/K→</span>
            {words.map((w) => (
              <span key={w} className="lab">
                {w}
              </span>
            ))}
            {words.flatMap((w, i) => [
              <span key={`r-${w}`} className="lab">
                {w}
              </span>,
              ...values[i].map((v, j) => (
                <button
                  key={`${i}-${j}`}
                  type="button"
                  data-level={Math.min(4, Math.ceil(v * 5))}
                  onClick={() =>
                    setHeatMsg(
                      `示意：查询「${words[i]}」对键「${words[j]}」分配 ${v.toFixed(2)} 的注意力（行和为 1）。`,
                    )
                  }
                >
                  {v.toFixed(2)}
                </button>
              )),
            ])}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--accent-ink)', fontSize: 12 }}>{heatMsg}</p>
        </div>
      )}

      <AnimatePresence>
        {tip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TooltipPop text={tip.text} x={tip.x} y={tip.y} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
