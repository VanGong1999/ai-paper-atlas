import { useState } from 'react'
import { explainables } from '../../data/papers/attention/explainables'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

const heads = Array.from({ length: 8 }, (_, i) => i + 1)
const applications = [
  { id: 'self', title: '编码器自注意力', caption: 'Q · K · V 来自源侧' },
  { id: 'mask', title: '掩码自注意力', caption: 'Q · K · V 来自目标侧' },
  { id: 'cross', title: '跨序列注意力', caption: 'Q 来自目标侧，K/V 来自源侧' },
] as const

export function MultiHeadStage({ highlight, showApplications }: StageProps & { showApplications: boolean }) {
  const [selected, setSelected] = useState<number | undefined>()
  return (
    <>
      <StageSvg label="Fig. 2 右 · 多头注意力原图重绘" height={showApplications ? 550 : 465}>
        <text className="diagram-title" x={320} y={35} textAnchor="middle">Multi-Head Attention</text>
        <text className="diagram-subtitle" x={320} y={58} textAnchor="middle">多头注意力 · {selected ? `Head ${selected}` : '8 个头并行'}</text>
        <StageFlow d="M320 102V76M320 143V131M320 188V172M320 241V224" active={!showApplications} explanation="concat" label="多头输出到拼接和线性投影" />
        {[246, 320, 394].map(x => <StageFlow key={x} d={`M${x} 383V359M${x} 310V264H320V241`} active={!showApplications} explanation="heads" label="输入投影到并行注意力头" />)}
        <StageBlock id="concat" text="Wᴼ · 512 → 512" x={245} y={102} w={150} h={29} tone="decoder" active={!showApplications} />
        <StageBlock id="concat" text="Concat · 8 × 64" x={245} y={143} w={150} h={29} tone="train" active={!showApplications} />
        <g aria-hidden="true" className="head-stack">
          <rect x={217} y={180} width={206} height={48} rx={7} />
          <rect x={210} y={187} width={206} height={48} rx={7} />
          <rect x={203} y={194} width={206} height={48} rx={7} />
        </g>
        <StageBlock id="heads" kind="attention-head" text="Scaled Dot-Product" caption="Attention" x={196} y={201} w={206} h={40} tone="attn" active={!showApplications} example={`原图以叠层表示 ${heads.length} 个并行头；${selected ? `当前选择第 ${selected} 个头。` : '每个头使用独立投影。'}`} />
        <text className="diagram-label" x={426} y={220}>h = 8</text>
        <StageBlock id="value" text="Wᵥ" caption="512 → 64" x={213} y={310} w={66} h={49} tone="decoder" content={{ ...explainables.heads, title: `Head ${selected ?? "i"} 的输入投影` }} active={!showApplications} />
        <StageBlock id="key" text="Wₖ" caption="512 → 64" x={287} y={310} w={66} h={49} tone="decoder" content={{ ...explainables.heads, title: `Head ${selected ?? "i"} 的输入投影` }} active={!showApplications} />
        <StageBlock id="query" text="Wᑫ" caption="512 → 64" x={361} y={310} w={66} h={49} tone="decoder" content={{ ...explainables.heads, title: `Head ${selected ?? "i"} 的输入投影` }} active={!showApplications} />
        <StageBlock id="value" text="V" x={225} y={383} w={42} h={29} tone="io" active={!showApplications} />
        <StageBlock id="key" text="K" x={299} y={383} w={42} h={29} tone="io" active={!showApplications} />
        <StageBlock id="query" text="Q" x={373} y={383} w={42} h={29} tone="io" active={!showApplications} />
        <text className="diagram-note" x={320} y={437} textAnchor="middle">{selected ? `Head ${selected}：使用 W${selected}ᑫ / W${selected}ᴷ / W${selected}ⱽ；输出 n_q × 64` : '基础配置：每头输出 n_q × 64，拼接后 n_q × 512'}</text>
        {showApplications && applications.map(({ id, title, caption }, index) => (
          <StageBlock key={id} id={id} kind="attention-use" text={title} caption={caption}
            x={12 + index * 208} y={484} w={200} h={53} tone={index === 0 ? 'encoder' : 'decoder'} active={highlight.has(id)} />
        ))}
      </StageSvg>
      {!showApplications && <div className="head-selector" role="group" aria-label="选择注意力头">
        <span>选择注意力头</span>{heads.map(head => <button key={head} type="button" aria-label={`第 ${head} 个注意力头`} aria-pressed={selected === head} onClick={() => setSelected(current => current === head ? undefined : head)}>{head}</button>)}
      </div>}
      <p className="stage-caption"><strong>FIG. 2 · PDF P. 4</strong><span>每个头独立投影并计算注意力，拼接后再做线性投影。</span></p>
    </>
  )
}
