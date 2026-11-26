import { motion, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef } from 'react'
import type { Explainable } from '../../data/papers/attention/explainables'

type Props = {
  id: string
  content: Explainable
  example?: string
  element: Element
  pointer?: { x: number; y: number }
}

const gap = 8
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

function place(point: number, size: number, low: number, high: number) {
  if (point + gap + size <= high) return point + gap
  if (point - gap - size >= low) return point - gap - size
  // Use the side with more room and align to the available edge.
  const start = high - point >= point - low ? point + gap : point - gap - size
  return clamp(start, low, high - size)
}

export function TooltipPop({ id, content, example, element, pointer }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useLayoutEffect(() => {
    const tip = ref.current
    if (!tip) return

    const stage = element.closest<HTMLElement>('.stage-canvas')

    function position() {
      if (!tip) return
      const root = document.documentElement
      const viewport = { left: gap, top: gap, right: root.clientWidth - gap, bottom: root.clientHeight - gap }
      const boundary = stage?.getBoundingClientRect()
      const stageX = (boundary?.left ?? 0) + (stage?.clientLeft ?? 0)
      const stageY = (boundary?.top ?? 0) + (stage?.clientTop ?? 0)
      const left = Math.max(viewport.left, stageX + gap)
      const top = Math.max(viewport.top, stageY + gap)
      const right = Math.min(viewport.right, stageX + (stage?.clientWidth ?? root.clientWidth) - gap)
      const bottom = Math.min(viewport.bottom, stageY + (stage?.clientHeight ?? root.clientHeight) - gap)
      const anchor = element.getBoundingClientRect()

      if (anchor.right <= left - gap || anchor.left >= right + gap || anchor.bottom <= top - gap || anchor.top >= bottom + gap) {
        tip.style.visibility = 'hidden'
        return
      }

      // Favor the part of the stage actually on-screen, with the viewport as a
      // fallback if a narrow/partially scrolled stage cannot fit the full card.
      const withinStageX = right - left >= 220
      const minX = withinStageX ? left : viewport.left
      const maxX = withinStageX ? right : viewport.right
      tip.style.maxWidth = `${Math.min(288, maxX - minX)}px`
      const { width, height } = tip.getBoundingClientRect()
      const withinStageY = height <= bottom - top
      const minY = withinStageY ? top : viewport.top
      const maxY = withinStageY ? bottom : viewport.bottom
      const x = pointer?.x ?? clamp(anchor.left + anchor.width / 2, minX, maxX)
      const y = pointer?.y ?? clamp(anchor.top + anchor.height / 2, minY, maxY)
      tip.style.left = `${place(x, width, minX, maxX)}px`
      tip.style.top = `${place(y, height, minY, maxY)}px`
      tip.style.visibility = 'visible'
    }

    position()
    window.addEventListener('scroll', position, true)
    window.addEventListener('resize', position)
    const observer = new ResizeObserver(position)
    observer.observe(tip)
    if (stage) observer.observe(stage)
    return () => {
      window.removeEventListener('scroll', position, true)
      window.removeEventListener('resize', position)
      observer.disconnect()
    }
  }, [content, element, example, pointer])

  return (
    <motion.div
      className="tip-pop"
      ref={ref}
      id={id}
      role="tooltip"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.1 }}
    >
      <strong className="tip-title">{content.title}</strong>
      <p>{content.plain} {content.role}</p>
      {example && <p className="tip-example"><strong>{example}</strong></p>}
      {content.detail.map(line => <p className="tip-detail" key={line}>{line}</p>)}
      <p><strong>论文事实 · {content.paperFact}</strong></p>
      {content.misconception && <p>{content.misconception}</p>}
      <small>{/^\d/.test(content.source.section) ? '§' : ''}{content.source.section} · PDF p. {content.source.page}</small>
    </motion.div>
  )
}
