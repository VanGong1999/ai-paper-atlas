import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { LessonStep } from '../../data/papers/attention/lessons'

type Props = {
  steps: LessonStep[]
  active: number
  playing: boolean
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  onSelect: (index: number) => void
  onTogglePlayback: () => void
  onReplay: () => void
}

export function StepRail({ steps, active, playing, canPrev, canNext, onPrev, onNext, onSelect, onTogglePlayback, onReplay }: Props) {
  const rail = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = rail.current
    const selected = list?.querySelector<HTMLButtonElement>('[aria-current="step"]')
    if (!list || !selected) return
    const bounds = list.getBoundingClientRect()
    const item = selected.getBoundingClientRect()
    if (item.left < bounds.left) list.scrollLeft += item.left - bounds.left
    if (item.right > bounds.right) list.scrollLeft += item.right - bounds.right
  }, [active, steps])

  function selectWithKey(event: KeyboardEvent, index: number) {
    let next: number
    switch (event.key) {
      case 'ArrowLeft': next = Math.max(0, index - 1); break
      case 'ArrowRight': next = Math.min(steps.length - 1, index + 1); break
      case 'Home': next = 0; break
      case 'End': next = steps.length - 1; break
      default: return
    }
    event.preventDefault()
    rail.current?.querySelectorAll('button')[next]?.focus()
    onSelect(next)
  }

  return (
    <nav className="step-rail" aria-label="导读步骤与播放控制">
      <div className="step-controls">
        <button type="button" className="chip" aria-label="上一步" onClick={onPrev} disabled={!canPrev}>←</button>
        <button type="button" className="chip" aria-label={playing ? '暂停' : '播放'} onClick={onTogglePlayback}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button type="button" className="chip" aria-label="重放" onClick={onReplay}>↻</button>
        <button type="button" className="chip" aria-label="下一步" onClick={onNext} disabled={!canNext}>→</button>
        <span className="step-count" aria-label={`本章第 ${active + 1} 步，共 ${steps.length} 步`}>{active + 1}/{steps.length}</span>
      </div>
      <div className="steps" ref={rail} role="group" aria-label="本章步骤">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            aria-current={index === active ? 'step' : undefined}
            tabIndex={index === active ? 0 : -1}
            className="step-dot"
            onClick={() => onSelect(index)}
            onKeyDown={event => selectWithKey(event, index)}
          >
            <span className="step-number">{index + 1}</span>
            {step.title}
          </button>
        ))}
      </div>
    </nav>
  )
}
