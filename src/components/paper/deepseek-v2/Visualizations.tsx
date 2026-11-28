import { createContext, useContext, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  chapters,
  benchmarks,
  modelNames,
} from "../../../data/papers/deepseek-v2/content";
import type { Scene } from "../../../data/papers/deepseek-v2/content";
import {
  absorptionExample,
  multiHeadAttention,
  parseMatrixInput,
  cacheBytes,
  defaultCache,
  formatBytes,
  lowRankExample,
  matmul,
  rotate,
  route,
  routingBatch,
  seededMatrix,
} from "../../../data/papers/deepseek-v2/math";
import type {
  CacheConfig,
  Matrix,
} from "../../../data/papers/deepseek-v2/math";
import { Formula } from "./Formula";

export type Simulation = {
  seed: number;
  hidden: number;
  rank: number;
  position: number;
  keyPosition: number;
  frequency: number;
  topK: number;
  cache: CacheConfig;
  input: string;
  heads: number;
  capacity: number;
};
export const initialSimulation: Simulation = {
  seed: 1,
  hidden: 8,
  rank: 3,
  position: 3,
  keyPosition: 1,
  frequency: 0.5,
  topK: 3,
  cache: defaultCache,
  input: "1, 0.5; 0.2, 1; 0.8, -0.3; -0.4, 0.7",
  heads: 1,
  capacity: 80,
};
type Props = {
  scene: Scene;
  step: number;
  sim: Simulation;
  onChange: (sim: Simulation) => void;
  onInspect: (id: string, pin?: boolean) => void;
  onNavigate: (id: string) => void;
  selected: string | null;
};
const SelectedConcept = createContext<string | null>(null);
type NodeProps = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  id: string;
  label: string;
  symbol?: string;
  sub?: string;
  tone?: string;
  active?: boolean;
  children?: ReactNode;
  onInspect: Props["onInspect"];
};
function Node({
  x,
  y,
  w = 130,
  h = 82,
  id,
  label,
  symbol,
  sub,
  tone = "blue",
  active,
  children,
  onInspect,
}: NodeProps) {
  const selected = useContext(SelectedConcept);
  return (
    <g
      transform={`translate(${x} ${y})`}
      className={`v2-svg-node tone-${tone} ${active || selected === id ? "active" : ""} ${selected && selected !== id ? "unrelated" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onMouseEnter={() => onInspect(id)}
      onFocus={() => onInspect(id)}
      onClick={() => onInspect(id, true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onInspect(id, true);
        }
      }}
    >
      <rect width={w} height={h} rx={7} />
      <text className="v2-svg-label" x={12} y={22}>
        {label}
      </text>
      {symbol && (
        <text
          className="v2-svg-symbol"
          x={12}
          y={49}
          style={{
            fontSize: symbol.length > 11 ? 14 : symbol.length > 7 ? 17 : 21,
          }}
        >
          {symbol}
        </text>
      )}
      {sub && (
        <text className="v2-svg-sub" x={12} y={h - 12}>
          {sub}
        </text>
      )}
      {children}
      <title>{label} · 悬停查看原理，点击固定详解</title>
    </g>
  );
}
function Wire({
  d,
  tone = "neutral",
  active = false,
  label,
}: {
  d: string;
  tone?: string;
  active?: boolean;
  label?: { text: string; x: number; y: number };
}) {
  return (
    <g className={`v2-wire tone-${tone} ${active ? "active" : ""}`}>
      <path d={d} markerEnd={`url(#v2-arrow-${tone})`} />
      {label && (
        <text x={label.x} y={label.y}>
          {label.text}
        </text>
      )}
    </g>
  );
}
function Dots({
  x,
  y,
  cols = 8,
  rows = 3,
  tone = "purple",
}: {
  x: number;
  y: number;
  cols?: number;
  rows?: number;
  tone?: string;
}) {
  return (
    <g className={`v2-matrix-dots tone-${tone}`}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <rect
          key={i}
          x={x + (i % cols) * 9}
          y={y + Math.floor(i / cols) * 9}
          width={6}
          height={6}
          rx={1}
          opacity={0.25 + ((i * 7) % 9) / 12}
        />
      ))}
    </g>
  );
}
function Svg({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      viewBox="0 0 800 430"
      className="v2-diagram"
      role="img"
      aria-label={label}
    >
      <defs>
        {["neutral", "purple", "blue", "green", "orange", "gold", "cyan"].map(
          (t) => (
            <marker
              key={t}
              id={`v2-arrow-${t}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M 1 1 L 7 4 L 1 7"
                fill="none"
                className={`tone-${t}`}
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </marker>
          ),
        )}
      </defs>
      {children}
    </svg>
  );
}

function Architecture(p: Props) {
  return (
    <Svg label="DeepSeek-V2 完整架构：Embedding → MLA → DeepSeekMoE → 输出">
      <text x="29" y="29" className="v2-svg-caption">
        AUTOREGRESSIVE TRANSFORMER
      </text>
      <text x="770" y="29" textAnchor="end" className="v2-svg-caption">
        60 LAYERS
      </text>
      {["让", "模型", "学会", "思考"].map((t, i) => (
        <g key={i} className="v2-token" onMouseEnter={() => p.onInspect("h")}>
          <rect x={28 + i * 45} y="54" width="36" height="32" rx="5" />
          <text x={46 + i * 45} y="75" textAnchor="middle">
            {t}
          </text>
        </g>
      ))}
      <Wire d="M 110 86 L 110 132" active={p.step === 0} />
      <Node
        x={45}
        y={135}
        w={130}
        h={92}
        id="h"
        label="Hidden state"
        symbol="hₜ"
        sub="d = 5120"
        onInspect={p.onInspect}
        active={p.step === 0}
      />
      <rect
        x="209"
        y="70"
        width="553"
        height="269"
        rx="10"
        className="v2-svg-region"
      />
      <text x="225" y="93" className="v2-svg-caption">
        TRANSFORMER BLOCK × 60
      </text>
      <Wire d="M 175 182 L 233 182" active />
      <Node
        x={235}
        y={120}
        w={217}
        h={165}
        id="attention"
        label="Multi-head Latent Attention"
        symbol="MLA"
        sub="低秩联合压缩 + 解耦 RoPE"
        tone="purple"
        active={p.step === 1}
        onInspect={p.onInspect}
      >
        <Dots x={14} y={65} cols={12} rows={3} />
        <text x="14" y="113" className="v2-svg-sub">
          512 latent + 64 rotary
        </text>
      </Node>
      <Wire d="M 452 202 L 499 202" tone="purple" active={p.step === 1} />
      <Node
        x={500}
        y={120}
        w={240}
        h={165}
        id="expert"
        label="DeepSeek Mixture-of-Experts"
        symbol="DeepSeekMoE"
        sub="2 shared + 6 / 160 routed"
        tone="cyan"
        active={p.step === 1}
        onInspect={p.onInspect}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <rect
            key={i}
            x={14 + (i % 8) * 26}
            y={68 + Math.floor(i / 8) * 25}
            width={19}
            height={17}
            rx={3}
            className={
              i < 2
                ? "v2-expert-shared"
                : i % 3 === 0
                  ? "v2-expert-active"
                  : "v2-expert-idle"
            }
          />
        ))}
      </Node>
      <path
        d="M 110 227 L 110 310 L 739 310 L 739 286"
        className="v2-residual"
      />
      <text x="340" y="327" className="v2-svg-caption">
        RESIDUAL CONNECTION · 保留输入信息
      </text>
      <Wire d="M 620 339 L 620 365 L 452 365" active={p.step >= 2} />
      <Node
        x={235}
        y={345}
        w={217}
        h={60}
        id="output"
        label="RMSNorm → Linear → Softmax"
        sub="下一个 Token 的概率分布"
        tone="green"
        active={p.step >= 2}
        onInspect={p.onInspect}
      />
      <text x="29" y="377" className="v2-svg-caption">
        FIRST FFN: DENSE
      </text>
      <text x="29" y="396" className="v2-svg-sub">
        其余 59 层使用 MoE
      </text>
    </Svg>
  );
}
function MLADiagram(p: Props) {
  const ex = useMemo(
    () => lowRankExample(p.sim.hidden, p.sim.rank, p.sim.seed),
    [p.sim.hidden, p.sim.rank, p.sim.seed],
  );
  return (
    <>
      <Svg label="MLA 低秩联合压缩与内容、位置两条路径">
        <text x="24" y="27" className="v2-svg-caption">
          LOW-RANK KEY–VALUE JOINT COMPRESSION
        </text>
        <text x="775" y="27" textAnchor="end" className="v2-svg-caption">
          Eq. 9–19
        </text>
        <rect
          x="314"
          y="68"
          width="154"
          height="295"
          rx="10"
          className="v2-cache-region"
        />
        <text x="391" y="90" textAnchor="middle" className="v2-cache-label">
          PERSISTENT CACHE
        </text>
        <Node
          x={24}
          y={144}
          w={100}
          h={85}
          id="h"
          label="Hidden state"
          symbol="hₜ"
          sub="[5120]"
          active={p.step === 0}
          onInspect={p.onInspect}
        />
        <Wire d="M 124 184 L 161 184" active />
        <Node
          x={163}
          y={143}
          w={128}
          h={87}
          id="down"
          label="Down projection"
          symbol="Wᴰᴷⱽ"
          sub="[512, 5120]"
          tone="purple"
          active={p.step === 1}
          onInspect={p.onInspect}
        />
        <Wire d="M 291 184 L 330 184" tone="purple" active={p.step >= 1} />
        <Node
          x={332}
          y={133}
          w={118}
          h={109}
          id="latent"
          label="KV latent"
          symbol="cₜᴷⱽ"
          sub="[512] · joint"
          tone="purple"
          active={p.step === 1}
          onInspect={p.onInspect}
        >
          <Dots x={12} y={62} cols={10} rows={2} />
        </Node>
        <Wire
          d="M 450 170 L 480 170 L 480 126 L 510 126"
          tone="green"
          active={p.step >= 2}
        />
        <Wire
          d="M 450 202 L 480 202 L 480 257 L 510 257"
          tone="orange"
          active={p.step >= 2}
        />
        <Node
          x={512}
          y={83}
          w={120}
          h={87}
          id="key"
          label="Key projection"
          symbol="Wᵁᴷ → kᶜ"
          sub="[128 × 128]"
          tone="green"
          active={p.step === 2}
          onInspect={p.onInspect}
        />
        <Node
          x={512}
          y={215}
          w={120}
          h={87}
          id="value"
          label="Value projection"
          symbol="Wᵁⱽ → vᶜ"
          sub="[128 × 128]"
          tone="orange"
          active={p.step === 2}
          onInspect={p.onInspect}
        />
        <Wire
          d="M 632 126 L 658 126 L 658 163 L 681 163"
          tone="green"
          active={p.step >= 2}
        />
        <Wire
          d="M 632 257 L 658 257 L 658 204 L 681 204"
          tone="orange"
          active={p.step >= 2}
        />
        <Node
          x={683}
          y={139}
          w={95}
          h={91}
          id="attention"
          label="Attention"
          symbol="Σ aⱼvⱼ"
          sub="128 heads"
          tone="blue"
          active={p.step >= 2}
          onInspect={p.onInspect}
        />
        <Node
          x={163}
          y={37}
          w={128}
          h={68}
          id="query"
          label="Query low-rank"
          symbol="WᴰQ → WᵁQ"
          sub="[1536] → [16384]"
          tone="blue"
          active={p.step === 3}
          onInspect={p.onInspect}
        />
        <Wire d="M 74 144 L 74 72 L 163 72" tone="blue" active={p.step === 3} />
        <Wire
          d="M 291 61 L 729 61 L 729 139"
          tone="blue"
          active={p.step === 3}
        />
        <Node
          x={332}
          y={280}
          w={118}
          h={63}
          id="rope"
          label="Shared RoPE key"
          symbol="kₜᴿ · [64]"
          tone="gold"
          onInspect={p.onInspect}
        />
        <Wire d="M 74 229 L 74 312 L 332 312" tone="gold" />
        <Wire d="M 450 313 L 730 313 L 730 230" tone="gold" />
        <text x="24" y="390" className="v2-svg-sub">
          只缓存低维表示，不持久存储完整的历史 K / V
        </text>
        <text x="775" y="390" textAnchor="end" className="v2-cache-label">
          512 + 64 = 576 elements
        </text>
      </Svg>
      <div className="v2-numeric-strip">
        <span className="v2-dot purple" />
        教学计算{" "}
        <code>
          [
          {ex.h
            .slice(0, 3)
            .map((v) => v.toFixed(2))
            .join(", ")}
          …]
        </code>
        <span>→</span>
        <code className="purple">
          c = [
          {ex.latent
            .slice(0, 4)
            .map((v) => v.toFixed(2))
            .join(", ")}
          {ex.latent.length > 4 ? "…" : ""}]
        </code>
        <span className="v2-muted">
          {p.sim.hidden} → {p.sim.rank}
        </span>
      </div>
    </>
  );
}
function MatrixTable({
  values,
  label,
  tone = "blue",
  highlight = -1,
}: {
  values: Matrix;
  label: string;
  tone?: string;
  highlight?: number;
}) {
  return (
    <div className={`v2-matrix tone-${tone}`}>
      <div className="v2-matrix-name">
        {label}
        <small>
          {values.length} × {values[0].length}
        </small>
      </div>
      <div className="v2-matrix-bracket">
        <table>
          <tbody>
            {values.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j} className={highlight === i ? "highlight" : ""}>
                    {v === -Infinity ? "−∞" : v.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function MatrixScene(p: Props) {
  const a = seededMatrix(3, 3, p.sim.seed),
    b = seededMatrix(3, 2, p.sim.seed + 2),
    c = matmul(a, b);
  return (
    <div className="v2-math-scene">
      <div className="v2-canvas-heading">
        <span>ROW × COLUMN → DOT PRODUCT</span>
        <span>前置数学 · 真实数值计算</span>
      </div>
      <div className="v2-matrix-equation">
        <MatrixTable values={a} label="A" highlight={p.step % 3} />
        <b>×</b>
        <MatrixTable values={b} label="B" tone="purple" />
        <b>=</b>
        <MatrixTable values={c} label="C" tone="green" highlight={p.step % 3} />
      </div>
      <div className="v2-dot-product">
        <small>当前行 · ROW {(p.step % 3) + 1}, COLUMN 1</small>
        <Formula
          math={
            a[p.step % 3].map((v, i) => `(${v})\\times(${b[i][0]})`).join("+") +
            `=${c[p.step % 3][0].toFixed(4)}`
          }
        />
        <p>高亮行的每个元素，与右侧矩阵第一列对应相乘，再求和。</p>
      </div>
      <div className="v2-math-callouts">
        <div>
          <span className="v2-dot purple" />
          结合律<strong>(AB)C = A(BC)</strong>
          <small>重新组织计算，不改变结果</small>
        </div>
        <div>
          <span className="v2-dot blue" />
          维度检查<strong>[3,3] × [3,2] → [3,2]</strong>
          <small>内维相等，外维决定输出</small>
        </div>
      </div>
    </div>
  );
}
function AttentionScene(p: Props) {
  const [head, setHead] = useState(0);
  const [custom, setCustom] = useState<{
    context: string;
    q?: string;
    k?: string;
    v?: string;
  }>({ context: "" });
  const parsedInput = parseMatrixInput(p.sim.input, 2, 2, 6);
  const valid = parsedInput !== null;
  const parsed = parsedInput ?? [
    [1, 0.5],
    [0.2, 1],
    [0.8, -0.3],
    [-0.4, 0.7],
  ];
  const context = `${p.sim.seed}:${p.sim.heads}`;
  const width = p.sim.heads * 2;
  const defaults = {
    q: seededMatrix(2, width, p.sim.seed),
    k: seededMatrix(2, width, p.sim.seed + 1),
    v: seededMatrix(2, width, p.sim.seed + 2),
  };
  const text = (key: "q" | "k" | "v") =>
    (custom.context === context ? custom[key] : undefined) ??
    defaults[key].map((row) => row.join(", ")).join("; ");
  const weights = {
    q: parseMatrixInput(text("q"), width, 2, 2),
    k: parseMatrixInput(text("k"), width, 2, 2),
    v: parseMatrixInput(text("v"), width, 2, 2),
  };
  const result = multiHeadAttention(
    parsed,
    weights.q ?? defaults.q,
    weights.k ?? defaults.k,
    weights.v ?? defaults.v,
    seededMatrix(width, 2, p.sim.seed + 3),
    p.sim.heads,
  );
  const activeHead = Math.min(head, p.sim.heads - 1);
  const a = result.heads[activeHead],
    { q, k, v } = a;
  return (
    <div className="v2-attention-scene">
      <div className="v2-canvas-heading">
        <span>CAUSAL SCALED DOT-PRODUCT ATTENTION</span>
        <span>教学多头 · 每头 dₕ = 2 · 输出 d = 2</span>
      </div>
      <div className="v2-attention-head-controls">
        <label>
          Head count{" "}
          <select
            aria-label="Attention head count"
            value={p.sim.heads}
            onChange={(e) =>
              p.onChange({ ...p.sim, heads: Number(e.target.value) })
            }
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} heads
              </option>
            ))}
          </select>
        </label>
        <span>查看</span>
        {result.heads.map((_, i) => (
          <button
            key={i}
            className={activeHead === i ? "active" : ""}
            onClick={() => setHead(i)}
          >
            Head {i + 1}
          </button>
        ))}
      </div>
      <div className="v2-attention-pipeline">
        {[
          "Input",
          "Q / K / V",
          "QKᵀ / √d",
          "Mask",
          "Softmax",
          "Weighted V",
        ].map((x, i) => (
          <span
            key={x}
            className={Math.min(5, p.step * 2) === i ? "active" : ""}
          >
            {x}
            {i < 5 && <b>→</b>}
          </span>
        ))}
      </div>
      <div className="v2-attention-body">
        <div className="v2-qkv">
          <MatrixTable
            values={p.step === 0 ? parsed : q}
            label={p.step === 0 ? "Input H" : "Query Q"}
            tone="blue"
          />
          <MatrixTable values={k} label="Key K" tone="green" />
          <MatrixTable values={v} label="Value V" tone="orange" />
        </div>
        <div className="v2-attention-heat">
          <div className="v2-matrix-name">
            {p.step === 1 ? "Scaled + masked scores" : "Attention weights"}
            <small>
              {parsed.length} × {parsed.length}
            </small>
          </div>
          <div
            className="v2-heatmap"
            style={{ gridTemplateColumns: `repeat(${parsed.length},1fr)` }}
          >
            {(p.step === 1 ? a.scores : a.weights).flatMap((r, i) =>
              r.map((x, j) => (
                <button
                  key={`${i}-${j}`}
                  onMouseEnter={() => p.onInspect("attention")}
                  title={`Query ${i + 1} → Key ${j + 1}: ${x}`}
                  style={
                    {
                      "--heat":
                        j > i ? 0 : p.step === 1 ? Math.min(1, Math.abs(x)) : x,
                    } as CSSProperties
                  }
                  className={j > i ? "masked" : ""}
                >
                  {x === -Infinity ? "−∞" : j > i ? "×" : x.toFixed(3)}
                </button>
              )),
            )}
          </div>
          <small>行 = Query · 列 = Key · 上三角为未来 Token</small>
        </div>
      </div>
      <div className="v2-output-matrix">
        <span>当前头输出 Oᵢ = softmax(QᵢKᵢᵀ / √dₕ + M)Vᵢ</span>
        <code>
          {a.output
            .map((r) => `[${r.map((x) => x.toFixed(3)).join(", ")}]`)
            .join("  ")}
        </code>
      </div>
      <div className="v2-final-attention-output">
        <span>Concat({p.sim.heads} heads) × Wᴼ → [T,2]</span>
        <code>
          {result.output
            .map((row) => `[${row.map((x) => x.toFixed(3)).join(", ")}]`)
            .join("  ")}
        </code>
      </div>
      <label className="v2-custom-input">
        自定义输入 H{" "}
        <input
          aria-label="自定义 Attention 输入"
          value={p.sim.input}
          onChange={(e) => p.onChange({ ...p.sim, input: e.target.value })}
        />
      </label>
      <details className="v2-custom-weights">
        <summary>
          编辑 Q / K / V 投影矩阵 <span>2 × {width}</span>
        </summary>
        {(["q", "k", "v"] as const).map((key) => (
          <label key={key}>
            W{key.toUpperCase()}{" "}
            <input
              aria-label={`自定义 W${key.toUpperCase()} 投影`}
              value={text(key)}
              onChange={(e) =>
                setCustom((previous) => ({
                  ...previous,
                  ...(previous.context === context
                    ? {}
                    : { q: undefined, k: undefined, v: undefined }),
                  context,
                  [key]: e.target.value,
                }))
              }
            />
            {weights[key] === null && (
              <small>
                需要 2 行、每行 {width} 个有限数值。当前使用该矩阵的默认值。
              </small>
            )}
          </label>
        ))}
      </details>
      {!valid && (
        <p className="v2-error">
          输入 2–6 行，每行两个有限数字；用分号分行。当前显示默认矩阵。
        </p>
      )}
    </div>
  );
}
function CacheScene(p: Props) {
  const c = p.sim.cache,
    max = cacheBytes("MHA", c),
    mla = cacheBytes("MLA", c),
    capacity = p.sim.capacity * 2 ** 30;
  return (
    <div className="v2-cache-scene">
      <div className="v2-canvas-heading">
        <span>KV CACHE · SAME CONFIGURATION</span>
        <span>理论有效负载 · {c.bytes * 8}-bit</span>
      </div>
      <div className="v2-cache-bars">
        {(["MHA", "GQA", "MQA", "MLA"] as const).map((a, i) => {
          const n = cacheBytes(a, c);
          return (
            <button
              key={a}
              className={`v2-cache-bar ${a === "MLA" ? "featured" : ""}`}
              onMouseEnter={() => p.onInspect(a === "MLA" ? "latent" : "cache")}
              onClick={() => p.onInspect("cache", true)}
            >
              <span>
                <b>{a}</b>
                <small>
                  {
                    [
                      "独立 KV Heads",
                      "分组共享 KV",
                      "单组共享 KV",
                      "联合 latent + RoPE",
                    ][i]
                  }
                </small>
              </span>
              <div className="v2-bar-track">
                <div style={{ width: `${Math.max(0.8, (n / max) * 100)}%` }} />
                <em>
                  {a === "MLA"
                    ? `${((1 - n / max) * 100).toFixed(2)}% less vs same-config MHA`
                    : ""}
                </em>
              </div>
              <strong>{formatBytes(n)}</strong>
            </button>
          );
        })}
      </div>
      <div className="v2-cache-lower">
        <div>
          <div className="v2-canvas-heading">
            <span>历史缓存的追加</span>
            <span>T = {c.sequence.toLocaleString()}</span>
          </div>
          <div className="v2-cache-blocks">
            {Array.from({ length: 20 }, (_, i) => (
              <button
                key={i}
                title={`历史区块 ${i + 1} · 每 Token ${c.latent + c.rope} 元素`}
                onMouseEnter={() => p.onInspect("cache")}
                className={i === p.step + 15 ? "new" : ""}
              >
                <i />
                <i />
                <i />
              </button>
            ))}
          </div>
          <div className="v2-cache-legend">
            <span>
              <i className="v2-dot purple" />
              KV latent · {c.latent}
            </span>
            <span>
              <i className="v2-dot gold" />
              RoPE key · {c.rope}
            </span>
            <span>→ append</span>
          </div>
        </div>
        <div className="v2-memory-summary">
          <small>MLA / {p.sim.capacity} GiB GPU 容量</small>
          <strong>
            {((mla / capacity) * 100).toFixed(1)}
            <em>%</em>
          </strong>
          <div className="v2-budget-track">
            <i
              className={mla > capacity ? "overflow" : ""}
              style={{ width: `${Math.min(100, (mla / capacity) * 100)}%` }}
            />
          </div>
          <small>
            {mla > capacity
              ? "缓存有效负载已超容量"
              : "另需预留权重、激活、工作区"}
          </small>
        </div>
      </div>
      <div className="v2-calc-equation">
        <Formula
          math={`M_{MLA}=${c.batch}\\times${c.sequence}\\times${c.layers}\\times(${c.latent}+${c.rope})\\times${c.bytes}`}
        />
        <span>= {formatBytes(mla)}</span>
      </div>
    </div>
  );
}
function RopeScene(p: Props) {
  const { position, keyPosition, frequency } = p.sim,
    q = rotate([1, 0], position * frequency),
    k = rotate([1, 0], keyPosition * frequency),
    dot = q[0] * k[0] + q[1] * k[1];
  return (
    <>
      <Svg label="RoPE 二维旋转与内容、位置分数解耦">
        <text x="25" y="28" className="v2-svg-caption">
          ROTARY POSITION EMBEDDING · 2D SLICE
        </text>
        <circle cx="210" cy="211" r="130" className="v2-rope-circle" />
        <circle cx="210" cy="211" r="65" className="v2-rope-circle minor" />
        <path d="M 40 211 H 380 M 210 45 V 377" className="v2-axis" />
        <text x="379" y="230" className="v2-svg-sub">
          x
        </text>
        <text x="218" y="48" className="v2-svg-sub">
          y
        </text>
        <path
          d={`M 210 211 L ${210 + q[0] * 130} ${211 - q[1] * 130}`}
          className="v2-vector tone-blue"
          markerEnd="url(#v2-arrow-blue)"
        />
        <path
          d={`M 210 211 L ${210 + k[0] * 130} ${211 - k[1] * 130}`}
          className="v2-vector tone-green"
          markerEnd="url(#v2-arrow-green)"
        />
        <text
          x={210 + q[0] * 147}
          y={211 - q[1] * 147}
          className="v2-vector-label tone-blue"
        >
          qᴿ
        </text>
        <text
          x={210 + k[0] * 147}
          y={211 - k[1] * 147}
          className="v2-vector-label tone-green"
        >
          kᴿ
        </text>
        <circle cx="210" cy="211" r="4" className="v2-origin" />
        <Node
          x={434}
          y={70}
          w={324}
          h={92}
          id="key"
          label="CONTENT PATH · 内容匹配"
          symbol="(qᶜ)ᵀ kᶜ"
          sub="不旋转 → 支持矩阵吸收"
          tone="purple"
          active={p.step === 2}
          onInspect={p.onInspect}
        />
        <Node
          x={434}
          y={197}
          w={324}
          h={92}
          id="rope"
          label="POSITION PATH · 位置关系"
          symbol="(qᴿ)ᵀ kᴿ"
          sub={`Δ position = ${keyPosition - position} · dot = ${dot.toFixed(4)}`}
          tone="gold"
          active={p.step !== 2}
          onInspect={p.onInspect}
        />
        <Wire
          d="M 595 162 L 595 197"
          tone="gold"
          label={{ text: "+", x: 612, y: 184 }}
        />
        <Wire d="M 595 289 L 595 326" active />
        <Node
          x={434}
          y={328}
          w={324}
          h={67}
          id="attention"
          label="(Content score + Position score) / √192"
          sub="Causal mask → Softmax → Weighted sum"
          tone="blue"
          active={p.step === 3}
          onInspect={p.onInspect}
        />
        <text x="65" y="411" className="v2-svg-sub">
          θQ = {(position * frequency).toFixed(2)} rad
        </text>
        <text x="230" y="411" className="v2-svg-sub">
          θK = {(keyPosition * frequency).toFixed(2)} rad
        </text>
      </Svg>
      <div className="v2-numeric-strip">
        <span className="v2-dot gold" />
        相对位置点积{" "}
        <code>
          cos(({keyPosition} − {position}) × {frequency}) = {dot.toFixed(5)}
        </code>
        <span className="v2-muted">‖q‖ = ‖k‖ = 1</span>
      </div>
    </>
  );
}
function AbsorptionScene(p: Props) {
  const e = absorptionExample(p.sim.seed);
  return (
    <div className="v2-absorption-scene">
      <div className="v2-canvas-heading">
        <span>MATRIX ASSOCIATIVITY · 等价变换</span>
        <span>Eq. 10 → 推理代数展开</span>
      </div>
      <div className={`v2-absorption-path ${p.step === 0 ? "active" : ""}`}>
        <div>
          <b>01</b>
          <span>
            展开历史 Key<small>每个历史 Token 都先升维</small>
          </span>
          <em>EXPANDED</em>
        </div>
        <div className="v2-abs-equation">
          <span className="blue">qᵀ</span>
          <b>×</b>
          <span className="v2-parenthesis">
            (<span className="green">Wᵁᴷ</span>
            <b>×</b>
            <span className="purple">cⱼ</span>)
          </span>
          <b>=</b>
          <strong>{e.expanded.toFixed(6)}</strong>
        </div>
        <small>[1,4] × ([4,2] × [2,1]) → scalar</small>
      </div>
      <div className="v2-associativity">
        ↓<span>只改变括号的位置 · 矩阵次序保持不变</span>↓
      </div>
      <div
        className={`v2-absorption-path optimized ${p.step >= 1 ? "active" : ""}`}
      >
        <div>
          <b>02</b>
          <span>
            投影当前 Query<small>直接读取历史 latent</small>
          </span>
          <em>ABSORBED</em>
        </div>
        <div className="v2-abs-equation">
          <span className="v2-parenthesis">
            (<span className="blue">qᵀ</span>
            <b>×</b>
            <span className="green">Wᵁᴷ</span>)
          </span>
          <b>×</b>
          <span className="purple">cⱼ</span>
          <b>=</b>
          <strong>{e.absorbed.toFixed(6)}</strong>
        </div>
        <small>([1,4] × [4,2]) × [2,1] → scalar</small>
      </div>
      <div className="v2-equivalence">
        <span>✓ 两条路径数值一致</span>
        <code>absolute error = {e.error.toExponential(2)}</code>
        <small>FP64 教学矩阵 · 不跨越 Softmax</small>
      </div>
      <Formula
        math={
          p.step === 2
            ? "\\sum_j a_j W^{UV}c_j=W^{UV}\\left(\\sum_j a_jc_j\\right)"
            : "q^T(W^{UK}c)=(q^TW^{UK})c"
        }
      />
    </div>
  );
}
function MoEScene(p: Props) {
  const logits = seededMatrix(12, 1, p.sim.seed)
      .flat()
      .map((x) => x * 3),
    r = route(logits, p.sim.topK);
  return (
    <>
      <Svg label="MoE 路由、共享专家与专家加权聚合">
        <text x="25" y="28" className="v2-svg-caption">
          FINE-GRAINED EXPERT ROUTING
        </text>
        <text x="775" y="28" textAnchor="end" className="v2-svg-caption">
          教学缩小为 12 个路由专家
        </text>
        <Node
          x={25}
          y={182}
          w={110}
          id="h"
          label="Token input"
          symbol="uₜ"
          sub="hidden state"
          active={p.step === 0}
          onInspect={p.onInspect}
        />
        <Wire d="M 135 223 L 177 223" tone="blue" active />
        <Node
          x={180}
          y={173}
          w={135}
          h={103}
          id="router"
          label="Router"
          symbol="Softmax → Top-K"
          sub={`K = ${p.sim.topK} of 12`}
          tone="purple"
          active={p.step === 1}
          onInspect={p.onInspect}
        />
        <Node
          x={180}
          y={55}
          w={135}
          h={69}
          id="shared"
          label="Shared experts"
          symbol="S₁ + S₂"
          tone="gold"
          active={p.step === 2}
          onInspect={p.onInspect}
        />
        <Wire d="M 80 182 L 80 90 L 180 90" tone="gold" />
        <Wire d="M 315 90 L 713 90 L 713 184" tone="gold" />
        {r.scores.map((score, i) => {
          const y = 120 + i * 22,
            active = r.selected.includes(i);
          return (
            <g
              key={i}
              className={`v2-expert-row ${active ? "active" : ""}`}
              onMouseEnter={() => p.onInspect("expert")}
              onClick={() => p.onInspect("expert", true)}
              role="button"
              tabIndex={0}
              aria-label={`Expert ${i + 1} score ${score.toFixed(3)}`}
              onFocus={() => p.onInspect("expert")}
            >
              <path
                d={`M 315 224 C 355 224 355 ${y + 8} 398 ${y + 8}`}
                className="v2-routing-wire"
              />
              <rect x="400" y={y} width="193" height="17" rx="3" />
              <rect
                x="401"
                y={y + 1}
                width={score * 600}
                height="15"
                rx="2"
                className="v2-routing-fill"
              />
              <text x="410" y={y + 12}>
                E{String(i + 1).padStart(2, "0")}
              </text>
              <text x="582" y={y + 12} textAnchor="end">
                {score.toFixed(3)} {active ? "✓" : ""}
              </text>
              {active && (
                <path
                  d={`M 593 ${y + 8} C 640 ${y + 8} 640 224 664 224`}
                  className="v2-routing-wire outgoing"
                />
              )}
            </g>
          );
        })}
        <Node
          x={666}
          y={184}
          w={109}
          h={85}
          id="output"
          label="Aggregate"
          symbol="Σ gᵢEᵢ + S"
          sub="+ residual"
          tone="cyan"
          active={p.step >= 2}
          onInspect={p.onInspect}
        />
        <text x="400" y="105" className="v2-svg-caption">
          EXPERT AFFINITY SCORES
        </text>
        <text x="25" y="405" className="v2-svg-sub">
          完整 V2：160 路由专家 · Top-6 · 2 个共享专家始终激活
        </text>
      </Svg>
      <div className="v2-numeric-strip">
        <span className="v2-dot cyan" />
        当前激活 <code>{r.selected.map((i) => `E${i + 1}`).join(" + ")}</code>
        <span className="v2-muted">
          Σ selected gates = {r.gates.reduce((a, b) => a + b, 0).toFixed(4)} ·
          不再归一化
        </span>
      </div>
    </>
  );
}
function InfraScene(p: Props) {
  const batch = routingBatch(p.sim.seed, p.sim.topK),
    loads = batch.deviceCounts,
    max = Math.max(1, ...loads);
  return (
    <div className="v2-infra-scene">
      <div className="v2-canvas-heading">
        <span>EXPERT PARALLELISM · 8 DEVICES</span>
        <span>20 个教学 Token · 160 experts · M≤3</span>
      </div>
      <div className="v2-gpu-grid">
        {loads.map((load, i) => (
          <button
            key={i}
            className={`v2-gpu ${load > batch.capacity ? "active" : ""}`}
            onMouseEnter={() => p.onInspect("gpu")}
            onClick={() => p.onInspect("gpu", true)}
          >
            <span>
              <i>▦</i> GPU {i}
            </span>
            <div className="v2-gpu-experts">
              {Array.from({ length: 20 }, (_, j) => (
                <i key={j} className={j < load ? "lit" : ""} />
              ))}
            </div>
            <div className="v2-gpu-load">
              <i style={{ width: `${(load / max) * 100}%` }} />
            </div>
            <small>20 experts · {load} 次分派</small>
          </button>
        ))}
      </div>
      <div className="v2-routing-losses">
        <span>
          Top-K <b>{p.sim.topK}</b>
        </span>
        <span>
          专家分派 <b>{loads.reduce((a, b) => a + b, 0)}</b>
        </span>
        <span>
          设备均值 <b>{batch.capacity.toFixed(1)}</b>
        </span>
        <span>
          Exp / Dev / Comm loss{" "}
          <b>{batch.losses.map((x) => x.toFixed(4)).join(" / ")}</b>
        </span>
      </div>
      <div className="v2-communication-strip">
        <span>DISPATCH</span>
        <b>⇄</b>
        <strong>All-to-all</strong>
        <b>⇄</b>
        <span>EXPERT COMPUTE</span>
        <b>⇄</b>
        <span>COMBINE</span>
      </div>
      <div className="v2-overlap">
        <div>
          <span>共享专家计算</span>
          <i>COMPUTE</i>
        </div>
        <div>
          <span>路由专家通信</span>
          <i>ALL-TO-ALL</i>
        </div>
        <small>
          设备柱状图为真实路由计数；每个 Token 仅访问所选最多 3 个设备内的 Top-K
          专家。三个均衡损失按论文式 23–31 计算，未执行 token dropping。
        </small>
      </div>
    </div>
  );
}
function TrainingScene(p: Props) {
  return (
    <>
      <Svg label="DeepSeek-V2 预训练学习率与长上下文扩展">
        <text x="25" y="28" className="v2-svg-caption">
          PRETRAINING SCHEDULE · 8.1T TOKENS
        </text>
        <path d="M 80 65 V 280 H 750" className="v2-axis" />
        {[0, 0.5, 1].map((v, i) => (
          <g key={i}>
            <path d={`M 80 ${260 - v * 160} H 750`} className="v2-grid-line" />
            <text
              x="65"
              y={264 - v * 160}
              textAnchor="end"
              className="v2-svg-sub"
            >
              {(v * 2.4).toFixed(1)}e−4
            </text>
          </g>
        ))}
        <path
          d="M 80 260 L 116 100 L 482 100 L 482 209 L 683 209 L 683 244 L 750 244"
          className="v2-training-line"
        />
        <path
          d="M 80 260 L 116 100 L 482 100 L 482 209 L 683 209 L 683 244 L 750 244 V 280 H 80 Z"
          className="v2-training-area"
        />
        <text x="116" y="78" className="v2-svg-sub">
          2K steps warmup
        </text>
        <text x="490" y="190" className="v2-svg-sub">
          × 0.316
        </text>
        <text x="683" y="227" className="v2-svg-sub">
          × 0.316
        </text>
        {["0", "60%", "90%", "100%"].map((x, i) => (
          <text
            key={x}
            x={[80, 482, 683, 750][i]}
            y="305"
            textAnchor="middle"
            className="v2-svg-sub"
          >
            {x}
          </text>
        ))}
        <text x="750" y="327" textAnchor="end" className="v2-svg-caption">
          TRAINING TOKENS · warmup 横轴为示意
        </text>
        <Node
          x={80}
          y={350}
          w={181}
          h={61}
          id="h"
          label="4K context"
          sub="8.1T Token 主预训练"
          tone="blue"
          active={p.step < 3}
          onInspect={p.onInspect}
        />
        <Wire d="M 261 382 H 322" />
        <Node
          x={324}
          y={350}
          w={181}
          h={61}
          id="rope"
          label="32K continued training"
          sub="YaRN · 1000 steps"
          tone="gold"
          active={p.step === 3}
          onInspect={p.onInspect}
        />
        <Wire d="M 505 382 H 566" tone="gold" />
        <Node
          x={568}
          y={350}
          w={181}
          h={61}
          id="cache"
          label="128K evaluation"
          sub="Needle in a Haystack"
          tone="green"
          active={p.step === 3}
          onInspect={p.onInspect}
        />
      </Svg>
    </>
  );
}
function AlignmentScene(p: Props) {
  const rewards = seededMatrix(4, 1, p.sim.seed)
      .flat()
      .map((v) => Math.round((v + 1) * 3)),
    mean = rewards.reduce((a, b) => a + b, 0) / 4,
    std = Math.sqrt(rewards.reduce((a, v) => a + (v - mean) ** 2, 0) / 4);
  return (
    <div className="v2-alignment-scene">
      <div className="v2-canvas-heading">
        <span>GROUP RELATIVE POLICY OPTIMIZATION</span>
        <span>教学模拟 · G = 4</span>
      </div>
      <div className="v2-alignment-flow">
        <div>
          同一个问题 q<small>由旧策略 πold 采样</small>
        </div>
        <b>→</b>
        <div>
          4 个候选回答<small>o₁ · o₂ · o₃ · o₄</small>
        </div>
        <b>→</b>
        <div>
          奖励模型评分<small>rᵢ = RM(oᵢ)</small>
        </div>
      </div>
      <div className="v2-reward-grid">
        {rewards.map((r, i) => {
          const a = std ? (r - mean) / std : 0;
          return (
            <div key={i} className={a >= 0 ? "positive" : "negative"}>
              <small>RESPONSE {i + 1}</small>
              <span>
                奖励<strong>{r.toFixed(1)}</strong>
              </span>
              <div className="v2-reward-bar">
                <i style={{ width: `${(Math.abs(a) / 2) * 100}%` }} />
              </div>
              <span>
                组内优势
                <b>
                  {a >= 0 ? "+" : ""}
                  {a.toFixed(3)}
                </b>
              </span>
              <small>
                {a > 0
                  ? "相对提高采样概率"
                  : a < 0
                    ? "相对降低采样概率"
                    : "与组内平均相同"}
              </small>
            </div>
          );
        })}
      </div>
      <div className="v2-alignment-stats">
        <span>
          mean(r) <b>{mean.toFixed(3)}</b>
        </span>
        <span>
          std(r) <b>{std.toFixed(3)}</b>
        </span>
        <span>无需独立 Critic</span>
      </div>
      <Formula math="A_i=\frac{r_i-\mathrm{mean}(r_1,\ldots,r_G)}{\mathrm{std}(r_1,\ldots,r_G)}" />
      <div className="v2-two-stages">
        <span>
          <b>01</b>推理对齐 · 数学 + 代码
        </span>
        <i>→</i>
        <span>
          <b>02</b>人类偏好 · Helpful + Safety + Rule
        </span>
      </div>
    </div>
  );
}
export function ExperimentScene() {
  const [metric, setMetric] = useState(0),
    [sort, setSort] = useState(false),
    [table, setTable] = useState(false),
    [hidden, setHidden] = useState<number[]>([]);
  const b = benchmarks[metric],
    data = modelNames
      .map((name, i) => ({ name, value: b.values[i], index: i }))
      .filter((d) => !hidden.includes(d.index));
  if (sort) data.sort((a, b) => b.value - a.value);
  return (
    <div className="v2-experiments">
      <div className="v2-experiment-toolbar">
        <label>
          评测指标{" "}
          <select
            aria-label="评测指标"
            value={metric}
            onChange={(e) => setMetric(Number(e.target.value))}
          >
            {benchmarks.map((b, i) => (
              <option key={b.name} value={i}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setSort((v) => !v)}>
          {sort ? "↓ 按分数排序" : "⇅ 论文顺序"}
        </button>
        <button onClick={() => setTable((v) => !v)}>
          {table ? "▥ 图表" : "▤ 原始数值"}
        </button>
      </div>
      <div className="v2-canvas-heading">
        <span>
          {b.name.toUpperCase()} · {b.metric}
        </span>
        <span>Table 2 · {b.shots} · Base models</span>
      </div>
      {table ? (
        <table className="v2-data-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>{b.metric} (%)</th>
              <th>Shots</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td>{d.value.toFixed(1)}</td>
                <td>{b.shots}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="v2-benchmark-chart">
          {data.map((d) => (
            <div className={d.index === 4 ? "featured" : ""} key={d.name}>
              <span>
                {d.name}
                <small>
                  {d.index === 4
                    ? "21B activated / 236B total"
                    : d.index === 2
                      ? "39B activated / 141B total"
                      : `${[67, 72, 39, 70][d.index]}B Dense`}
                </small>
              </span>
              <div
                title={`${d.name}: ${d.value}% · ${b.shots} · arXiv v5 Table 2`}
              >
                <i style={{ width: `${d.value}%` }} />
              </div>
              <strong>{d.value.toFixed(1)}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="v2-model-filters">
        {modelNames.map((n, i) => (
          <label key={n}>
            <input
              type="checkbox"
              checked={!hidden.includes(i)}
              onChange={() =>
                setHidden((x) =>
                  x.includes(i) ? x.filter((v) => v !== i) : [...x, i],
                )
              }
            />
            {n}
          </label>
        ))}
      </div>
      <div className="v2-source-note">
        <b>实验怎么读？</b>{" "}
        同一内部评估框架，指标为百分比，越高越好。训练数据、模型结构与参数预算存在差异，单个基准不能概括整体能力。数值来自{" "}
        <a
          href="https://arxiv.org/html/2405.04434v5#S3.T2"
          target="_blank"
          rel="noreferrer"
        >
          arXiv v5 · Table 2 ↗
        </a>
        。
      </div>
    </div>
  );
}
function GraphScene(p: Props) {
  const nodes = [
    { id: "math", x: 65, y: 60 },
    { id: "attention", x: 295, y: 60 },
    { id: "kv-cache", x: 535, y: 60 },
    { id: "mla", x: 295, y: 175 },
    { id: "rope", x: 65, y: 290 },
    { id: "absorption", x: 295, y: 290 },
    { id: "inference", x: 535, y: 290 },
    { id: "deepseekmoe", x: 535, y: 175 },
  ];
  return (
    <Svg label="可点击的 DeepSeek-V2 知识依赖图">
      <text x="25" y="27" className="v2-svg-caption">
        CONNECTED IDEAS · 点击概念开始学习
      </text>
      {[
        [0, 1],
        [1, 2],
        [1, 3],
        [2, 3],
        [3, 4],
        [3, 5],
        [5, 6],
        [7, 6],
      ].map(([a, b], i) => (
        <Wire
          key={i}
          d={`M ${nodes[a].x + 90} ${nodes[a].y + 36} L ${nodes[b].x + 90} ${nodes[b].y + 36}`}
          tone="purple"
        />
      ))}
      {nodes.map((n) => (
        <g
          key={n.id}
          transform={`translate(${n.x} ${n.y})`}
          className={`v2-graph-node ${n.id === "mla" ? "core" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={`学习${chapters.find((c) => c.id === n.id)?.title}`}
          onClick={() => p.onNavigate(n.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") p.onNavigate(n.id);
          }}
        >
          <rect width="190" height="72" rx="6" />
          <text x="95" y="31" textAnchor="middle">
            {chapters.find((c) => c.id === n.id)?.title}
          </text>
          <text x="95" y="54" textAnchor="middle" className="v2-svg-sub">
            {n.id.toUpperCase()} ↗
          </text>
        </g>
      ))}
      <text x="400" y="411" textAnchor="middle" className="v2-svg-sub">
        数学 → 表示 → 架构 → 缓存与计算 → 系统效率
      </text>
    </Svg>
  );
}

function SceneContent(props: Props) {
  switch (props.scene) {
    case "architecture":
      return <Architecture {...props} />;
    case "matrix":
      return <MatrixScene {...props} />;
    case "attention":
      return <AttentionScene {...props} />;
    case "cache":
    case "compare":
      return <CacheScene {...props} />;
    case "mla":
      return <MLADiagram {...props} />;
    case "rope":
      return <RopeScene {...props} />;
    case "absorption":
      return <AbsorptionScene {...props} />;
    case "moe":
      return <MoEScene {...props} />;
    case "balance":
    case "infra":
      return <InfraScene {...props} />;
    case "training":
      return <TrainingScene {...props} />;
    case "alignment":
      return <AlignmentScene {...props} />;
    case "experiments":
      return <ExperimentScene />;
    case "graph":
      return <GraphScene {...props} />;
  }
}

function Slider({
  name,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="v2-slider">
      <span>
        {name}
        <b>{value.toLocaleString()}</b>
      </span>
      <input
        aria-label={name}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function SimulationControls({
  scene,
  sim,
  onChange,
}: {
  scene: Scene;
  sim: Simulation;
  onChange: (s: Simulation) => void;
}) {
  const set = (key: keyof Simulation, value: number) =>
    onChange({ ...sim, [key]: value });
  const setCache = (key: keyof CacheConfig, value: number) =>
    onChange({ ...sim, cache: { ...sim.cache, [key]: value } });
  if (["architecture", "training", "graph", "experiments"].includes(scene))
    return (
      <div className="v2-scene-guidance">
        {scene === "experiments"
          ? "通过指标、模型筛选、排序和表格控件，探索原论文证据。"
          : scene === "graph"
            ? "点击知识图谱中的节点，跳转到相应原理与数值实验。"
            : scene === "training"
              ? "训练超参数为论文报告值。逐步切换阅读数据、优化器、并行与长上下文扩展。"
              : "点击架构节点固定完整解释；从下方步骤进入设计动机、性能条件与学习路径。"}
      </div>
    );
  return (
    <div className="v2-simulation-controls">
      <div className="v2-control-label">
        <span>◈ 参数实验室</span>
        <small>修改参数，实时重算</small>
      </div>
      <div className="v2-parameter-grid">
        {scene === "cache" || scene === "compare" ? (
          <>
            <Slider
              name="Batch size"
              min={1}
              max={64}
              value={sim.cache.batch}
              onChange={(v) => setCache("batch", v)}
            />
            <Slider
              name="Sequence length"
              min={1024}
              max={131072}
              step={1024}
              value={sim.cache.sequence}
              onChange={(v) => setCache("sequence", v)}
            />
            <Slider
              name="Layers"
              min={1}
              max={80}
              value={sim.cache.layers}
              onChange={(v) => setCache("layers", v)}
            />
            <Slider
              name="Attention heads"
              min={8}
              max={128}
              step={8}
              value={sim.cache.heads}
              onChange={(v) =>
                onChange({
                  ...sim,
                  cache: {
                    ...sim.cache,
                    heads: v,
                    kvHeads:
                      [1, 2, 4, 8, 16, 32, 64, 128]
                        .filter((k) => k <= sim.cache.kvHeads && v % k === 0)
                        .pop() ?? 1,
                  },
                })
              }
            />
            <label className="v2-select-label">
              KV heads (GQA)
              <select
                aria-label="KV heads (GQA)"
                value={sim.cache.kvHeads}
                onChange={(e) => setCache("kvHeads", Number(e.target.value))}
              >
                {Array.from({ length: sim.cache.heads }, (_, i) => i + 1)
                  .filter((v) => sim.cache.heads % v === 0)
                  .map((v) => (
                    <option key={v} value={v}>
                      {v} KV heads
                    </option>
                  ))}
              </select>
            </label>
            <Slider
              name="Head dimension"
              min={32}
              max={256}
              step={32}
              value={sim.cache.headDim}
              onChange={(v) => setCache("headDim", v)}
            />
            <Slider
              name="KV latent dimension"
              min={64}
              max={1024}
              step={64}
              value={sim.cache.latent}
              onChange={(v) => setCache("latent", v)}
            />
            <label className="v2-select-label">
              Data type
              <select
                aria-label="缓存数据精度"
                value={sim.cache.bytes}
                onChange={(e) => setCache("bytes", Number(e.target.value))}
              >
                <option value={2}>BF16 / FP16 · 2 bytes</option>
                <option value={4}>FP32 · 4 bytes</option>
                <option value={1}>INT8 · payload only</option>
                <option value={0.75}>6-bit · payload only</option>
              </select>
            </label>
            <Slider
              name="GPU capacity (GiB)"
              min={16}
              max={192}
              step={8}
              value={sim.capacity}
              onChange={(v) => set("capacity", v)}
            />
          </>
        ) : scene === "rope" ? (
          <>
            <Slider
              name="Query position"
              min={0}
              max={32}
              value={sim.position}
              onChange={(v) => set("position", v)}
            />
            <Slider
              name="Key position"
              min={0}
              max={32}
              value={sim.keyPosition}
              onChange={(v) => set("keyPosition", v)}
            />
            <Slider
              name="Rotation frequency"
              min={0.05}
              max={2}
              step={0.05}
              value={sim.frequency}
              onChange={(v) => set("frequency", v)}
            />
          </>
        ) : scene === "moe" || scene === "balance" || scene === "infra" ? (
          <>
            <Slider
              name={
                scene === "moe" ? "Top-K · 教学专家数 12" : "Top-K · 专家数 160"
              }
              min={1}
              max={6}
              value={sim.topK}
              onChange={(v) => set("topK", v)}
            />
            <Slider
              name="Router seed"
              min={1}
              max={20}
              value={sim.seed}
              onChange={(v) => set("seed", v)}
            />
          </>
        ) : scene === "mla" ? (
          <>
            <Slider
              name="Hidden size · 教学"
              min={4}
              max={16}
              value={sim.hidden}
              onChange={(v) =>
                onChange({ ...sim, hidden: v, rank: Math.min(sim.rank, v) })
              }
            />
            <Slider
              name="Latent rank · 教学"
              min={1}
              max={sim.hidden}
              value={sim.rank}
              onChange={(v) => set("rank", v)}
            />
            <span className="v2-sim-explainer">
              模型图标注完整 V2 维度；底部数值用小矩阵演示。
            </span>
          </>
        ) : (
          <>
            <Slider
              name={
                scene === "alignment"
                  ? "Reward sample seed"
                  : "Tensor seed · 教学"
              }
              min={1}
              max={20}
              value={sim.seed}
              onChange={(v) => set("seed", v)}
            />
            <span className="v2-sim-explainer">
              {scene === "architecture"
                ? "可切换步骤并悬停架构节点，深入了解每个模块。"
                : scene === "training"
                  ? "学习率与训练规模为论文报告值，随机输入不改变这些数据。"
                  : "所有教学数值由当前种子确定，可重复验证。"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function Visualization(props: Props) {
  return (
    <SelectedConcept.Provider value={props.selected}>
      <SceneContent {...props} />
    </SelectedConcept.Provider>
  );
}
