import { motion } from 'framer-motion'
import { useLayoutEffect, useRef } from 'react'

type Props = {
  text: string
  x: number
  y: number
}

export function TooltipPop({ text, x, y }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const tip = ref.current
    const stage = tip?.offsetParent
    if (!tip || !(stage instanceof HTMLElement)) return

    const bounds = stage.getBoundingClientRect()
    const margin = 8
    const left = Math.max(bounds.left, 0) + margin
    const right = Math.min(bounds.left + stage.clientWidth, document.documentElement.clientWidth) - margin
    const top = Math.max(bounds.top, 0) + margin
    const bottom = Math.min(bounds.top + stage.clientHeight, window.innerHeight) - margin
    const { width, height } = tip.getBoundingClientRect()

    const tipX = Math.max(left, Math.min(x - width / 2, right - width))
    const tipY = y + margin + height <= bottom ? y + margin : y - margin - height
    tip.style.left = `${tipX - bounds.left + stage.scrollLeft}px`
    tip.style.top = `${Math.max(top, Math.min(tipY, bottom - height)) - bounds.top + stage.scrollTop}px`
  }, [text, x, y])

  return (
    <motion.div
      className="tip-pop"
      ref={ref}
      role="tooltip"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {text}
    </motion.div>
  )
}
