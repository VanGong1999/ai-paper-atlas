import { useState } from 'react'
import { Explainable } from './Explainable'
import { StageFlow, StageSvg, type StageProps } from './StageDrawing'

// PDF Table 1, p. 6. The formulas are displayed as orders of growth.
const rows = [
  { label: '自注意力', values: ['O(n²d)', 'O(1)', 'O(1)'], tone: 'encoder' },
  { label: '循环层', values: ['O(nd²)', 'O(n)', 'O(n)'], tone: 'decoder' },
  { label: '卷积层', values: ['O(knd²)', 'O(1)', 'O(logₖ n)'], tone: 'attn' },
  { label: '局部自注意力', values: ['O(rnd)', 'O(1)', 'O(n/r)'], tone: 'io' },
]
const metrics = ['每层复杂度', '顺序操作数', '最大路径长度']
const units = [
  'n 为序列长度，d 为表示维度，k 为卷积核宽度，r 为局部注意力邻域大小。',
  '顺序操作数衡量同一样本内必须依次执行的轮次。',
  '最长路径比较任意输入与输出位置之间的信息传递。',
]
// Teaching inputs for evaluating the growth expressions, in row order.
const n = 16
const d = 32
const k = 2
const teachingValues = [
  [n ** 2 * d, 1, 1],
  [n * d ** 2, n, n],
  [k * n * d ** 2, 1, Math.log(n) / Math.log(k)],
]
const diagrams = [
  { label: '自注意力', positions: [[28, 73], [66, 73], [104, 73], [142, 73]], path: 'M28 65Q85 0 142 65', tone: 'encoder' },
  { label: '循环层', positions: [[28, 73], [66, 73], [104, 73], [142, 73]], path: 'M36 73H57M74 73H95M112 73H133', tone: 'decoder' },
  { label: '卷积层', positions: [[28, 77], [66, 77], [104, 77], [142, 77], [51, 53], [119, 53], [85, 33]],
    path: 'M34 71L44 61M137 71L126 61M58 47L77 36M112 47L93 36', tone: 'attn' },
]

export function ComplexityStage({ highlight }: StageProps) {
  const [metric, setMetric] = useState<number>()
  const active = metric ?? (highlight.has('recurrence') ? 1 : highlight.has('background') ? 2 : 0)
  const max = Math.max(...teachingValues.map(values => values[active]))

  return (
    <>
      <div className="workbench-stage-controls complexity-controls" role="group" aria-label="表 1 比较维度">
        {metrics.map((label, index) => (
          <button type="button" key={label} aria-pressed={active === index} onClick={() => setMetric(index)}>{label}</button>
        ))}
      </div>
      <StageSvg label="表 1 · 层复杂度、顺序操作数与最大路径" height={376}>
        <text className="stage-annotation" x={22} y={25}>教学示意 · n = {n} · d = {d} · k = {k}</text>
        {diagrams.map(({ label, positions, path, tone }, index) => {
          const formula = rows[index].values[active]
          const value = teachingValues[index][active]
          return (
            <Explainable key={label} as="g" kind="complexity-illustration" explanation="complexity"
              className="comparison-illustration" label={`${label} · ${metrics[active]} · ${formula}`}
              example={`教学示意 · ${label}的${metrics[active]}为 ${formula}；增长式代入值得 ${value}。`}
              transform={`translate(${22 + index * 203} 38)`}>
              <rect className={`comparison-diagram group-${tone}`} width={188} height={124} rx={6} />
              <StageFlow d={path} active={active !== 1 || index === 1} />
              {positions.map(([x, y]) => <circle key={x + '/' + y} className="comparison-position" cx={x} cy={y} r={6} />)}
              <text className="stage-axis-label" x={94} y={99} textAnchor="middle">{label} · {formula}</text>
              <rect className="comparison-bar-track" x={13} y={107} width={162} height={7} rx={3.5} />
              <rect className="comparison-bar" x={13} y={107} width={162 * value / max} height={7} rx={3.5} />
            </Explainable>
          )
        })}
        <rect className="stage-lane" x={22} y={189} width={596} height={172} rx={6} />
        <rect className="comparison-column" x={190 + active * 142} y={190} width={142} height={170} />
        {metrics.map((label, index) => (
          <text className="stage-axis-label" key={label} x={261 + 142 * index} y={212} textAnchor="middle">{label}</text>
        ))}
        {rows.map(({ label, values, tone }, row) => (
          <g key={label} transform={`translate(0 ${224 + row * 34})`}>
            <path className="stage-gridline" d="M22 0H618" />
            <circle className={`group-${tone}`} cx={42} cy={16} r={5} />
            <text className="stage-axis-label" x={56} y={22}>{label}</text>
            {values.map((value, column) => (
              <Explainable key={column} as="g" kind="table-cell" explanation="complexity" className="stage-node comparison-cell"
                label={`${label} · ${metrics[column]} · ${value}`}
                example={`表 1 · ${label}的${metrics[column]}为 ${value}。`}
                onActivate={() => setMetric(column)}>
                <rect x={194 + column * 142} y={3} width={134} height={28} rx={3} />
                <text x={261 + column * 142} y={17}>{value}</text>
              </Explainable>
            ))}
          </g>
        ))}
      </StageSvg>
      <p className="stage-caption"><strong>Table 1 · PDF p. 6</strong><span>{units[active]} 上方条长与增长式的示意代入值成正比。</span></p>
    </>
  )
}
