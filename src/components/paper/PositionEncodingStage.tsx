import { useState } from 'react'
import { Explainable } from './Explainable'
import { StageSvg } from './StageDrawing'

const maxPosition = 24
const modelWidth = 512 // Base model width in §3.1 and §3.5.
const samples = [0, 4, 8, 12, 16, 20, 24]
const left = 48
const right = 608
const center = 146
const amplitude = 84
const x = (pos: number) => left + (right - left) * pos / maxPosition
const y = (value: number) => center - amplitude * value
const waveTypes = ['sin', 'cos'] as const

export function PositionEncodingStage() {
  const [position, setPosition] = useState(8)
  const [pair, setPair] = useState(32)
  const divisor = 10000 ** (2 * pair / modelWidth)

  return (
    <>
      <StageSvg label="位置编码正弦和余弦曲线" height={305}>
        <rect className="stage-lane" x={left} y={y(1) - 14} width={right - left} height={2 * amplitude + 28} rx={5} />
        {[1, 0, -1].map(value => (
          <g key={value} aria-hidden="true">
            <path className="stage-gridline" d={`M${left} ${y(value)}H${right}`} />
            <text className="stage-axis-label" x={left - 10} y={y(value) + 5} textAnchor="end">{value}</text>
          </g>
        ))}
        <text className="position-legend wave-sin" x={left} y={32}>● sin · 第 {2 * pair} 维</text>
        <text className="position-legend wave-cos" x={left + 223} y={32}>◆ cos · 第 {2 * pair + 1} 维</text>
        {samples.map(pos => <text key={pos} className="stage-axis-label" x={x(pos)} y={262} textAnchor="middle">{pos}</text>)}
        <text className="stage-axis-label" x={right} y={291} textAnchor="end">位置 pos</text>
        <path className="stage-gridline position-cursor" d={`M${x(position)} 47V245`} />

        {waveTypes.map(wave => {
          const valueAt = (pos: number) => Math[wave](pos / divisor)
          const d = Array.from({ length: 193 }, (_, i) => {
            const pos = i * maxPosition / 192
            return `${i ? 'L' : 'M'}${x(pos).toFixed(2)},${y(valueAt(pos)).toFixed(2)}`
          }).join('')
          return (
            <g key={wave} className="flow-active" aria-hidden="true">
              <path className={`position-curve wave-${wave}`} data-position-curve={wave} d={d} />
              <path className={`stage-flow position-trace wave-${wave}`} d={d} />
            </g>
          )
        })}

        {waveTypes.flatMap(wave => [...new Set([...samples, position])].map(pos => {
          const dimension = 2 * pair + (wave === 'cos' ? 1 : 0)
          const phase = pos / divisor
          const result = Math[wave](phase)
          const example = `教学计算 · PE(${pos}, ${dimension}) = ${wave}(${pos} / 10000^(${2 * pair}/512)) ≈ ${result.toFixed(4)}`
          return (
            <Explainable key={`${wave}-${pos}`} as="g" explanation="position" kind="curve-point"
              className={`position-point wave-${wave}`} label={`${wave} · pos ${pos} · 第 ${dimension} 维`}
              example={example} aria-pressed={pos === position} onActivate={() => setPosition(pos)}
              transform={`translate(${x(pos)} ${y(result)})`}>
              <circle className="point-hit" r={12} />
              {wave === 'sin' ? <circle className="point-mark" r={pos === position ? 7 : 5} />
                : <path className="point-mark" d={pos === position ? 'M0 -8L8 0L0 8L-8 0Z' : 'M0 -6L6 0L0 6L-6 0Z'} />}
            </Explainable>
          )
        }))}
      </StageSvg>
      <div className="workbench-stage-controls position-controls">
        <label><span>位置 pos <output>{position}</output></span>
          <input type="range" aria-label="位置 pos" min={0} max={maxPosition} value={position}
            onChange={event => setPosition(event.currentTarget.valueAsNumber)} />
        </label>
        <label><span>维度对 i <output>{pair}</output></span>
          <input type="range" aria-label="维度对 i" min={0} max={modelWidth / 2 - 1} value={pair}
            onChange={event => setPair(event.currentTarget.valueAsNumber)} />
        </label>
      </div>
      <p className="stage-caption"><strong>§3.5 · PDF p. 6</strong><span>教学示意 · 代入论文公式，位置范围取 0–24，基础模型 d_model = 512。</span></p>
    </>
  )
}
