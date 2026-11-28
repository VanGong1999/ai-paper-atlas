export function combinations(n: number, k: number): string {
  if (k < 0 || k > n) return "0";
  let result = 1n;
  for (let i = 1; i <= Math.min(k, n - k); i++)
    result = (result * BigInt(n - i + 1)) / BigInt(i);
  return result.toString();
}
function weight(seed: number, i: number, j: number) {
  return Math.sin(seed * 1.7 + i * 2.13 + j * 0.87) * 0.6;
}
const stableSoftmax = (x: number[]) => {
  const m = Math.max(...x),
    e = x.map((v) => Math.exp(v - m)),
    sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
};
export function moeForward(
  input: number[],
  routed: number,
  k: number,
  shared: number,
  seed: number,
) {
  const logits = Array.from(
    { length: routed },
    (_, i) => input.reduce((s, v, j) => s + v * weight(seed, i, j), 0) * 3,
  );
  const scores = stableSoftmax(logits),
    selected = scores
      .map((_, i) => i)
      .sort((a, b) => scores[b] - scores[a])
      .slice(0, Math.min(k, routed)),
    gates = scores.map((v, i) => (selected.includes(i) ? v : 0));
  const ffn = (expert: number) => {
    const middle = Array.from({ length: 4 }, (_, i) => {
      const g = input.reduce(
          (s, v, j) => s + v * weight(expert + seed + 1, i, j),
          0,
        ),
        u = input.reduce(
          (s, v, j) => s + v * weight(expert + seed + 2, i, j),
          0,
        );
      return (g / (1 + Math.exp(-g))) * u;
    });
    return input.map((_, j) =>
      middle.reduce((s, v, i) => s + v * weight(expert + seed + 3, j, i), 0),
    );
  };
  const outputs = Array.from({ length: routed }, (_, i) =>
    selected.includes(i) ? ffn(i) : null,
  );
  const sharedOutput = input.map((_, j) =>
    Array.from({ length: shared }, (_, i) => ffn(100 + i)[j]).reduce(
      (a, b) => a + b,
      0,
    ),
  );
  const routedOutput = input.map((_, j) =>
    selected.reduce((s, i) => s + gates[i] * outputs[i]![j], 0),
  );
  return {
    logits,
    scores,
    selected,
    gates,
    outputs,
    sharedOutput,
    routedOutput,
    output: input.map((v, j) => v + sharedOutput[j] + routedOutput[j]),
  };
}
export function expertBalance(
  scores: number[][],
  selected: number[][],
  k: number,
  alpha: number,
) {
  const n = scores[0].length,
    t = scores.length,
    count = Array(n).fill(0) as number[];
  selected.forEach((row) => row.forEach((i) => count[i]++));
  const probability = Array.from({ length: n }, (_, i) =>
      scores.reduce((s, row) => s + row[i] / t, 0),
    ),
    frequency = count.map((c) => (n / (k * t)) * c);
  return {
    count,
    probability,
    frequency,
    loss: alpha * frequency.reduce((s, f, i) => s + f * probability[i], 0),
  };
}
export function deviceBalance(
  expert: { count: number[]; frequency: number[]; probability: number[] },
  devices: number,
  alpha: number,
) {
  const n = expert.count.length;
  if (!Number.isInteger(devices) || devices < 1 || n % devices !== 0)
    throw new Error("Devices must evenly partition routed experts");
  const width = n / devices;
  const sumGroup = (values: number[]) => Array.from({ length: devices }, (_, d) =>
    values.slice(d * width, (d + 1) * width).reduce((sum, v) => sum + v, 0));
  const frequency = sumGroup(expert.frequency).map(value => value / width);
  const probability = sumGroup(expert.probability);
  return {
    count: sumGroup(expert.count),
    frequency,
    probability,
    loss: alpha * frequency.reduce((sum, f, d) => sum + f * probability[d], 0),
  };
}
