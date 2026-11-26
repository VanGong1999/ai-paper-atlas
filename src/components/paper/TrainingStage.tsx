import { useState } from 'react'
import { explainables } from '../../data/papers/attention/explainables'
import { SourceBadge } from './SourceBadge'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

// §5.2–5.3, p. 7. The two run lengths are independent training runs.
const warmup = 4000
const milestones = [
  { step: warmup, label: '预热结束', caption: '4000 步', id: 'optimizer' },
  { step: 100000, label: '基础模型 · 12 小时', caption: '100000 步 · 约 0.4 秒/步', id: 'hardware' },
  { step: 300000, label: '大模型 · 3.5 天', caption: '300000 步 · 1.0 秒/步', id: 'hardware' },
] as const
const lastStep = milestones[2].step
// Table 3, p. 9 supplies the model widths used in the numerical substitutions.
const baseWidth = 512
const bigWidth = 1024

// Plot the model-width-independent factor in equation (3).
const factor = (step: number) => Math.min(step * warmup ** -1.5, step ** -0.5)
const x = (step: number) => 44 + 546 * Math.log(step) / Math.log(lastStep)
const y = (step: number) => 168 - 110 * factor(step) / factor(warmup)
const samples = Array.from({ length: 161 }, (_, i) => lastStep ** (i / 160))
const schedule = [...samples, warmup].sort((a, b) => a - b)
  .map((step, i) => `${i ? 'L' : 'M'}${x(step).toFixed(2)} ${y(step).toFixed(2)}`).join('')

export function TrainingStage({ highlight, onClearSelection }: StageProps & { onClearSelection: () => void }) {
  const [step, setStep] = useState(warmup)
  return (
    <>
      <StageSvg label="式 (3) · 训练步数与学习率" height={370}>
        <text className="stage-annotation" x={24} y={28}>教学计算 · 学习率因子 lr × √d_model</text>
        <path className="stage-gridline" d="M44 48V168H590" />
        <StageFlow d={schedule} active arrow={false} />
        <path className="stage-gridline position-cursor" d={`M${x(step)} 48V168`} />
        <circle cx={x(step)} cy={y(step)} r={5} fill="var(--accent-ink)" />
        {[1, ...milestones.map(node => node.step)].map(tick => (
          <g key={tick}>
            <path className="stage-gridline" d={`M${x(tick)} 168v5`} />
            <text className="stage-axis-label" x={x(tick)} y={193} textAnchor="middle">{tick >= 100000 ? tick / 1000 + 'k' : tick}</text>
          </g>
        ))}
        <text className="stage-annotation" x={24} y={220}>训练步数（对数刻度） · 单机 8 × P100</text>
        {milestones.map(({ id, label, caption, step: at }, i) => (
          <StageBlock key={at} id={id} kind="training-milestone" text={label} caption={caption}
            x={22 + 201 * i} y={232} w={192} h={50} tone="train" selected={step === at} active={highlight.has(id)}
            example={`${label} · ${caption}`} onActivate={() => setStep(at)} />
        ))}
        <StageBlock id="batch" text="每批源 / 目标词元" caption="两侧各约 25000" x={22} y={302} w={192} h={50} tone="train" active={highlight.has('batch')} />
        <StageBlock id="dropout" text="Dropout · 0.1" x={223} y={302} w={192} h={50} tone="train" active={highlight.has('dropout')} />
        <StageBlock id="smoothing" text="标签平滑 · 0.1" x={424} y={302} w={192} h={50} tone="train" active={highlight.has('smoothing')} />
      </StageSvg>
      <div className="workbench-stage-controls position-controls">
        <label><span>训练步数 <output>step = {step} · lr × √d_model ≈ {factor(step).toFixed(6)}</output></span>
          <input type="range" min={1} max={lastStep} value={step} aria-label="训练步数" onChange={event => {
            setStep(event.currentTarget.valueAsNumber)
            onClearSelection()
          }} />
        </label>
      </div>
      <div className="stage-caption training-rates">
        <strong>教学计算 · 学习率</strong>
        {step <= milestones[1].step && <span>基础模型（d_model = {baseWidth}）≈ {(factor(step) / Math.sqrt(baseWidth)).toExponential(3)}</span>}
        <span>大模型（d_model = {bigWidth}）≈ {(factor(step) / Math.sqrt(bigWidth)).toExponential(3)}</span>
        <SourceBadge source={explainables.params.source} reference="Table 3" />
      </div>
      <div className="stage-caption">
        <SourceBadge source={explainables.hardware.source} />
        <SourceBadge source={explainables.optimizer.source} reference="式 (3)" />
        <span>基础模型与大模型分别训练。曲线显示预热时的线性增长与之后按步数平方根倒数的衰减。</span>
      </div>
    </>
  )
}
