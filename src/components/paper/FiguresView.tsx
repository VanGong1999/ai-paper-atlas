import { figures } from '../../data/papers/attention/figures'
import { fulltextZh } from '../../data/papers/attention/fulltext-zh'
import { lessons } from '../../data/papers/attention/lessons'
import { ExplainableScope } from './Explainable'
import { PaperFigureCard } from './PaperFigureCard'

type Props = {
  chapter: string
  onChapterChange: (chapter: string) => void
  activeFigureIds: string[]
  onSelectStep: (lessonIndex: number, stepIndex: number) => void
  onReadTranslation: (originalId: string) => void
}

const chapters = fulltextZh.filter(block => figures.some(figure => figure.originalId === block.originalId))
const figureChapterIds = new Set(chapters.map(block => block.originalId))

function normalizeFigureChapter(chapter: string) {
  return figureChapterIds.has(chapter) ? chapter : 'all'
}
const readingSteps = lessons.flatMap((lesson, lessonIndex) =>
  lesson.steps.map((step, stepIndex) => ({
    lessonIndex, stepIndex, lessonTitle: lesson.title, stepTitle: step.title, figureIds: step.figureIds,
  })),
)

export function FiguresView({ chapter, onChapterChange, activeFigureIds, onSelectStep, onReadTranslation }: Props) {
  const normalizedChapter = normalizeFigureChapter(chapter)
  const visible = figures.filter(figure => normalizedChapter === 'all' || figure.originalId === normalizedChapter)
  const ordered = [...visible.filter(figure => activeFigureIds.includes(figure.id)),
    ...visible.filter(figure => !activeFigureIds.includes(figure.id))]

  return (
    <div className="figures-layout">
      <div className="figures-toolbar">
        <div>
          <h2>论文图表</h2>
          <span className="figures-attribution" lang="en">Vaswani et al. · Attention Is All You Need</span>
        </div>
        <label>
          图表章节
          <select value={normalizedChapter} onChange={event => onChapterChange(normalizeFigureChapter(event.target.value))}>
            <option value="all">全部章节</option>
            {chapters.map(block => (
              <option key={block.originalId} value={block.originalId}>
                {/^[0-9]/.test(block.section) ? `${block.section} ` : ''}{block.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ExplainableScope>
        <div className="figure-index">
          {ordered.map(figure => (
            <PaperFigureCard key={figure.id} figure={figure} related={activeFigureIds.includes(figure.id)}
              steps={readingSteps.filter(step => step.figureIds.includes(figure.id))}
              onSelectStep={onSelectStep} onReadTranslation={onReadTranslation} />
          ))}
        </div>
      </ExplainableScope>
    </div>
  )
}
