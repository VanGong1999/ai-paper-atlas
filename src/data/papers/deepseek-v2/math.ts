export type Matrix = number[][];
export function matmul(a: Matrix, b: Matrix): Matrix {
  if (
    !a.length ||
    !b.length ||
    !a[0].length ||
    a[0].length !== b.length ||
    a.some((r) => r.length !== a[0].length) ||
    b.some((r) => r.length !== b[0].length)
  )
    throw new Error("Matrix dimension mismatch");
  return a.map((row) =>
    b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)),
  );
}
export const transpose = (a: Matrix): Matrix =>
  a[0].map((_, i) => a.map((r) => r[i]));
export function softmax(a: number[]): number[] {
  const max = Math.max(...a);
  if (max === -Infinity) return a.map(() => 0);
  const e = a.map((v) => Math.exp(v - max)),
    sum = e.reduce((s, v) => s + v, 0);
  return e.map((v) => v / sum);
}
export function attention(q: Matrix, k: Matrix, v: Matrix) {
  const scores = matmul(q, transpose(k)).map((r, i) =>
    r.map((x, j) => (j > i ? -Infinity : x / Math.sqrt(q[0].length))),
  );
  const weights = scores.map(softmax);
  return { scores, weights, output: matmul(weights, v) };
}
export function parseMatrixInput(
  text: string,
  columns: number,
  minRows: number,
  maxRows: number,
): Matrix | null {
  if (!text.trim()) return null;
  const tokens = text.split(";").map((row) => row.trim().split(/\s*,\s*|\s+/));
  if (
    tokens.length < minRows ||
    tokens.length > maxRows ||
    tokens.some(
      (row) =>
        row.length !== columns ||
        row.some((value) => !value.trim() || !Number.isFinite(Number(value))),
    )
  )
    return null;
  return tokens.map((row) => row.map(Number));
}

export function multiHeadAttention(
  h: Matrix,
  wq: Matrix,
  wk: Matrix,
  wv: Matrix,
  wo: Matrix,
  count: number,
) {
  const q = matmul(h, wq),
    k = matmul(h, wk),
    v = matmul(h, wv);
  const width = q[0].length / count;
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    k[0].length !== q[0].length ||
    v[0].length !== q[0].length
  )
    throw new Error("Head dimension mismatch");
  const heads = Array.from({ length: count }, (_, i) => {
    const slice = (m: Matrix) =>
      m.map((row) => row.slice(i * width, (i + 1) * width));
    const headQ = slice(q),
      headK = slice(k),
      headV = slice(v);
    return { q: headQ, k: headK, v: headV, ...attention(headQ, headK, headV) };
  });
  const concatenated = h.map((_, row) =>
    heads.flatMap((head) => head.output[row]),
  );
  return { heads, concatenated, output: matmul(concatenated, wo) };
}

