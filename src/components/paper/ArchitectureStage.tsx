import type { ExplainableId } from '../../data/papers/attention/explainables'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

const encoder: [ExplainableId, string, number, string][] = [
  ['self', '编码器自注意力', 287, 'attn'],
  ['residual', 'Add & Norm', 244, 'encoder'],
  ['ffn', '逐位置 FFN', 201, 'encoder'],
  ['residual', 'Add & Norm', 158, 'encoder'],
]
const decoder: [ExplainableId, string, number, string][] = [
  ['mask', '掩码自注意力', 287, 'decoder'],
  ['residual', 'Add & Norm', 244, 'decoder'],
  ['cross', '跨序列注意力', 201, 'attn'],
  ['residual', 'Add & Norm', 158, 'decoder'],
  ['ffn', '逐位置 FFN', 115, 'decoder'],
  ['residual', 'Add & Norm', 72, 'decoder'],
]

export function ArchitectureStage({ highlight }: StageProps) {
  const encoderActive = highlight.has('encoder')
  const decoderActive = highlight.has('decoder')
  return (
    <>
      <StageSvg label="Fig. 1 · Transformer 编码器和解码器的教学重绘" height={456}>
        <rect className="stage-lane lane-encoder" x={20} y={141} width={203} height={195} rx={9} />
        <rect className="stage-lane lane-decoder" x={240} y={55} width={203} height={281} rx={9} />
        <text className="stage-annotation" x={28} y={52}>源序列 ↑</text>
        <text className="stage-annotation" x={548} y={70} textAnchor="middle">下一词元概率</text>

        <StageFlow d="M120 414V405M120 366V356M120 330V322M120 287V279M120 244V236M120 201V193M120 158V119"
          active={encoderActive} />
        <StageFlow d="M339 414V405M339 366V356M339 330V322M339 287V279M339 244V236M339 201V193M339 158V150M339 115V107M339 72V58"
          active={decoderActive} />
        <StageFlow d="M207 97H230V218H253" active={highlight.has('cross')} branch />
        <StageFlow d="M424 44H453V164H478M548 148V122" active={highlight.has('linear') || highlight.has('softmax')} />
        {[287, 201].map(y => (
          <StageFlow key={y} d={`M120 ${y + 39}H35V${y - 26}H37`} active={encoderActive} branch />
        ))}
        {[287, 201, 115].map(y => (
          <StageFlow key={y} d={`M339 ${y + 39}H254V${y - 26}H256`} active={decoderActive} branch />
        ))}

        <StageBlock id="embedding" kind="architecture-node" text="输入嵌入" x={37} y={367} w={166} h={38} active={encoderActive} />
        <StageBlock id="position" kind="architecture-node" text="+ 位置编码" x={37} y={329} w={166} h={29} active={encoderActive} />
        {encoder.map(([id, text, y, tone]) => (
          <StageBlock key={y} id={id} kind="architecture-node" text={text} x={37} y={y} w={166} tone={tone} active={encoderActive} />
        ))}
        <StageBlock id="encoder" kind="architecture-node" text="编码器输出" caption="N = 6 · d_model = 512"
          x={37} y={76} w={170} h={42} tone="encoder" active={encoderActive} />

        <StageBlock id="embedding" kind="architecture-node" text="输出嵌入" x={256} y={367} w={166} h={38} active={decoderActive} />
        <StageBlock id="position" kind="architecture-node" text="+ 位置编码" x={256} y={329} w={166} h={29} active={decoderActive} />
        {decoder.map(([id, text, y, tone]) => (
          <StageBlock key={y} id={id} kind="architecture-node" text={text} x={256} y={y} w={166} tone={tone} active={decoderActive} />
        ))}
        <StageBlock id="decoder" kind="architecture-node" text="解码器输出" caption="N = 6 · d_model = 512"
          x={256} y={10} w={168} h={46} tone="decoder" active={decoderActive} />
        <text className="stage-annotation" x={120} y={433} textAnchor="middle">源词元 ↑</text>
        <text className="stage-annotation" x={339} y={433} textAnchor="middle">右移的目标词元 ↑</text>
        <StageBlock id="linear" kind="architecture-node" text="词表线性投影" x={478} y={148} w={142} active={highlight.has('linear')} />
        <StageBlock id="softmax" kind="architecture-node" text="Softmax" x={478} y={88} w={142} active={highlight.has('softmax')} />
        <text className="stage-annotation" x={549} y={204} textAnchor="middle">词表分数 → 概率</text>
      </StageSvg>
      <p className="stage-caption"><strong>Fig. 1 · PDF p. 3</strong><span>实线表示主数据流，虚线表示残差或跨序列连接。</span></p>
    </>
  )
}
