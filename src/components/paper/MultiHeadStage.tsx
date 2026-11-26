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
        <StageFlow d="M151 170H193M193 65V289" active={!showApplications} arrow={false}
          explanation="heads" label="Q、K、V → 各头投影" example="教学示意 · Q、K、V → 各头投影：每个头使用自己的投影矩阵。" />
        <StageFlow d="M380 65V289M380 163H394" active={!showApplications} arrow={false}
          explanation="concat" label="各头输出 → Concat" example="教学示意 · 各头输出 → Concat：沿特征维拼接各头表示。" />
        <StageFlow d="M471 163H486" active={!showApplications}
          explanation="concat" label="Concat → Wᴼ" example="教学示意 · Concat → Wᴼ：拼接结果进入输出投影。" />
        <StageFlow d="M530 163H539" active={!showApplications}
          explanation="concat" label="Wᴼ → 表示" example="教学示意 · Wᴼ → 表示：输出投影恢复模型维度。" />
        <StageBlock id="heads" text="Q · K · V" caption="d_model = 512" x={23} y={146} w={128} h={48} tone="encoder" active={!showApplications} />

        {heads.map((head, index) => {
          const y = 52 + index * 32
          const active = !showApplications && (selected === undefined || selected === head)
          return (
            <g key={head}>
              <StageFlow d={`M193 ${y + 13}H238`} active={active} arrow={false}
                explanation="heads" label={`投影 → Head ${head}`} example={`教学示意 · 投影 → Head ${head}：用本头投影后的查询、键和值计算注意力。`} />
              <StageFlow d={`M359 ${y + 13}H380`} active={active} arrow={false}
                explanation="concat" label={`Head ${head} → Concat`} example={`教学示意 · Head ${head} → Concat：本头的输出作为拼接结果中的一段。`} />
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
