import { useState } from 'react'
import { attentionSoftmaxExplainable } from './attentionSoftmaxExplainable'
import { Explainable } from './Explainable'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

const words = ['The', 'animal', 'ate', 'food']
const weights = [
  [0.65, 0.15, 0.10, 0.10],
  [0.10, 0.55, 0.20, 0.15],
  [0.05, 0.25, 0.40, 0.30],
  [0.05, 0.15, 0.25, 0.55],
]

export function AttentionMatrixStage({ highlight, showHeatmap }: StageProps & { showHeatmap: boolean }) {
  const active = highlight.has('scale') || highlight.has('weights') || highlight.has('query')
  return (
    <>
      <StageSvg label="Fig. 2 左 · 缩放点积注意力原图重绘" height={430}>
        <text className="diagram-title" x={320} y={35} textAnchor="middle">Scaled Dot-Product Attention</text>
        <text className="diagram-subtitle" x={320} y={58} textAnchor="middle">缩放点积注意力</text>
        <StageFlow d="M263 353V329H274V304M320 353V329H306V304M290 274V257M290 227V210M290 180V163M290 133V116M290 86V71" active={active} explanation="scale" label="注意力计算主数据流" />
        <StageFlow d="M377 383V104H348" active={highlight.has('value') || highlight.has('weights')} explanation="value" label="值 V 到加权求和" />
        <StageBlock id="value" text="MatMul · 加权求和" x={232} y={86} w={116} h={30} tone="attn" active={highlight.has('weights')} />
        <StageBlock id="softmax" text="Softmax" x={232} y={133} w={116} h={30} tone="encoder" content={attentionSoftmaxExplainable} active={active} />
        <StageBlock id="mask" text="Mask（可选）" x={232} y={180} w={116} h={30} tone="attn" active={active} />
        <StageBlock id="scale" text="Scale · ÷ √dₖ" x={232} y={227} w={116} h={30} tone="train" active={active} />
        <StageBlock id="scale" text="MatMul · QKᵀ" x={232} y={274} w={116} h={30} tone="attn" active={active || highlight.has('query')} />
        <StageBlock id="query" text="Q" x={242} y={353} w={42} h={30} tone="decoder" active={highlight.has('query')} />
        <StageBlock id="key" text="K" x={299} y={353} w={42} h={30} tone="decoder" active={highlight.has('key')} />
        <StageBlock id="value" text="V" x={356} y={353} w={42} h={30} tone="decoder" active={highlight.has('value')} />
        <text className="diagram-note" x={320} y={416} textAnchor="middle">先计算权重，再用权重汇总 V</text>
      </StageSvg>
      {showHeatmap && <TeachingHeatmap />}
      <p className="stage-caption"><strong>FIG. 2 · 式 (1) · PDF P. 4</strong><span>Mask 仅在需要屏蔽位置时使用；点击模块查看解释。</span></p>
    </>
  )
}

function TeachingHeatmap() {
  const [selected, setSelected] = useState<{ row: number; column: number } | null>(null)
  const [preview, setPreview] = useState<{ row: number; column: number } | null>(null)
  const marked = preview ?? selected
  const weight = selected && weights[selected.row][selected.column].toFixed(2)

  return (
    <div className="heatmap-panel" onPointerLeave={() => setPreview(null)} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null)
    }}>
      <h3>查询 × 键 <small>教学示意 · 手设权重</small></h3>
      <div className="heat-grid" onPointerOver={event => {
        if (event.pointerType === 'touch') return
        const cell = (event.target as Element).closest<HTMLElement>('[data-matrix-index]')
        if (!cell) { setPreview(null); return }
        const index = Number(cell.dataset.matrixIndex)
        setPreview({ row: Math.floor(index / words.length), column: index % words.length })
      }} onFocus={event => {
        const index = Number((event.target as HTMLElement).dataset.matrixIndex)
        if (Number.isFinite(index)) setPreview({ row: Math.floor(index / words.length), column: index % words.length })
      }}>
        <span className="lab">Q↓/K→</span>
        {words.map((word, column) => <span key={word} className="lab" data-matrix-band={column === marked?.column ? 'column' : undefined}>{word}</span>)}
        {words.flatMap((word, row) => [
          <span key={word} className="lab" data-matrix-band={row === marked?.row ? 'row' : undefined}>{word}</span>,
          ...weights[row].map((value, column) => {
            const text = value.toFixed(2)
            const example = `教学示意 · ${word} → ${words[column]}：${text}（行和为 1）`
            return (
              <Explainable key={row + '/' + column} as="button" explanation="weights" kind="matrix-cell"
                label={`${word} → ${words[column]} · ${text}`} example={example}
                data-level={Math.min(4, Math.ceil(value * 5))}
                data-matrix-index={row * words.length + column}
                data-matrix-band={row === marked?.row && column === marked?.column ? 'both' : row === marked?.row ? 'row' : column === marked?.column ? 'column' : undefined}
                aria-pressed={row === selected?.row && column === selected?.column}
                onActivate={() => setSelected({ row, column })}>
                {text}
              </Explainable>
            )
          }),
        ])}
      </div>
      <p aria-live="polite">{selected
        ? `示意：查询「${words[selected.row]}」对键「${words[selected.column]}」分配 ${weight} 的注意力（行和为 1）。`
        : '选择一个权重，查看对应的查询行、键列与分配比例。'}</p>
      {selected && (
        <div className="heat-aggregation">
          <strong>示意加权和</strong>{' '}
          {weights[selected.row].map((value, column) => `${value.toFixed(2)} V(${words[column]})`).join(' + ')}
        </div>
      )}
    </div>
  )
}
