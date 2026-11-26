import { useEffect, useMemo, useState } from 'react'
import { LessonNav } from '../components/paper/LessonNav'
import { OriginalDrawer } from '../components/paper/OriginalDrawer'
import { Stage } from '../components/paper/Stage'
import { StepRail } from '../components/paper/StepRail'
import { fulltextZh } from '../data/papers/attention/fulltext-zh'
import { lessons } from '../data/papers/attention/lessons'
import '../styles/paper.css'

type Mode = 'learn' | 'fulltext'

export function AttentionPage() {
  const [mode, setMode] = useState<Mode>('learn')
  const [lessonId, setLessonId] = useState(lessons[0].id)
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [sectionId, setSectionId] = useState(fulltextZh[0].id)

  const lesson = useMemo(
    () => lessons.find((l) => l.id === lessonId) ?? lessons[0],
    [lessonId],
  )
  const step = lesson.steps[Math.min(stepIdx, lesson.steps.length - 1)]
  const section = fulltextZh.find((s) => s.id === sectionId) ?? fulltextZh[0]

  useEffect(() => {
    setStepIdx(0)
  }, [lessonId])

  useEffect(() => {
    if (!playing || mode !== 'learn') return
    const id = window.setInterval(() => {
      setStepIdx((i) => (i + 1) % lesson.steps.length)
    }, 4200)
    return () => window.clearInterval(id)
  }, [playing, lesson.steps.length, mode])

  const goNext = () => {
    if (stepIdx < lesson.steps.length - 1) setStepIdx(stepIdx + 1)
    else {
      const li = lessons.findIndex((l) => l.id === lessonId)
      if (li < lessons.length - 1) {
        setLessonId(lessons[li + 1].id)
        setStepIdx(0)
      }
    }
  }

  const goPrev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
    else {
      const li = lessons.findIndex((l) => l.id === lessonId)
      if (li > 0) {
        const prev = lessons[li - 1]
        setLessonId(prev.id)
        setStepIdx(prev.steps.length - 1)
      }
    }
  }

  return (
    <div className="cockpit">
      <div className="cockpit-tabs">
        <button type="button" className={mode === 'learn' ? 'active' : ''} onClick={() => setMode('learn')}>
          Learn 导读
        </button>
        <button
          type="button"
          className={mode === 'fulltext' ? 'active' : ''}
          onClick={() => setMode('fulltext')}
        >
          全文中译
        </button>
        <span className="spacer" />
        <a href={`${import.meta.env.BASE_URL}article/1706.03762v7.pdf`} target="_blank" rel="noreferrer">
          打开 PDF ↗
        </a>
        <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">
          arXiv ↗
        </a>
      </div>

      {mode === 'learn' ? (
        <div className="learn-layout">
          <LessonNav
            lessons={lessons}
            activeId={lessonId}
            onSelect={(id) => {
              setLessonId(id)
              setPlaying(false)
            }}
          />

          <div className="stage-wrap">
            <div className="stage-toolbar">
              <button type="button" aria-label="重放" onClick={() => setStepIdx(0)}>
                ↻
              </button>
              <button
                type="button"
                aria-label={playing ? '暂停' : '播放'}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? '❚❚' : '▶'}
              </button>
              <button type="button" aria-label="缩小" onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}>
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" aria-label="放大" onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}>
                +
              </button>
              <span style={{ marginLeft: 'auto' }}>
                {lesson.title} · 步骤 {stepIdx + 1}/{lesson.steps.length}
              </span>
            </div>
            <Stage lesson={lesson} step={step} playing={playing} zoom={zoom} />
          </div>

          <aside className="detail-panel">
            <div className="eyebrow">SOLUTION / 本节讲解</div>
            <h2>{step.title}</h2>
            <p className="body">{step.body}</p>
            {step.formula && <div className="formula-box">{step.formula}</div>}
            {step.diffs && step.diffs.length > 0 && (
              <div className="diff-box">
                <div className="label">STATE DIFF</div>
                <ul>
                  {step.diffs.map((d) => (
                    <li key={d}>+ {d}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className="chip active"
              onClick={() => {
                if (step.originalId) {
                  setSectionId(
                    fulltextZh.find((b) => b.originalId === step.originalId)?.id || fulltextZh[0].id,
                  )
                  setMode('fulltext')
                }
              }}
            >
              对照原文 / 全文中译 →
            </button>
            <div className="learn-list">
              <div className="eyebrow">YOU'LL LEARN</div>
              <ul>
                {lesson.learn.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </div>
          </aside>

          <StepRail
            steps={lesson.steps}
            active={stepIdx}
            onPrev={goPrev}
            onNext={goNext}
            onSelect={(i) => {
              setStepIdx(i)
              setPlaying(false)
            }}
          />
        </div>
      ) : (
        <div className="fulltext-layout">
          <nav className="fulltext-nav" aria-label="中文章节">
            {fulltextZh.map((block) => (
              <button
                key={block.id}
                type="button"
                className={block.id === sectionId ? 'active' : ''}
                onClick={() => setSectionId(block.id)}
              >
                {block.section} {block.title}
              </button>
            ))}
          </nav>
          <div className="fulltext-main">
            <article>
              <div className="eyebrow">CHINESE FULLTEXT · 点击右侧或下方对照英文</div>
              <h2>
                {section.section} {section.title}
              </h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
              <p style={{ marginTop: 20 }}>
                <a
                  className="chip active"
                  href={`${import.meta.env.BASE_URL}article/1706.03762v7.pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  在 PDF 中查看完整原文 ↗
                </a>
              </p>
            </article>
          </div>
          <OriginalDrawer originalId={section.originalId} />
        </div>
      )}
    </div>
  )
}
