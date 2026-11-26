import { useEffect, useState } from 'react'
import { LessonNav } from '../components/paper/LessonNav'
import { OriginalDrawer } from '../components/paper/OriginalDrawer'
import { PaperModeTabs, type PaperMode } from '../components/paper/PaperModeTabs'
import { SourceBadge } from '../components/paper/SourceBadge'
import { Stage } from '../components/paper/Stage'
import { StepRail } from '../components/paper/StepRail'
import { figures } from '../data/papers/attention/figures'
import { fulltextZh } from '../data/papers/attention/fulltext-zh'
import { lessons } from '../data/papers/attention/lessons'
import { pdfAsset } from '../data/papers/attention/originals-en'
import '../styles/paper.css'

type ReadingPosition = {
  lessonIndex: number
  stepIndex: number
  translationId: string | null
  visited: ReadonlySet<string>
}

function visitStep(current: ReadingPosition, lessonIndex: number, stepIndex: number): ReadingPosition {
  if (current.lessonIndex === lessonIndex && current.stepIndex === stepIndex) return current

  const lesson = lessons[lessonIndex]
  const step = lesson.steps[stepIndex]
  return {
    lessonIndex, stepIndex, translationId: null,
    visited: new Set([...current.visited, `${lesson.id}/${step.id}`]),
  }
}

