import type { LessonStep } from '../../data/papers/attention/lessons'

type Props = {
  steps: LessonStep[]
  active: number
  onPrev: () => void
  onNext: () => void
  onSelect: (i: number) => void
}

export function StepRail({ steps, active, onPrev, onNext, onSelect }: Props) {
  return (
    <div className="step-rail">
      <button type="button" className="chip" onClick={onPrev} disabled={active <= 0}>
        ← 上一步
      </button>
      <div className="steps" role="tablist" aria-label="本课步骤">
        {steps.map((step, i) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`step-dot ${i === active ? 'active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <i>{i + 1}</i>
            <span>{step.title}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <span className="mono" style={{ color: 'var(--muted)', fontSize: 10, alignSelf: 'center' }}>
          {active + 1}/{steps.length}
        </span>
        <button type="button" className="chip active" onClick={onNext}>
          下一步 →
        </button>
      </div>
    </div>
  )
}
