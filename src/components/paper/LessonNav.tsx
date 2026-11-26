import type { Lesson } from '../../data/papers/attention/lessons'

type Props = {
  lessons: Lesson[]
  activeId: string
  onSelect: (id: string) => void
}

export function LessonNav({ lessons, activeId, onSelect }: Props) {
  const idx = Math.max(0, lessons.findIndex((l) => l.id === activeId))
  const pct = Math.round(((idx + 1) / lessons.length) * 100)

  return (
    <nav className="lesson-nav" aria-label="课程目录">
      <div className="progress">
        进度 {idx + 1}/{lessons.length} · {pct}%
        <div className="progress-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      {lessons.map((lesson) => (
        <button
          key={lesson.id}
          type="button"
          className={`lesson-item ${lesson.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(lesson.id)}
        >
          <small>{String(lesson.index).padStart(2, '0')} / {lesson.minutes} MIN</small>
          {lesson.title}
        </button>
      ))}
    </nav>
  )
}
