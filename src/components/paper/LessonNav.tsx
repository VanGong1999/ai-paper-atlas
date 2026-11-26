import { useLayoutEffect, useRef } from 'react'
import type { PaperSection } from '../../data/papers/attention/fulltext-zh'
import type { Lesson } from '../../data/papers/attention/lessons'

type Props = {
  lessons: Lesson[]
  sections: PaperSection[]
  activeId: string
  visited: ReadonlySet<string>
  onSelect: (index: number) => void
}

export function LessonNav({ lessons, sections, activeId, visited, onSelect }: Props) {
  const navRef = useRef<HTMLElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    const active = activeRef.current
    if (!nav || !active) return

    const revealChapter = () => {
      const bounds = nav.getBoundingClientRect()
      const item = active.getBoundingClientRect()
      if (item.top < bounds.top) nav.scrollTop += item.top - bounds.top
      if (item.bottom > bounds.bottom) nav.scrollTop += item.bottom - bounds.bottom
    }

    revealChapter()
    const observer = new ResizeObserver(revealChapter)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [activeId])

  const chapters = lessons.map((lesson, index) => {
    const number = lesson.source.section.match(/^\d+(?:\.\d+)*/)?.[0]
    const group = number?.split('.')[0] ?? lesson.originalId
    const section = sections.find(entry => entry.section === group || entry.id === group)
    const complete = lesson.steps.every(step => visited.has(`${lesson.id}/${step.id}`))
    return { lesson, index, group, section, number, complete }
  })
  const completed = chapters.filter(chapter => chapter.complete).length

  return (
    <nav className="lesson-nav" aria-label="课程目录" ref={navRef}>
      <div className="lesson-progress">
        <strong>论文导读</strong>
        <span>已读完 {completed}/{lessons.length} 章</span>
        <progress aria-label="已读完章节" value={completed} max={lessons.length} />
      </div>
      {chapters.map(({ lesson, index, group, section, number, complete }) => (
        <div key={lesson.id}>
          {group !== chapters[index - 1]?.group && (
            <h3 className="lesson-group">
              {section && /^\d/.test(section.section) ? `§${section.section} ` : ''}
              {section?.title ?? lesson.source.section}
            </h3>
          )}
          <button
            type="button"
            className="lesson-item"
            ref={lesson.id === activeId ? activeRef : undefined}
            aria-current={lesson.id === activeId ? 'step' : undefined}
            onClick={() => onSelect(index)}
          >
            <span>{lesson.title}</span>
            {number && <small>§{number}</small>}
            {complete && <small aria-label="已读完">✓</small>}
          </button>
        </div>
      ))}
    </nav>
  )
}
