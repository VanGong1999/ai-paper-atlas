import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ExplainableScope } from '../components/paper/Explainable'
import { FiguresView } from '../components/paper/FiguresView'
import { LessonNav } from '../components/paper/LessonNav'
import { OriginalDrawer } from '../components/paper/OriginalDrawer'
import { PaperFormula } from '../components/paper/PaperFormula'
import { PaperModeTabs, type PaperMode } from '../components/paper/PaperModeTabs'
import { SourceBadge } from '../components/paper/SourceBadge'
import { Stage } from '../components/paper/Stage'
import { StepRail } from '../components/paper/StepRail'
import { explainables, type Explainable, type ExplainableId } from '../data/papers/attention/explainables'
import { figures } from '../data/papers/attention/figures'
import { fulltextZh } from '../data/papers/attention/fulltext-zh'
import { lessons } from '../data/papers/attention/lessons'
import { pdfAsset } from '../data/papers/attention/originals-en'
import '../styles/paper.css'

type ReadingPosition = {
  lessonIndex: number
  stepIndex: number
  figureChapterOverride: string | null
  translationId: string | null
  visited: ReadonlySet<string>
}

function visitStep(current: ReadingPosition, lessonIndex: number, stepIndex: number): ReadingPosition {
  if (current.lessonIndex === lessonIndex && current.stepIndex === stepIndex) return current

  const lesson = lessons[lessonIndex]
  const step = lesson.steps[stepIndex]
  return {
    lessonIndex, stepIndex, translationId: null, figureChapterOverride: null,
    visited: new Set([...current.visited, `${lesson.id}/${step.id}`]),
  }
}

