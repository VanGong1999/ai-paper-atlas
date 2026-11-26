import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { ForceGraphMethods, NodeObject } from 'react-force-graph-2d'
import { useNavigate } from 'react-router-dom'
import { hasInteractivePage } from '../../data/papers/catalog'
import { buildOrbitGraph, type OrbitNode } from '../../data/graph'
import type { TimelineEvent } from '../../data/timeline'

type Props = {
  events: TimelineEvent[]
  onHoverEvent?: (event: TimelineEvent | null) => void
}

type FGNode = NodeObject<OrbitNode>

export function ForceOrbit({ events, onHoverEvent }: Props) {
  const navigate = useNavigate()
  const wrapRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphMethods<FGNode> | undefined>(undefined)
  const [size, setSize] = useState({ w: 800, h: 520 })
  const [hoverId, setHoverId] = useState<string | null>(null)

  const graph = useMemo(() => buildOrbitGraph(events), [events])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: Math.max(320, width), h: Math.max(360, height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    const charge = fg.d3Force('charge') as { strength?: (n: number) => void } | undefined
    charge?.strength?.(-90)
    const link = fg.d3Force('link') as { distance?: (n: number) => void } | undefined
    link?.distance?.(52)
    const id = window.setInterval(() => {
      fg.d3ReheatSimulation()
    }, 9000)
    return () => window.clearInterval(id)
  }, [graph])

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as OrbitNode & { x: number; y: number }
      if (n.x == null || n.y == null) return
      const active = hoverId === n.id
      const r = Math.sqrt(n.val || 4) * (n.kind === 'event' ? 2.1 : 2.6) * (active ? 1.25 : 1)
      const label = n.kind === 'event' && n.name.length > 18 ? `${n.name.slice(0, 16)}…` : n.name

      if (active) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2)
        ctx.fillStyle = `${n.color}33`
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = n.color
      ctx.shadowColor = n.color
      ctx.shadowBlur = active ? 18 : 8
      ctx.fill()
      ctx.shadowBlur = 0

      if (n.kind !== 'event') {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 2.5, 0, Math.PI * 2)
        ctx.strokeStyle = `${n.color}88`
        ctx.lineWidth = 1 / globalScale
        ctx.stroke()
      }

      const fontSize = Math.max(10 / globalScale, n.kind === 'event' ? 2.8 : 3.4)
      ctx.font = `${n.kind === 'event' ? 500 : 700} ${fontSize}px IBM Plex Mono, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = active ? '#f4f8ea' : 'rgba(238,238,222,0.82)'
      ctx.fillText(label, n.x, n.y + r + 2)
    },
    [hoverId],
  )

  const openNode = (node: FGNode) => {
    const n = node as OrbitNode
    if (n.kind !== 'event' || !n.event) return
    if (hasInteractivePage(n.event) && n.event.visual) navigate(n.event.visual)
    else navigate(`/library/${n.event.id}`)
  }

  return (
    <div className="force-orbit" ref={wrapRef}>
      <div className="force-orbit-badge">
        <span className="pulse" />
        LIVE GRAPH · {graph.nodes.length} NODES · {graph.links.length} LINKS
      </div>
      <ForceGraph2D
        ref={fgRef}
        width={size.w}
        height={size.h}
        graphData={graph}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={5}
        linkColor={(l) => {
          const kind = (l as { kind?: string }).kind
          if (kind === 'related') return 'rgba(211,250,114,0.35)'
          if (kind === 'topic') return 'rgba(126,184,212,0.28)'
          return 'rgba(154,170,142,0.22)'
        }}
        linkWidth={(l) => ((l as { kind?: string }).kind === 'related' ? 1.6 : 1)}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1.4}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={() => 'rgba(211,250,114,0.7)'}
        cooldownTicks={90}
        d3AlphaDecay={0.04}
        d3VelocityDecay={0.3}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          const n = node as OrbitNode & { x: number; y: number }
          if (n.x == null || n.y == null) return
          const r = Math.sqrt(n.val || 4) * 3
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
          ctx.fill()
        }}
        onNodeHover={(node) => {
          const n = (node as OrbitNode | null) ?? null
          setHoverId(n?.id ?? null)
          onHoverEvent?.(n?.kind === 'event' ? n.event ?? null : null)
        }}
        onNodeClick={(node) => openNode(node)}
        onBackgroundClick={() => {
          setHoverId(null)
          onHoverEvent?.(null)
        }}
      />
    </div>
  )
}
