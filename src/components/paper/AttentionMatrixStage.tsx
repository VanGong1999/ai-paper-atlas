import { useState } from 'react'
import type { ExplainableId } from '../../data/papers/attention/explainables'
import { Explainable } from './Explainable'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

const words = ['The', 'animal', 'ate', 'food']
const weights = [
  [0.65, 0.15, 0.10, 0.10],
  [0.10, 0.55, 0.20, 0.15],
  [0.05, 0.25, 0.40, 0.30],
  [0.05, 0.15, 0.25, 0.55],
]

const variables: { id: ExplainableId; text: string; x: number; w: number; label?: string }[] = [
  { id: 'softmax', text: 'softmax', x: 109, w: 115 },
  { id: 'query', text: 'Q', x: 258, w: 42 },
  { id: 'key', text: 'Kᵀ', x: 303, w: 43, label: 'Kᵀ · 键矩阵转置' },
  { id: 'scale', text: '√dₖ', x: 380, w: 64, label: '√dₖ · 缩放因子' },
  { id: 'value', text: 'V', x: 477, w: 43 },
]

export function AttentionMatrixStage({ highlight, showHeatmap }: StageProps & { showHeatmap: boolean }) {
  return (
    <>
      <StageSvg label="Fig. 2 · 缩放点积注意力流水线" height={258}>
        <text className="stage-annotation" x={24} y={27}>输入</text>
        <text className="stage-annotation" x={160} y={27}>相似度</text>
        <text className="stage-annotation" x={333} y={27}>沿键归一化</text>
        <text className="stage-annotation" x={499} y={27}>汇总对应的值</text>
        <StageFlow d="M126 65H140V80H158M126 119H140V94H158" active={highlight.has('query') || highlight.has('scale')} />
        <StageFlow d="M306 87H330" active={highlight.has('scale') || highlight.has('weights')} />
        <StageFlow d="M469 87H497M126 173H565V115" active={highlight.has('value') || highlight.has('weights')} branch />
        <StageBlock id="query" kind="qkv" text="Q · 查询" x={24} y={47} w={102} tone="encoder" active={highlight.has('query')} />
        <StageBlock id="key" kind="qkv" text="K · 键" x={24} y={101} w={102} tone="encoder" active={highlight.has('key')} />
        <StageBlock id="value" kind="qkv" text="V · 值" x={24} y={155} w={102} tone="decoder" active={highlight.has('value')} />
        <StageBlock id="scale" text="QKᵀ / √dₖ" caption="缩放分数" x={158} y={63} w={148} h={50} tone="attn" active={highlight.has('scale')} />
        <StageBlock id="softmax" text="Softmax" caption="权重 · 每行和为 1" x={330} y={63} w={139} h={50} tone="attn" active={highlight.has('softmax')} />
        <StageBlock id="value" text="加权求和" caption="输出表示" x={497} y={63} w={119} h={50} tone="decoder" active={highlight.has('weights')} />
        <rect className="stage-lane" x={24} y={202} width={592} height={44} rx={7} />
        <text className="stage-annotation" x={39} y={230}>式 (1)</text>
        {variables.map(({ id, text, x, w, label }) => (
          <Explainable key={text} as="g" explanation={id} kind="formula-variable" label={label ?? text}
            className="stage-node formula-token" >
            <rect x={x} y={209} width={w} height={30} rx={4} />
            <text x={x + w / 2} y={224}>{text}</text>
          </Explainable>
        ))}
        <text className="stage-operator" x={241} y={225}>(</text>
        <text className="stage-operator" x={363} y={225}>/</text>
        <text className="stage-operator" x={460} y={225}>)</text>
      </StageSvg>
      {showHeatmap && <TeachingHeatmap />}
      <p className="stage-caption"><strong>Fig. 2 · 式 (1) · PDF p. 4</strong><span>查询和键决定权重，值提供被汇总的内容。</span></p>
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
