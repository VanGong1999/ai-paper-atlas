import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion'
import { useEffect, useState } from 'react'

type Props = {
  value: number
  pad?: number
  duration?: number
}

export function AnimatedNumber({ value, pad = 2, duration = 0.7 }: Props) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useMotionValueEvent(mv, 'change', (v) => setDisplay(Math.round(v)))

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] })
    return controls.stop
  }, [value, duration, mv])

  return <>{String(display).padStart(pad, '0')}</>
}
