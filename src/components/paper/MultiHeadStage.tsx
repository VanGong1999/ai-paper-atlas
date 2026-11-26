import { useState } from 'react'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

const heads = Array.from({ length: 8 }, (_, i) => i + 1)
const applications = [
  { id: 'self', title: '编码器自注意力', caption: 'Q · K · V 来自源侧' },
  { id: 'mask', title: '掩码自注意力', caption: 'Q · K · V 来自目标侧' },
  { id: 'cross', title: '跨序列注意力', caption: 'Q 来自目标侧，K/V 来自源侧' },
] as const

export function MultiHeadStage({ highlight, showApplications }: StageProps & { showApplications: boolean }) {
  const [selected, setSelected] = useState<number>()
  return (
    <>
      <StageSvg label="Fig. 2 · 多头投影、并行注意力与拼接" height={showApplications ? 408 : 324}>
        <text className="stage-annotation" x={23} y={31}>输入</text>
        <text className="stage-annotation" x={239} y={31}>8 个头并行</text>
        <text className="stage-annotation" x={408} y={31}>拼接</text>
        <text className="stage-annotation" x={540} y={31}>输出</text>
        <rect className="stage-lane" x={224} y={42} width={149} height={274} rx={9} />
        <StageFlow d="M151 170H193" active={!showApplications} arrow={false} />
        <StageFlow d="M471 163H486M530 163H539" active={!showApplications} />
        <StageBlock id="heads" text="Q · K · V" caption="d_model = 512" x={23} y={146} w={128} h={48} tone="encoder" active={!showApplications} />

        {heads.map((head, index) => {
          const y = 52 + index * 32
          const active = !showApplications && (selected === undefined || selected === head)
          return (
            <g key={head}>
              <StageFlow d={`M193 170V${y + 13}H238M359 ${y + 13}H380V163H394`} active={active} arrow={false} />
              <StageBlock id="heads" kind="attention-head" text={`Head ${head}`} x={238} y={y} w={121} h={26}
                tone={index % 2 ? 'decoder' : 'attn'} active={active} selected={selected === head}
                example={`教学示意 · 第 ${head} 个头沿独立投影计算一行权重。`} onActivate={() => setSelected(current => current === head ? undefined : head)} />
            </g>
          )
        })}

        <StageBlock id="concat" text="Concat" x={394} y={145} w={77} h={36} tone="attn" active={highlight.has('concat')} />
        <StageBlock id="concat" kind="formula-variable" text="Wᴼ" x={487} y={145} w={43} h={36} tone="decoder" active={highlight.has('concat')} />
        <StageBlock id="concat" text="表示" caption="512 维" x={540} y={139} w={76} h={48} tone="encoder" active={highlight.has('concat')} />
        <text className="stage-annotation" x={24} y={212}>各头 dₖ = dᵥ = 64</text>
        {showApplications && applications.map(({ id, title, caption }, index) => (
          <StageBlock key={id} id={id} kind="attention-use" text={title} caption={caption}
            x={20 + index * 202} y={336} w={196} h={55} tone={index === 0 ? 'encoder' : 'decoder'} active={highlight.has(id)} />
        ))}
      </StageSvg>
      <p className="stage-caption"><strong>§3.2.2–3.2.3 · PDF p. 5</strong><span>头的编号用于追踪投影与拼接。选择某个头可突出它的路径。</span></p>
    </>
  )
}
