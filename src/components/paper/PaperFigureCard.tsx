import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { explainables, type Explainable as ExplainableContent, type ExplainableId } from '../../data/papers/attention/explainables'
import type { PaperFigure } from '../../data/papers/attention/figures'
import { fulltextZh } from '../../data/papers/attention/fulltext-zh'
import { Explainable } from './Explainable'
import { FigureRedraw } from './FigureRedraw'
import { SourceBadge } from './SourceBadge'

export type RelatedStep = { lessonIndex: number; stepIndex: number; lessonTitle: string; stepTitle: string }

type Props = {
  figure: PaperFigure
  related: boolean
  steps: RelatedStep[]
  onSelectStep: (lessonIndex: number, stepIndex: number) => void
  onReadTranslation: (originalId: string) => void
}

const figureExplainables: Record<PaperFigure['redrawType'], ExplainableId> = {
  architecture: 'encoder', attention: 'heads', complexity: 'complexity', translation: 'bleu',
  variants: 'variants', parsing: 'parsing', 'attention-pattern': 'self',
}

const appendixZh = fulltextZh.find(block => block.originalId === 'appendix')?.paragraphs
const tabs = ['原版', '重绘'] as const

export function PaperFigureCard({ figure, related, steps, onSelectStep, onReadTranslation }: Props) {
  const id = useId()
  const [tab, setTab] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reference = `${figure.kind} ${figure.number}`
  const explanation = figureExplainables[figure.redrawType]
  const registered = explainables[explanation]
  const fact = figure.redrawType === 'attention-pattern' ? appendixZh?.[figure.number - 3] : registered.paperFact
  const cardExplanation: ExplainableContent = {
    ...registered,
    title: figure.title,
    // Figure 2 illustrates the operation on p. 4. Its numerical head configuration is in §3.2.2 on p. 5.
    ...(figure.redrawType === 'attention' ? {} : { originalId: figure.originalId, source: figure.source }),
    paperFact: fact ?? figure.caption,
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - tab
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <article className="paper-figure" data-paper-figure={figure.id} data-related={related || undefined}
      aria-labelledby={id + '-title'}>
      <header className="paper-figure-heading">
        <div className="source-row">
          <SourceBadge source={figure.source} reference={reference} href={figure.originalAsset} />
          {related && <span className="figure-context">当前步骤</span>}
        </div>
        <h3 id={id + '-title'}>
          <Explainable as="button" kind="figure-title" explanation={explanation} content={cardExplanation}>
            {figure.title}
          </Explainable>
        </h3>
      </header>
      <div className="figure-tabs" role="tablist" aria-label={`${reference} 视图`}>
        {tabs.map((label, index) => (
          <button type="button" key={label} role="tab" id={`${id}-tab-${index}`}
            ref={element => { tabRefs.current[index] = element }}
            aria-selected={tab === index} aria-controls={id + '-panel'} tabIndex={tab === index ? 0 : -1}
            onClick={() => setTab(index)} onKeyDown={onTabKey}>
            {label}
          </button>
        ))}
      </div>
      <div className="figure-panel" role="tabpanel" id={id + '-panel'} aria-labelledby={`${id}-tab-${tab}`}>
        {tab === 0 ? (
          <>
            {imageFailed ? <p className="figure-preview-error">原版预览无法载入。</p> : (
              <a className="figure-preview" href={figure.originalAsset} target="_blank" rel="noreferrer">
                <img src={`${import.meta.env.BASE_URL}article/attention/${figure.id}-p${figure.source.page}.png`}
                  alt={`${reference} · ${figure.title} · PDF p. ${figure.source.page}`}
                  loading="lazy" onError={() => setImageFailed(true)} />
              </a>
            )}
            <a className="figure-pdf-link" href={figure.originalAsset} target="_blank" rel="noreferrer">
              在 PDF 中查看原版 ↗
            </a>
          </>
        ) : (
          <>
            <p className="figure-redraw-label">依据原论文重绘 · {reference}</p>
            <FigureRedraw figure={figure} />
          </>
        )}
      </div>
      <p className="figure-caption" lang="en">{figure.caption}</p>
      {fact && <p className="figure-fact"><strong>论文事实</strong> {fact}</p>}
      <footer className="figure-links">
        <button type="button" className="chip" onClick={() => onReadTranslation(figure.originalId)}>章节对照 →</button>
        {steps.map(step => (
          <button type="button" className="chip" key={`${step.lessonIndex}/${step.stepIndex}`}
            onClick={() => onSelectStep(step.lessonIndex, step.stepIndex)}
            title={step.lessonTitle} aria-label={`${step.lessonTitle} · ${step.stepTitle}`}>
            {steps.some(other => other !== step && other.stepTitle === step.stepTitle) && `${step.lessonTitle} · `}
            {step.stepTitle} →
          </button>
        ))}
      </footer>
    </article>
  )
}
