import { useMemo, type CSSProperties } from 'react'
import type { Lesson, LessonStep } from '../../data/papers/attention/lessons'
import { ArchitectureStage } from './ArchitectureStage'
import { AttentionMathStage, AttentionMatrixStage } from './AttentionMatrixStage'
import { ComplexityStage } from './ComplexityStage'
import { MultiHeadStage } from './MultiHeadStage'
import { PositionEncodingStage } from './PositionEncodingStage'
import { TrainingRecipeStage, TrainingStage } from './TrainingStage'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

type Props = {
  lesson: Lesson
  step: LessonStep
  playing: boolean
  playbackKey: number
  onClearSelection: () => void
  zoom: number
}

export function Stage({ lesson, step, playing, playbackKey, zoom, onClearSelection }: Props) {
  const highlight = useMemo(() => new Set(step.highlight), [step.highlight])

  return (
    <div className="stage-canvas" data-stage={lesson.stage} data-playing={playing} data-replay={playbackKey % 2}>
      <div className="stage-scene" style={{ '--stage-zoom': zoom } as CSSProperties}>
        <LessonScene onClearSelection={onClearSelection} key={lesson.id} lesson={lesson} step={step} highlight={highlight} />
      </div>
    </div>
  )
}

function LessonScene({ lesson, step, highlight, onClearSelection }: StageProps & Pick<Props, 'lesson' | 'step' | 'onClearSelection'>) {
  switch (lesson.stage) {
    case 'architecture': return <ArchitectureStage highlight={highlight} />
    case 'attention': return lesson.id === 'math-lab' ? <AttentionMathStage key={step.id} causal={step.id === 'causal'} onClearSelection={onClearSelection} /> : <AttentionMatrixStage highlight={highlight} showHeatmap={step.id === 'heat'} />
    case 'multi-head': return <MultiHeadStage highlight={highlight} showApplications={step.id === 'types'} />
    case 'training': return lesson.id === 'training-recipe' ? <TrainingRecipeStage highlight={highlight} /> : <TrainingStage highlight={highlight} onClearSelection={onClearSelection} />
    case 'feed-forward': return <FeedForwardStage highlight={highlight} />
    case 'position': return <PositionEncodingStage onClearSelection={onClearSelection} />
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


function FeedForwardStage({ highlight }: StageProps) {
  const residual = highlight.has('residual')
  return <>
    <StageSvg label="逐位置前馈网络的宽度变化与残差归一化" height={360}>
      <text className="diagram-title" x={320} y={32} textAnchor="middle">同一位置内：512 → 2048 → 512</text>
      <text className="diagram-subtitle" x={320} y={57} textAnchor="middle">每个位置使用相同权重，不同层使用不同参数</text>
      <StageFlow d="M114 140H142M268 140H294M405 140H431M557 140H584V244H483" explanation="ffn" active={!residual} label="两次线性变换与 ReLU" />
      <StageBlock id="ffn" text="x" caption="n × 512" x={20} y={112} w={94} h={56} tone="io" />
      <StageBlock id="ffn" text="xW₁ + b₁" caption="n × 2048" x={142} y={112} w={126} h={56} tone="encoder" active={!residual} />
      <StageBlock id="ffn" text="ReLU" caption="max(0, ·)" x={294} y={112} w={111} h={56} tone="attn" active={!residual} />
      <StageBlock id="ffn" text="· W₂ + b₂" caption="n × 512" x={431} y={112} w={126} h={56} tone="encoder" active={!residual} />
      <StageFlow d="M67 168V244H236" explanation="residual" branch active={residual} label="x 的残差旁路，宽度保持 512" />
      <StageBlock id="residual" text="Add → LayerNorm" caption="n × 512" x={236} y={217} w={247} h={54} tone="decoder" active={residual} />
      <text className="diagram-note" x={320} y={313} textAnchor="middle">注意力混合位置；FFN 只变换各位置的特征</text>
      <text className="diagram-note" x={320} y={339} textAnchor="middle">§5.4：训练时先对子层输出施加 dropout，再残差相加与归一化</text>
    </StageSvg>
    <p className="stage-caption"><strong>§3.1 P. 3 · §3.3 P. 5 · §5.4 P. 8</strong><span>教学重绘 · 形状省略批次轴，残差加数必须同形。</span></p>
  </>
}