export function AttentionPage() {
  const [mode, setMode] = useState<PaperMode>('learn')
  const [{ lessonIndex, stepIndex, translationId, visited }, setPosition] = useState<ReadingPosition>(() => ({
    lessonIndex: 0,
    stepIndex: 0,
    translationId: null,
    visited: new Set([`${lessons[0].id}/${lessons[0].steps[0].id}`]),
  }))
  const [playing, setPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)

  const lesson = lessons[lessonIndex]
  const step = lesson.steps[stepIndex]
  const section = fulltextZh.find(entry => entry.id === (translationId ?? step.originalId)) ?? fulltextZh[0]
  const stepFigures = figures.filter(figure => step.figureIds.includes(figure.id))
  const canPrev = lessonIndex > 0 || stepIndex > 0
  const canNext = lessonIndex < lessons.length - 1 || stepIndex < lesson.steps.length - 1

  useEffect(() => {
    if (!playing || mode !== 'learn') return

    const timer = window.setInterval(() => {
      setPosition(current => {
        const steps = lessons[current.lessonIndex].steps
        return visitStep(current, current.lessonIndex, (current.stepIndex + 1) % steps.length)
      })
    }, 4200)
    return () => window.clearInterval(timer)
  }, [playing, mode, lessonIndex])

  function changeMode(nextMode: PaperMode) {
    if (nextMode !== 'learn') setPlaying(false)
    setMode(nextMode)
  }

  function selectStep(nextLesson: number, nextStep: number) {
    setPlaying(false)
    setPosition(current => visitStep(current, nextLesson, nextStep))
  }

  function goPrev() {
    if (stepIndex > 0) selectStep(lessonIndex, stepIndex - 1)
    else if (canPrev) selectStep(lessonIndex - 1, lessons[lessonIndex - 1].steps.length - 1)
  }

  function goNext() {
    if (stepIndex < lesson.steps.length - 1) selectStep(lessonIndex, stepIndex + 1)
    else if (canNext) selectStep(lessonIndex + 1, 0)
  }

  function readStepTranslation() {
    setPosition(current => ({ ...current, translationId: null }))
    changeMode('fulltext')
    document.getElementById('paper-mode-fulltext')?.focus()
  }

  return (
    <div className="cockpit">
      <div className="cockpit-header">
        <PaperModeTabs mode={mode} onModeChange={changeMode} />
        <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">arXiv ↗</a>
      </div>

      <div className="cockpit-panel" id="paper-mode-panel" role="tabpanel" aria-labelledby={`paper-mode-${mode}`} tabIndex={0}>
        {mode !== 'learn' && (
          <div className="workbench-context">
            <span>导读位置</span>
            <strong>{lesson.title}</strong>
            <span>步骤 {stepIndex + 1}/{lesson.steps.length} · {step.title}</span>
          </div>
        )}

        {mode === 'learn' && (
          <div className="learn-layout">
            <LessonNav
              lessons={lessons}
              sections={fulltextZh}
              activeId={lesson.id}
              visited={visited}
              onSelect={index => selectStep(index, index === lessonIndex ? stepIndex : 0)}
            />

            <div className="stage-wrap">
              <div className="stage-toolbar">
                <strong>{lesson.title}</strong>
                <div className="stage-zoom" role="group" aria-label="舞台缩放">
                  <button type="button" aria-label="缩小" onClick={() => setZoom(value => Math.max(0.7, value - 0.1))}>−</button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button type="button" aria-label="放大" onClick={() => setZoom(value => Math.min(1.4, value + 0.1))}>+</button>
                </div>
              </div>
              <Stage lesson={lesson} step={step} playing={playing} zoom={zoom} />
            </div>

            <aside className="detail-panel" key={`${lesson.id}/${step.id}`}>
              <div className="paper-label">本步解释</div>
              <h2>{step.title}</h2>
              <div className="source-row">
                <SourceBadge source={step.source} />
                {stepFigures.map(figure => (
                  <SourceBadge key={figure.id} source={figure.source} reference={`${figure.kind} ${figure.number}`} href={figure.originalAsset} />
                ))}
              </div>
              <section className="step-explanation">
                <h3>论文原意</h3>
                <p className="paper-fact">{step.paperFact}</p>
                {step.formula && <div className="formula-box">{step.formula}</div>}
              </section>
              <section className="step-explanation">
                <h3>教学解释</h3>
                <p>{step.teachingExplanation}</p>
                {step.diffs && <ul>{step.diffs.map(detail => <li key={detail}>{detail}</li>)}</ul>}
              </section>
              <button type="button" className="chip active" onClick={readStepTranslation}>查看本节中译 →</button>
            </aside>

            <StepRail
              steps={lesson.steps}
              active={stepIndex}
              playing={playing}
              canPrev={canPrev}
              canNext={canNext}
              onPrev={goPrev}
              onNext={goNext}
              onSelect={index => selectStep(lessonIndex, index)}
              onTogglePlayback={() => setPlaying(value => !value)}
              onReplay={() => {
                setPosition(current => visitStep(current, current.lessonIndex, 0))
                setPlaying(true)
              }}
            />
          </div>
        )}

        {mode === 'figures' && (
          <div className="figures-layout">
            <h2>论文图表</h2>
            <p>图表预览待接入，点击来源可在 PDF 中查看原图或原表。</p>
            {stepFigures.length === 0 && <p>当前步骤没有关联图表。</p>}
            <ul className="figure-index">
              {[...stepFigures, ...figures.filter(figure => !step.figureIds.includes(figure.id))].map(figure => (
                <li key={figure.id} className={step.figureIds.includes(figure.id) ? 'related' : undefined}>
                  <h3>{figure.title}</h3>
                  <SourceBadge source={figure.source} reference={`${figure.kind} ${figure.number}`} href={figure.originalAsset} />
                  {step.figureIds.includes(figure.id) && <span className="figure-context">当前步骤</span>}
                  <p lang="en">{figure.caption}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode === 'fulltext' && (
          <div className="fulltext-layout">
            <nav className="fulltext-nav" aria-label="中文章节">
              {fulltextZh.map(block => (
                <button
                  key={block.id}
                  type="button"
                  aria-current={block.id === section.id ? 'location' : undefined}
                  onClick={() => setPosition(current => ({ ...current, translationId: block.id }))}
                >
                  {/^\d/.test(block.section) && `${block.section} `}{block.title}
                </button>
              ))}
            </nav>
            <div className="fulltext-main" key={`translation/${section.id}`}>
              <article>
                <h2>{/^\d/.test(section.section) && `${section.section} `}{section.title}</h2>
                <SourceBadge source={section.source} />
                {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </article>
            </div>
            <OriginalDrawer key={`original/${section.id}`} originalId={section.originalId} />
          </div>
        )}

        {mode === 'pdf' && (
          <div className="pdf-layout">
            <div className="pdf-toolbar">
              <SourceBadge source={step.source} />
              <a className="chip" href={pdfAsset} target="_blank" rel="noreferrer">打开 PDF ↗</a>
            </div>
            <iframe src={`${pdfAsset}#page=${step.source.page}`} title="Attention Is All You Need · PDF 原文" />
          </div>
        )}
      </div>
    </div>
  )
}
