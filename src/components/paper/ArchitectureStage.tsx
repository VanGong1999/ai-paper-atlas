import { Explainable } from './Explainable'
import { StageBlock, StageFlow, StageSvg, type StageProps } from './StageDrawing'

export function ArchitectureStage({ highlight }: StageProps) {
  const enc = highlight.has('encoder')
  const dec = highlight.has('decoder')
  const out = highlight.has('linear') || highlight.has('softmax')
  const cross = highlight.has('cross')
  return (
    <>
      <StageSvg label="Fig. 1 · Transformer 编码器与解码器架构重绘" height={570}>
        <rect className="stage-lane lane-encoder" x={101} y={254} width={169} height={218} rx={14} />
        <rect className="stage-lane lane-decoder" x={353} y={142} width={169} height={330} rx={14} />
        <text className="diagram-label" x={84} y={364} textAnchor="end">N×</text>
        <text className="diagram-label" x={539} y={308}>N×</text>
        <text className="diagram-label" x={437} y={22} textAnchor="middle">输出概率</text>
        <StageFlow d="M185 545V527M185 493V487M185 471V435M185 397V385M185 363V350M185 314V301M185 278V246" active={enc} explanation="encoder" label="编码器主数据流" />
        <StageFlow d="M437 545V527M437 493V487M437 471V435M437 397V363M437 340V314M437 279V265M437 242V229M437 195V181M437 158V92M437 68V55M437 33V25" active={dec || out} explanation="decoder" label="解码器与输出主数据流" />
        <StageFlow d="M185 445H120V374H125M185 340H120V290H125" active={enc} branch explanation="residual" label="编码器残差旁路" />
        <StageFlow d="M437 445H372V374H377M437 340H372V290H377M437 239H372V205H377" active={dec} branch explanation="residual" label="解码器残差旁路" />
        <StageFlow d="M185 246V239H321V332H377" active={cross || dec} explanation="cross" label="编码器输出至解码器跨注意力" />
        <StageBlock id="softmax" text="Softmax" x={380} y={33} w={114} h={22} tone="encoder" active={out} />
        <StageBlock id="linear" text="Linear" x={380} y={68} w={114} h={24} tone="decoder" active={out} />
        <StageBlock id="residual" text="Add & Norm" x={377} y={158} w={120} h={23} tone="encoder" active={dec} />
        <StageBlock id="ffn" text="Feed Forward" x={377} y={195} w={120} h={34} tone="decoder" active={dec} />
        <StageBlock id="residual" text="Add & Norm" x={377} y={242} w={120} h={23} tone="encoder" active={dec} />
        <StageBlock id="cross" text="Multi-Head" caption="Attention" x={377} y={279} w={120} h={35} tone="train" active={dec || cross} />
        <StageBlock id="residual" text="Add & Norm" x={377} y={340} w={120} h={23} tone="encoder" active={dec} />
        <StageBlock id="mask" text="Masked Multi-Head" caption="Attention" x={377} y={397} w={120} h={38} tone="train" active={dec} />
        <StageBlock id="residual" text="Add & Norm" x={125} y={278} w={120} h={23} tone="encoder" active={enc} />
        <StageBlock id="ffn" text="Feed Forward" x={125} y={314} w={120} h={36} tone="decoder" active={enc} />
        <StageBlock id="residual" text="Add & Norm" x={125} y={363} w={120} h={22} tone="encoder" active={enc} />
        <StageBlock id="self" text="Multi-Head" caption="Attention" x={125} y={397} w={120} h={38} tone="train" active={enc} />
        <StageBlock id="embedding" text="Input Embedding" x={125} y={493} w={120} h={34} tone="attn" active={enc} />
        <StageBlock id="embedding" text="Output Embedding" x={377} y={493} w={120} h={34} tone="attn" active={dec} />
        {[185, 437].map((x, i) => <Explainable key={x} as="g" explanation="position" kind="position-encoding" label={i ? '输出位置编码' : '输入位置编码'} className="position-symbol">
          <circle cx={x} cy={479} r={8} /><text x={x} y={479}>+</text>
          <path d={`M${x - 8} 479h-15`} /><circle cx={x - 37} cy={479} r={14} /><path d={`M${x - 49} 479q6 -10 12 0t12 0`} />
        </Explainable>)}
        <text className="diagram-note" x={111} y={478} textAnchor="end">位置编码</text>
        <text className="diagram-note" x={528} y={478}>位置编码</text>
        <text className="diagram-label" x={185} y={563} textAnchor="middle">输入</text>
        <text className="diagram-label" x={437} y={563} textAnchor="middle">输出（右移）</text>
      </StageSvg>
      <p className="stage-caption"><strong>FIG. 1 · PDF P. 3</strong><span>编码器与解码器各重复 N = 6 层。点击模块查看解释。</span></p>
    </>
  )
}
