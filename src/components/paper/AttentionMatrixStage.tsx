import { useState } from 'react'
import { attentionSoftmaxExplainable, normalizeAttentionScores } from './attentionSoftmaxExplainable'
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


// Toy scores make the effects of dimension scaling and masking inspectable.
// No trained attention tensors are loaded by this demonstration.
const toyScores = [0.2, 1.0, -0.4, 0.6]
export function AttentionMathStage({ causal, onClearSelection }: { causal: boolean; onClearSelection: () => void }) {
  const [dimension, setDimension] = useState(64)
  const [queryRow, setQueryRow] = useState(1)
  const raw = toyScores.map(value => value * Math.sqrt(dimension))
  const unscaled = normalizeAttentionScores(raw)
  const scaled = normalizeAttentionScores(toyScores)
  const masked = normalizeAttentionScores(toyScores, queryRow)
  const display = causal ? masked : scaled
  return <>
    <StageSvg label={causal ? '因果掩码逐行归一化教学实验' : '维度缩放前后注意力权重教学实验'} height={365}>
      <text className="diagram-title" x={320} y={30} textAnchor="middle">{causal ? '先屏蔽未来，再逐行 Softmax' : '同一组基础分数，比较缩放前后'}</text>
      <text className="diagram-subtitle" x={320} y={55} textAnchor="middle">教学计算 · 4 个键 · {causal ? `当前查询位置 i = ${queryRow + 1}` : `dₖ = ${dimension}`}</text>
      <text className="diagram-label" x={24} y={94}>键位置</text>
      {toyScores.map((_, column) => <text className="diagram-label" key={column} x={225 + column * 104} y={94} textAnchor="middle">K{column + 1}</text>)}
      {[0, 1].map(row => <g key={row}>
        <text className="diagram-note" x={24} y={148 + row * 74}>{causal ? row === 0 ? '缩放分数 + mask' : '归一化权重' : row === 0 ? '未缩放 Softmax' : '÷ √dₖ 后 Softmax'}</text>
        {toyScores.map((score, column) => {
          const blocked = causal && column > queryRow
          const value = causal ? row === 0 ? score : masked[column] : row === 0 ? unscaled[column] : scaled[column]
          const text = causal && row === 0 && blocked ? '−∞' : value.toFixed(3)
          return <StageBlock key={column} id={causal ? 'causal' : 'variance'} text={text}
            x={181 + column * 104} y={116 + row * 74} w={88} h={48}
            tone={blocked ? 'io' : 'attn'} active={!blocked && row === 1}
            example={causal ? `查询 ${queryRow + 1} → 键 ${column + 1}：${blocked ? '未来键，分数设为 −∞，权重严格为 0。' : `合法连接，缩放分数 ${score}，权重 ${masked[column].toFixed(4)}。`}`
              : `键 ${column + 1}：原始分数 ${raw[column].toFixed(3)}，除以 √${dimension} 后为 ${score}；${row === 0 ? '未缩放' : '缩放后'}权重 ${value.toFixed(4)}。`} />
        })}
      </g>)}
      <text className="diagram-note" x={320} y={282} textAnchor="middle">{causal ? '每行只在合法键之间重新归一化；不是归一化后再删列' : '缩放后恢复基础分数；未缩放分数随 √dₖ 放大'}</text>
      <text className="diagram-note" x={320} y={310} textAnchor="middle">输出 = {display.map((weight, i) => `${weight.toFixed(3)} V${i + 1}`).join(' + ')}</text>
      <text className="diagram-note" x={320} y={340} textAnchor="middle">输入 1×4 分数 → 权重 1×4 → 与 V(4×dᵥ) 相乘得 1×dᵥ</text>
    </StageSvg>
    <div className="workbench-stage-controls position-controls">
      {causal ? <label><span>选择查询位置 <output>i = {queryRow + 1}</output></span>
        <input type="range" aria-label="因果掩码查询位置" min={0} max={3} value={queryRow} onChange={event => { setQueryRow(event.currentTarget.valueAsNumber); onClearSelection() }} />
      </label> : <label><span>键 / 查询维度 <output>dₖ = {dimension}</output></span>
        <input type="range" aria-label="缩放实验维度" min={1} max={256} value={dimension} onChange={event => { setDimension(event.currentTarget.valueAsNumber); onClearSelection() }} />
      </label>}
    </div>
    <p className="stage-caption"><strong>{causal ? '§3.2.3 · PDF P. 5' : '§3.2.1 · 脚注 4 · PDF P. 4'}</strong><span>{causal ? '目标输入右移后，当前输入位置也可见；预测只依赖已知输出。' : '固定教学分数 [0.2, 1, −0.4, 0.6]；非模型实测，方差推导依赖独立、零均值、单位方差假设。'}</span></p>
  </>
}
