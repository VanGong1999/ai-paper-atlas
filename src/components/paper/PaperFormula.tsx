import type { ExplainableId } from '../../data/papers/attention/explainables'
import type { LessonStep } from '../../data/papers/attention/lessons'
import { Explainable } from './Explainable'

const tokens: Record<string, ExplainableId> = {
  Q: 'query', K: 'key', 'Kᵀ': 'key', V: 'value', '√dₖ': 'scale', softmax: 'weights',
  pos: 'position', 'd_model': 'position', sin: 'position', cos: 'position', '10000': 'position',
  '2i+1': 'position', '2i': 'position', 'θ': 'position', PE: 'position',
  FFN: 'ffn', 'W₁': 'ffn', 'W₂': 'ffn', 'b₁': 'ffn', 'b₂': 'ffn', 'max': 'ffn', x: 'ffn',
  LayerNorm: 'residual', Sublayer: 'residual',
}

const pattern = /(Kᵀ|√dₖ|softmax|[QKV]|pos|d_model|sin|cos|10000|2i\+1|2i|θ|PE|FFN|W[₁₂]|b[₁₂]|max|x|LayerNorm|Sublayer)/g

export function PaperFormula({ step }: { step: LessonStep }) {
  if (!step.formula) return null
  return (
    <div className="formula-box">
      {step.formula.split(pattern).map((part, index) => {
        const explanation = tokens[part]
        return index % 2 && explanation
          ? <Explainable key={index} as="button" explanation={part === 'x' && step.id === 'res' ? 'residual' : explanation}
              kind="formula-variable" label={part}>{part}</Explainable>
          : part
      })}
    </div>
  )
}