// Cache dimensions describe the effective payload, excluding allocator metadata.
export type CacheConfig = {
  batch: number;
  sequence: number;
  layers: number;
  heads: number;
  kvHeads: number;
  headDim: number;
  latent: number;
  rope: number;
  bytes: number;
};
export type Architecture = "MHA" | "GQA" | "MQA" | "MLA";
export const defaultCache: CacheConfig = {
  batch: 1,
  sequence: 4096,
  layers: 60,
  heads: 128,
  kvHeads: 8,
  headDim: 128,
  latent: 512,
  rope: 64,
  bytes: 2,
};
export function cacheBytes(architecture: Architecture, c: CacheConfig) {
  const width =
    architecture === "MLA"
      ? c.latent + c.rope
      : 2 *
        c.headDim *
        (architecture === "MHA"
          ? c.heads
          : architecture === "GQA"
            ? c.kvHeads
            : 1);
  return c.batch * c.sequence * c.layers * width * c.bytes;
}
export function rotate(v: [number, number], angle: number): [number, number] {
  return [
    v[0] * Math.cos(angle) - v[1] * Math.sin(angle),
    v[0] * Math.sin(angle) + v[1] * Math.cos(angle),
  ];
}
export function route(logits: number[], k: number) {
  const scores = softmax(logits),
    selected = scores
      .map((_, i) => i)
      .sort((a, b) => scores[b] - scores[a])
      .slice(0, k);
  return {
    scores,
    selected,
    gates: scores.map((v, i) => (selected.includes(i) ? v : 0)),
  };
}
export function seededMatrix(rows: number, cols: number, seed: number): Matrix {
  return Array.from({ length: rows }, (_, i) =>
    Array.from(
      { length: cols },
      (_, j) =>
        Math.round(Math.sin((i * cols + j + 1) * 1.73 + seed * 2.1) * 100) /
        100,
    ),
  );
}
export function lowRankExample(hidden: number, rank: number, seed: number) {
  const h = seededMatrix(hidden, 1, seed),
    down = seededMatrix(rank, hidden, seed + 1),
    upK = seededMatrix(hidden, rank, seed + 2),
    upV = seededMatrix(hidden, rank, seed + 3);
  const c = matmul(down, h);
  return {
    h: h.flat(),
    down,
    upK,
    upV,
    latent: c.flat(),
    keys: matmul(upK, c).flat(),
    values: matmul(upV, c).flat(),
  };
}
export function absorptionExample(seed: number) {
  const q = seededMatrix(1, 4, seed),
    u = seededMatrix(4, 2, seed + 1),
    c = seededMatrix(2, 1, seed + 2);
  const expanded = matmul(q, matmul(u, c))[0][0],
    absorbed = matmul(matmul(q, u), c)[0][0];
  return { q, u, c, expanded, absorbed, error: Math.abs(expanded - absorbed) };
}
export function formatBytes(n: number) {
  return n >= 2 ** 30
    ? `${(n / 2 ** 30).toFixed(2)} GiB`
    : `${(n / 2 ** 20).toFixed(1)} MiB`;
}
export function routingBatch(seed: number, k: number) {
  const count = 20,
    n = 160,
    devices = 8,
    limit = 3,
    group = 20;
  const expertCounts = Array(n).fill(0) as number[],
    avgScores = Array(n).fill(0) as number[],
    deviceCounts = Array(devices).fill(0) as number[],
    sendCounts = Array(devices).fill(0) as number[];
  const tokens = Array.from({ length: count }, (_, t) => {
    const scores = softmax(
      seededMatrix(1, n, seed + t * 0.13)[0].map((x) => x * 3),
    );
    const groups = Array.from({ length: devices }, (_, d) => ({
      d,
      score: Math.max(...scores.slice(d * group, (d + 1) * group)),
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.d);
    const selected = scores
      .map((_, i) => i)
      .filter((i) => groups.includes(Math.floor(i / group)))
      .sort((a, b) => scores[b] - scores[a])
      .slice(0, k);
    selected.forEach((i) => {
      expertCounts[i]++;
      deviceCounts[Math.floor(i / group)]++;
    });
    new Set(selected.map((i) => Math.floor(i / group))).forEach(
      (d) => sendCounts[d]++,
    );
    scores.forEach((s, i) => (avgScores[i] += s / count));
    return { scores, selected };
  });
  const f = expertCounts.map((c) => (n / (k * count)) * c);
  const exp = 0.003 * f.reduce((s, v, i) => s + v * avgScores[i], 0);
  const pDev = Array.from({ length: devices }, (_, d) =>
    avgScores.slice(d * group, (d + 1) * group).reduce((a, b) => a + b, 0),
  );
  const dev =
    0.05 *
    pDev.reduce(
      (s, p, d) =>
        s +
        (p * f.slice(d * group, (d + 1) * group).reduce((a, b) => a + b, 0)) /
          group,
      0,
    );
  const comm =
    0.02 *
    pDev.reduce(
      (s, p, d) => s + ((p * devices) / (limit * count)) * sendCounts[d],
      0,
    );
  return {
    tokens,
    expertCounts,
    deviceCounts,
    sendCounts,
    losses: [exp, dev, comm],
    capacity: (count * k) / devices,
  };
}
