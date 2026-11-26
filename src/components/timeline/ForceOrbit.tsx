import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { ForceGraphMethods, NodeObject } from 'react-force-graph-2d'
import { useNavigate } from 'react-router-dom'
import { hasInteractivePage } from '../../data/papers/catalog'
import { buildOrbitGraph, type OrbitLink, type OrbitNode } from '../../data/graph'
import type { TimelineEvent } from '../../data/timeline'

type Props = {
  events: TimelineEvent[]
  onHoverEvent?: (event: TimelineEvent | null) => void
}

type FGNode = NodeObject<OrbitNode>
type OrbitPalette = {
  light: boolean
  links: Record<OrbitLink['kind'], string>
  particle: string
  label: string
  activeLabel: string
}

export function ForceOrbit({ events, onHoverEvent }: Props) {
  const navigate = useNavigate()
  const wrapRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphMethods<FGNode> | undefined>(undefined)
  const [size, setSize] = useState({ w: 800, h: 520 })
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [palette, setPalette] = useState<OrbitPalette>()

  const graph = useMemo(() => buildOrbitGraph(events), [events])

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const root = document.documentElement
    const updatePalette = () => {
      const style = getComputedStyle(wrap)
      const read = (token: string) => style.getPropertyValue(token).trim()
      setPalette({
        light: root.dataset.theme === 'light',
        links: {
          org: read('--orbit-link-org'),
          topic: read('--orbit-link-topic'),
          related: read('--orbit-link-related'),
        },
        particle: read('--orbit-particle'),
        label: read('--orbit-label'),
        activeLabel: read('--orbit-label-active'),
      })
    }
    updatePalette()
    const observer = new MutationObserver(updatePalette)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

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
      const light = palette?.light
      const color = light ? `color-mix(in srgb, ${n.color} 38%, black)` : n.color

      if (active) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2)
        ctx.fillStyle = light ? `color-mix(in srgb, ${color} 20%, transparent)` : `${color}33`
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = active ? 18 : 8
      ctx.fill()
      ctx.shadowBlur = 0

      if (n.kind !== 'event') {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 2.5, 0, Math.PI * 2)
        ctx.strokeStyle = light ? `color-mix(in srgb, ${color} 53%, transparent)` : `${color}88`
        ctx.lineWidth = 1 / globalScale
        ctx.stroke()
      }

      const fontSize = Math.max(10 / globalScale, n.kind === 'event' ? 2.8 : 3.4)
      ctx.font = `${n.kind === 'event' ? 500 : 700} ${fontSize}px IBM Plex Mono, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = (active ? palette?.activeLabel : palette?.label) ?? color
      ctx.fillText(label, n.x, n.y + r + 2)
    },
    [hoverId, palette],
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
        linkColor={(l) => palette?.links[(l as OrbitLink).kind] ?? ''}
        linkWidth={(l) => ((l as { kind?: string }).kind === 'related' ? 1.6 : 1)}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1.4}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={() => palette?.particle ?? ''}
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
