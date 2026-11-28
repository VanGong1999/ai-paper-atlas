/** Teaching calculations, not measured experiment data. All logs are natural logs. */
export function softmax(logits: number[], temperature = 1): number[] {
  if (!Number.isFinite(temperature) || temperature <= 0 || !logits.length || logits.some(x => !Number.isFinite(x))) throw new Error('finite logits and positive temperature required')
  const max = Math.max(...logits)
  const exp = logits.map(x => Math.exp((x - max) / temperature))
  const sum = exp.reduce((a, b) => a + b, 0)
  return exp.map(x => x / sum)
}
export const center = (xs: number[]) => xs.map(x => x - xs.reduce((a, b) => a + b, 0) / xs.length)
export function distillationExample(student: number[], teacher: number[], temperature: number, label: number) {
  if (student.length !== teacher.length || !Number.isInteger(label) || label < 0 || label >= student.length) throw new Error('matching class dimensions and valid label required')
  const logSoftmax = (xs: number[], t: number) => {
    const max = Math.max(...xs)
    const logSum = Math.log(xs.reduce((s, x) => s + Math.exp((x - max) / t), 0))
    return xs.map(x => (x - max) / t - logSum)
  }
  const p = softmax(teacher, temperature), q = softmax(student, temperature)
  const logP = logSoftmax(teacher, temperature), logQ = logSoftmax(student, temperature)
  const entropy = -p.reduce((s, x, i) => s + x * logP[i], 0)
  const softCE = -p.reduce((s, x, i) => s + x * logQ[i], 0)
  const kl = p.reduce((s, x, i) => s + x * (logP[i] - logQ[i]), 0)
  const hardCE = -logSoftmax(student, 1)[label]
  const rawGradient = q.map((x, i) => (x - p[i]) / temperature)
  const scaledGradient = rawGradient.map(x => x * temperature ** 2)
  const hardGradient = softmax(student).map((x, i) => x - Number(i === label))
  return { p, q, entropy, softCE, kl, hardCE, rawGradient, scaledGradient, hardGradient }
}
export const l2 = (xs: number[]) => Math.hypot(...xs)
