import { useMemo, type CSSProperties } from 'react'
import type { Lesson, LessonStep } from '../../data/papers/attention/lessons'
import { ArchitectureStage } from './ArchitectureStage'
import { AttentionMatrixStage } from './AttentionMatrixStage'
import { ComplexityStage } from './ComplexityStage'
import { MultiHeadStage } from './MultiHeadStage'
import { PositionEncodingStage } from './PositionEncodingStage'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

type Props = {
  lesson: Lesson
  step: LessonStep
  playing: boolean
  playbackKey: number
  zoom: number
}

export function Stage({ lesson, step, playing, playbackKey, zoom }: Props) {
  const highlight = useMemo(() => new Set(step.highlight), [step.highlight])

  return (
    <div className="stage-canvas" data-stage={lesson.stage} data-playing={playing} data-replay={playbackKey % 2}>
      <div className="stage-scene" style={{ '--stage-zoom': zoom } as CSSProperties}>
        <LessonScene key={lesson.id} lesson={lesson} step={step} highlight={highlight} />
      </div>
    </div>
  )
}

function LessonScene({ lesson, step, highlight }: StageProps & Pick<Props, 'lesson' | 'step'>) {
  switch (lesson.stage) {
    case 'architecture': return <ArchitectureStage highlight={highlight} />
    case 'attention': return <AttentionMatrixStage highlight={highlight} showHeatmap={step.id === 'heat'} />
    case 'multi-head': return <MultiHeadStage highlight={highlight} showApplications={step.id === 'types'} />
    case 'position': return <PositionEncodingStage />
    case 'complexity': return <ComplexityStage key={step.id} highlight={highlight} />
    default: return <LessonDiagram lesson={lesson} highlight={highlight} />
  }
}

function LessonDiagram({ lesson, highlight }: StageProps & Pick<Props, 'lesson'>) {
  // Adjust the Task 1 node geometry together so its layout also fits the 640-unit stages.
  const scale = 640 / 700
  const nodes = new Map(lesson.nodes.map(node => [node.id, node]))
  return (
    <StageSvg label={lesson.title} height={310}>
      {lesson.edges.map(([from, to]) => {
        const a = nodes.get(from)
        const b = nodes.get(to)
        if (!a || !b) return null
        const start = (a.x + 160) * scale
        const end = b.x * scale
        const y1 = a.y * scale + 20
        const y2 = b.y * scale + 20
        return <StageFlow key={from + '/' + to} d={`M${start} ${y1}L${end} ${y2}`}
          active={highlight.has(from) || highlight.has(to)} />
      })}
      {lesson.nodes.map(node => (
        <StageBlock key={node.id} id={node.explainableId} text={node.label}
          x={node.x * scale} y={node.y * scale} w={160 * scale} h={40}
          tone={node.group} active={highlight.has(node.id)} />
      ))}
    </StageSvg>
  )
}
