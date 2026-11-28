import type { ExplainableId } from '../../data/papers/attention/explainables'
import type { LessonStep } from '../../data/papers/attention/lessons'
import { Explainable } from './Explainable'
import { attentionSoftmaxExplainable } from './attentionSoftmaxExplainable'
import { splitFormulaTerms } from './formulaTokens'

const tokens: Record<string, ExplainableId> = {
  Q: 'query', K: 'key', 'Kᵀ': 'key', V: 'value', '√dₖ': 'scale', softmax: 'softmax',
  pos: 'position', 'd_model': 'position', sin: 'position', cos: 'position', '10000': 'position',
  '2i+1': 'position', '2i': 'position', 'θ': 'position', PE: 'position',
  FFN: 'ffn', 'W₁': 'ffn', 'W₂': 'ffn', 'b₁': 'ffn', 'b₂': 'ffn', 'max': 'ffn', x: 'ffn',
  LayerNorm: 'residual', Sublayer: 'residual',
}

export function PaperFormula({ step }: { step: LessonStep }) {
  if (!step.formula) return null
  return (
    <div className="formula-box">
      {splitFormulaTerms(step.formula).map((part, index) => {
        const explanation = tokens[part]
        return index % 2 && explanation
          ? <Explainable key={index} as="button" explanation={part === 'x' && step.id === 'res' ? 'residual' : explanation}
              kind="formula-variable" label={part}
              content={part === 'softmax' && step.stage === 'attention' ? attentionSoftmaxExplainable : undefined}
              identity={part === 'softmax' && step.stage === 'attention' ? 'attention-softmax' : undefined}>{part}</Explainable>
          : part
      })}
    </div>
  )
}