export function AttentionPage() {
  const [mode, setMode] = useState<PaperMode>('learn')
  const [{ lessonIndex, stepIndex, translationId, figureChapterOverride, visited }, setPosition] = useState<ReadingPosition>(() => ({
    lessonIndex: 0,
    stepIndex: 0,
    translationId: null,
    figureChapterOverride: null,
    visited: new Set([`${lessons[0].id}/${lessons[0].steps[0].id}`]),
  }))
  const [playing, setPlaying] = useState(false)
  const [playbackKey, setPlaybackKey] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [selection, setSelection] = useState<{ id: ExplainableId; example?: string; content?: Explainable } | null>(null)
  const detailPanelRef = useRef<HTMLElement>(null)
  const translationNavRef = useRef<HTMLElement>(null)
  const translationItemRef = useRef<HTMLButtonElement>(null)

  const lesson = lessons[lessonIndex]
  const step = lesson.steps[stepIndex]
  const section = fulltextZh.find(entry => entry.id === (translationId ?? step.originalId)) ?? fulltextZh[0]
  const stepFigures = figures.filter(figure => step.figureIds.includes(figure.id))
  const canPrev = lessonIndex > 0 || stepIndex > 0
  const canNext = lessonIndex < lessons.length - 1 || stepIndex < lesson.steps.length - 1

  useEffect(() => setSelection(null), [step])

  useLayoutEffect(() => {
    const panel = detailPanelRef.current
    if (selection && panel && !panel.contains(document.activeElement)) panel.scrollTo({ top: 0 })
  }, [selection])

  useEffect(() => {
    if (!playing || mode !== 'learn') return

    const timer = window.setInterval(() => {
      setPosition(current => {
        const steps = lessons[current.lessonIndex].steps
        return visitStep(current, current.lessonIndex, (current.stepIndex + 1) % steps.length)
      })
    }, 4200)
    return () => window.clearInterval(timer)
  }, [playing, mode, lessonIndex, playbackKey])

  useLayoutEffect(() => {
    if (mode !== 'fulltext') return
    const nav = translationNavRef.current
    const active = translationItemRef.current
    if (!nav || !active) return

    const bounds = nav.getBoundingClientRect()
    const item = active.getBoundingClientRect()
    if (item.top < bounds.top) nav.scrollTop += item.top - bounds.top
    if (item.bottom > bounds.bottom) nav.scrollTop += item.bottom - bounds.bottom
  }, [mode, section.id])

  const selectExplainable = useCallback((id: ExplainableId, example?: string, content?: Explainable) => {
    setSelection({ id, example, content })
  }, [])

  function changeMode(nextMode: PaperMode) {
    if (nextMode !== 'learn') {
      setPlaying(false)
      setSelection(null)
    }
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

  function selectTranslation(originalId: string | null) {
    setPosition(current => {
      const stepSource = lessons[current.lessonIndex].steps[current.stepIndex].originalId
      const sameChapter = (current.translationId ?? stepSource) === (originalId ?? stepSource)
      return {
        ...current,
        translationId: originalId,
        figureChapterOverride: sameChapter ? current.figureChapterOverride : null,
      }
    })
  }

  function readTranslation(originalId: string | null) {
    selectTranslation(originalId)
    changeMode('fulltext')
    document.getElementById('paper-mode-fulltext')?.focus()
  }

  function readRelatedStep(nextLesson: number, nextStep: number) {
    selectStep(nextLesson, nextStep)
    changeMode('learn')
    document.getElementById('paper-mode-learn')?.focus()
  }

  function selectFigureChapter(chapter: string) {
    setPosition(current => ({ ...current, figureChapterOverride: chapter }))
  }

  function readChapterFigures() {
    selectFigureChapter(section.originalId)
    changeMode('figures')
    document.getElementById('paper-mode-figures')?.focus()
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
            <ExplainableScope onSelectExplainable={selectExplainable}>
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
                <Stage onClearSelection={() => setSelection(null)} lesson={lesson} step={step} playing={playing} playbackKey={playbackKey} zoom={zoom} />
              </div>

              <aside className="detail-panel" ref={detailPanelRef} key={`${lesson.id}/${step.id}`}>
                {selection && <SelectedExplanation content={selection.content ?? explainables[selection.id]} example={selection.example}
                  onClear={() => setSelection(null)} />}

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
                  <PaperFormula step={step} />
                </section>
                <section className="step-explanation">
                  <h3>教学解释</h3>
                  <p>{step.teachingExplanation}</p>
                  {step.diffs && <ul>{step.diffs.map(detail => <li key={detail}>{detail}</li>)}</ul>}
                </section>
                <button type="button" className="chip active" onClick={() => readTranslation(null)}>查看本节中译 →</button>
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
                  setPlaybackKey(value => value + 1)
                  setPlaying(true)
                }}
              />
            </ExplainableScope>
          </div>
        )}

        {mode === 'figures' && (
          <FiguresView chapter={figureChapterOverride ?? section.originalId} onChapterChange={selectFigureChapter}
            activeFigureIds={step.figureIds}
            onSelectStep={readRelatedStep} onReadTranslation={readTranslation} />
        )}

        {mode === 'fulltext' && (
          <div className="fulltext-layout">
            <nav className="fulltext-nav" aria-label="中文章节" ref={translationNavRef}>
              {fulltextZh.map(block => (
                <button
                  key={block.id}
                  type="button"
                  ref={block.id === section.id ? translationItemRef : undefined}
                  aria-current={block.id === section.id ? 'location' : undefined}
                  onClick={() => selectTranslation(block.id)}
                >
                  {/^\d/.test(block.section) && `${block.section} `}{block.title}
                </button>
              ))}
            </nav>
            <div className="fulltext-main" key={`translation/${section.id}`} id="paper-translation"
              lang="zh-Hans" tabIndex={0} data-original-id={section.originalId}>
              <article aria-labelledby="paper-translation-heading">
                <header className="fulltext-heading">
                  <div className="paper-label">中文译文</div>
                  <h2 id="paper-translation-heading">{/^\d/.test(section.section) && `${section.section} `}{section.title}</h2>
                  <div className="source-row">
                    <SourceBadge source={section.source} />
                    <a className="fulltext-jump" href="#paper-original">英文 ↓</a>
                    {figures.some(figure => figure.originalId === section.originalId) &&
                      <button type="button" className="chip" onClick={readChapterFigures}>本节图表 →</button>}
                  </div>
                </header>
                {section.paragraphs.map((paragraph, index) => <TranslationParagraph key={index} text={paragraph} />)}
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

function TranslationParagraph({ text }: { text: string }) {
  const emphasized = /(28\.4 BLEU|41\.[08] BLEU|N=6|d_model=512|d_ff=2048|warmup_steps=4000|8 块 P100 GPU|4 万个训练句|WSJ 第 23 节)/g
  const equation = /^(?:Attention\(|MultiHead\(|PE\(|lrate =)/.test(text)
  return (
    <p className={equation ? 'reader-equation' : undefined}>
      {text.split(emphasized).map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part)}
    </p>
  )
}

function SelectedExplanation({ content, example, onClear }: { content: Explainable; example?: string; onClear: () => void }) {
  return (
    <section className="selected-explanation" aria-label="所选元素">
      <div className="selection-header">
        <span className="paper-label">所选元素</span>
        <button type="button" aria-label="关闭元素解释" onClick={onClear}>×</button>
      </div>
      <h3 aria-live="polite">{content.title}{example && <small>{example}</small>}</h3>
      <p>{content.plain} {content.role}</p>
      <p className="paper-fact">{content.paperFact}</p>
      <ul>{content.detail.map(line => <li key={line}>{line}</li>)}</ul>
      <p><strong>教学解释 · </strong>{content.teachingExplanation}</p>
      {content.misconception && <p>{content.misconception}</p>}
      <SourceBadge source={content.source} />
    </section>
  )
}
