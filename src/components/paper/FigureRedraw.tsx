import type { ExplainableId } from '../../data/papers/attention/explainables'
import type { PaperFigure } from '../../data/papers/attention/figures'
import { ArchitectureStage } from './ArchitectureStage'
import { attentionSoftmaxExplainable } from './attentionSoftmaxExplainable'
import { Explainable } from './Explainable'
import { PaperTable } from './PaperTable'

const architectureHighlights = new Set<ExplainableId>(['encoder', 'decoder', 'cross', 'linear', 'softmax'])

type Operation = [label: string, explanation: ExplainableId]
const scaledDotProduct: Operation[] = [
  ['Q × Kᵀ', 'query'], ['缩放 ÷ √dₖ', 'scale'], ['可选掩码', 'mask'],
  ['Softmax', 'softmax'], ['与 V 相乘', 'value'],
]
const multiHead: Operation[] = [
  ['Q、K、V 分别线性投影', 'heads'], ['h 路并行缩放点积注意力', 'heads'],
  ['拼接', 'concat'], ['线性投影 Wᴼ', 'concat'],
]

function AttentionFlow({ title, operations }: { title: string; operations: Operation[] }) {
  return (
    <section className="figure-flow">
      <h4>{title}</h4>
      <ol>
        {operations.map(([label, id]) => (
          <li key={label}>
            <Explainable as="button" kind="figure-operation" explanation={id} label={label}
              content={id === 'softmax' ? attentionSoftmaxExplainable : undefined}>{label}</Explainable>
          </li>
        ))}
      </ol>
    </section>
  )
}

// Selected visible links, read from the original panels on pp. 13–15.
// All links have the same visual treatment here. The redraw encodes no weights.
const appendixPatterns: Record<number, { label: string; links: [string, string][] }[]> = {
  3: [{ label: '第 5 层 · 从 making 发出', links: [['making', 'more'], ['making', 'difficult']] }],
  4: [
    { label: '上图 · 第 5 个头（节选）', links: [['its', 'Law']] },
    { label: '下图 · 第 5、6 个头从 its 发出', links: [['its', 'Law'], ['its', 'application']] },
  ],
  5: [
    { label: '上图 · 绿色注意力头（节选）', links: [['The', 'Law'], ['its', 'application'], ['is', 'missing']] },
    { label: '下图 · 红色注意力头（节选）', links: [['will', 'be'], ['its', 'application'], ['what', 'what']] },
  ],
}

export function FigureRedraw({ figure }: { figure: PaperFigure }) {
  switch (figure.redrawType) {
    case 'architecture':
      return (
        <div className="figure-architecture" tabIndex={0} role="region" aria-label="Transformer 架构重绘">
          <ArchitectureStage highlight={architectureHighlights} />
        </div>
      )
    case 'attention':
      return (
        <div className="figure-flow-grid">
          <AttentionFlow title="缩放点积注意力" operations={scaledDotProduct} />
          <AttentionFlow title="多头注意力" operations={multiHead} />
        </div>
      )
    case 'attention-pattern':
      return (
        <div className="figure-pattern">
          <p>第 5 层编码器自注意力。仅重绘所示连接，权重见原图。</p>
          {appendixPatterns[figure.number].map(({ label, links }) => (
            <section key={label}>
              <h4>{label}</h4>
              <ul lang="en">
                {links.map(([query, key]) => <li key={`${query}/${key}`}>{query} <span>→</span> {key}</li>)}
              </ul>
            </section>
          ))}
        </div>
      )
    default:
      return <PaperTable figure={figure} redraw={figure.redrawType} />
  }
}
