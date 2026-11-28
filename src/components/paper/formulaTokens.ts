const pattern = /(Kᵀ|√dₖ|softmax|(?<![a-z])[QKV](?![a-z])|pos|d_model|sin|cos|10000|2i\+1|2i|θ|PE|FFN|W[₁₂]|b[₁₂]|max|x|LayerNorm|Sublayer)/g
export const splitFormulaTerms = (formula: string) => formula.split(pattern)
