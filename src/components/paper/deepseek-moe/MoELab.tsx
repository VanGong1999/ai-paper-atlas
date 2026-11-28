import { isolationBudget } from "../../../data/papers/deepseek-moe/evidence";
import { useMemo, useState } from "react";
import { ConceptHelp } from "../ConceptHelp";
import { moeConcepts } from "../../../data/papers/deepseek-moe/content";
import {
  combinations,
  expertBalance,
  deviceBalance,
  moeForward,
} from "../../../data/papers/deepseek-moe/math";

export function MoELab({ kind, step }: { kind: string; step: number }) {
  const [count, setCount] = useState(16),
    [topK, setTopK] = useState(2),
    [shared, setShared] = useState(kind === "shared" ? 1 : 0),
    [seed, setSeed] = useState(1),
    [input, setInput] = useState([0.2, 0.8, -0.3]),
    [multiplier, setMultiplier] = useState(4),
    [devices, setDevices] = useState(4);
  const budget =
    kind === "shared"
      ? isolationBudget(count, topK, shared)
      : { routed: count, topK };
  const r = useMemo(
    () => moeForward(input, budget.routed, budget.topK, shared, seed),
    [input, budget.routed, budget.topK, shared, seed],
  );
  if (kind === "segmentation")
    return (
      <div className="moe-lab">
        <div className="moe-lab-label">
          同一专家 FFN 预算 · Figure 2b 的教学重绘
          <span>参数 / FLOPs 守恒只针对专家部分</span>
        </div>
        <div className="moe-segment-controls">
          细分倍率{" "}
          {([1, 2, 4] as const).map((m) => (
            <button
              key={m}
              className={multiplier === m ? "active" : ""}
              onClick={() => setMultiplier(m)}
            >
              ×{m}
            </button>
          ))}
        </div>
        <div className="moe-segmentation">
          <div>
            <h3>16 个宽专家 · 激活 2 个</h3>
            <div className="moe-wide-experts">
              {Array.from({ length: 16 }, (_, i) => (
                <ConceptHelp
                  key={i}
                  concept={moeConcepts.expert}
                  className={i < 2 ? "active" : ""}
                >
                  <span>E{i + 1}</span>
                </ConceptHelp>
              ))}
            </div>
            <p>
              单专家中间宽度 <b>1×</b> · 激活总宽度 <b>2×</b>
            </p>
          </div>
          <b className="moe-segment-arrow">→</b>
          <div>
            <h3>
              {16 * multiplier} 个窄专家 · 激活 {2 * multiplier} 个
            </h3>
            <div className="moe-fine-experts">
              {Array.from({ length: 16 * multiplier }, (_, i) => (
                <ConceptHelp
                  key={i}
                  concept={moeConcepts.expert}
                  className={i < 2 * multiplier ? "active" : ""}
                >
                  <span>{i + 1}</span>
                </ConceptHelp>
              ))}
            </div>
            <p>
              单专家宽度 <b>1/{multiplier}</b> · 激活总宽度 <b>2×</b>
            </p>
          </div>
        </div>
        <div className="moe-combination-row">
          <ConceptHelp concept={moeConcepts.combination}>
            <small>原组合空间 C(16,2)</small>
            <strong>120</strong>
          </ConceptHelp>
          <span>→</span>
          <ConceptHelp concept={moeConcepts.combination}>
            <small>
              C({16 * multiplier},{2 * multiplier}) · 实际整数计算
            </small>
            <strong>
              {BigInt(
                combinations(16 * multiplier, 2 * multiplier),
              ).toLocaleString()}
            </strong>
          </ConceptHelp>
        </div>
        <p className="moe-clarification">
          组合数量不代表有效知识数量或能力提升倍数。原论文 Figure 3
          的真实消融结果可在“消融与共享比例”核对。
        </p>
      </div>
    );
  const batch = Array.from({ length: 20 }, (_, i) =>
      moeForward(
        input.map((v, j) => v + Math.sin(i + j) * 0.4),
        count,
        topK,
        0,
        seed,
      ),
    ),
    balance = expertBalance(
      batch.map((r) => r.scores),
      batch.map((r) => r.selected),
      topK,
      0.01,
    ),
    device = deviceBalance(balance, devices, 0.05);
  return (
    <div className="moe-lab">
      <div className="moe-lab-label">
        {kind === "balance"
          ? "20 个教学 Token 的真实路由统计"
          : "实时计算：输入 → Router → Top-K → FFN → 聚合"}
        <span>3 维教学向量 · 非预训练权重</span>
      </div>
      <div className="moe-flow-pipeline">
        <ConceptHelp
          concept={moeConcepts.input}
          className={`moe-input-node ${step === 0 ? "current" : ""}`}
        >
          <small>INPUT</small>
          <b>uₜ</b>
          <code>[{input.map((v) => v.toFixed(2)).join(", ")}]</code>
        </ConceptHelp>
        <span className="moe-arrow">→</span>
        <ConceptHelp
          concept={moeConcepts.router}
          className={`moe-router-node ${step === 1 || step === 2 ? "current" : ""}`}
        >
          <small>ROUTER</small>
          <b>z → Softmax → Top-{budget.topK}</b>
          <code>
            {budget.routed} scores · {budget.topK} active gates
          </code>
        </ConceptHelp>
        <span className="moe-arrow">→</span>
        <ConceptHelp
          concept={moeConcepts.output}
          className={`moe-output-node ${step === 4 ? "current" : ""}`}
        >
          <small>AGGREGATE + RESIDUAL</small>
          <b>hₜ = uₜ + S + R</b>
          <code>[{r.output.map((v) => v.toFixed(3)).join(", ")}]</code>
        </ConceptHelp>
      </div>
      <div className="moe-routing-labels">
        <span>专家 · 亲和度 sᵢ · 稀疏门 gᵢ</span>
        <span>选中分支才执行 FFN · 点击固定详细原理</span>
      </div>
      <div className="moe-expert-grid">
        {r.scores.map((score, i) => (
          <ConceptHelp
            key={i}
            concept={{
              ...moeConcepts.expert,
              title: `路由专家 E${i + 1}${r.selected.includes(i) ? " · 当前激活" : " · 未激活"}`,
              example: `当前 logit=${r.logits[i].toFixed(4)}，全体 Softmax 概率=${score.toFixed(5)}，门值=${r.gates[i].toFixed(5)}。${r.outputs[i] ? `FFN 实际输出 [${r.outputs[i]!.map((v) => v.toFixed(4)).join(", ")}]。` : "此分支未执行 FFN。"}`,
            }}
            className={`moe-expert-cell ${r.selected.includes(i) ? "active" : ""}`}
          >
            <span>
              E{String(i + 1).padStart(2, "0")}
              <em>{r.selected.includes(i) ? "✓ active" : "idle"}</em>
            </span>
            <div className="moe-affinity-track">
              <i
                style={{ width: `${(score / Math.max(...r.scores)) * 100}%` }}
              />
            </div>
            <code>
              s={score.toFixed(3)} · g={r.gates[i].toFixed(3)}
            </code>
            <small>
              {r.outputs[i]
                ? `FFN: [${r.outputs[i]!.slice(0, 2)
                    .map((v) => v.toFixed(2))
                    .join(",")}…]`
                : "FFN 未执行"}
            </small>
          </ConceptHelp>
        ))}
      </div>
      <div className="moe-output-paths">
        <ConceptHelp concept={moeConcepts.shared} className="moe-shared-output">
          <span>共享分支 · 始终激活 {shared} 个</span>
          <code>S=[{r.sharedOutput.map((v) => v.toFixed(4)).join(", ")}]</code>
        </ConceptHelp>
        <ConceptHelp concept={moeConcepts.output} className="moe-routed-output">
          <span>
            路由加权和 · Σg = {r.gates.reduce((a, b) => a + b, 0).toFixed(4)}
          </span>
          <code>R=[{r.routedOutput.map((v) => v.toFixed(4)).join(", ")}]</code>
        </ConceptHelp>
      </div>
      {kind === "balance" && (
        <div className="moe-balance-panel">
          <ConceptHelp
            concept={moeConcepts.balance}
            className="moe-balance-loss"
          >
            <small>α=.01 · Eq. 12–14</small>
            <strong>LExpBal={balance.loss.toFixed(6)}</strong>
          </ConceptHelp>
          <div className="moe-load-counts">
            {balance.count.map((c, i) => (
              <ConceptHelp
                key={i}
                concept={{
                  ...moeConcepts.balance,
                  title: `E${i + 1} 的路由负载`,
                  example: `20 个 Token 中被选 ${c} 次，fᵢ=${balance.frequency[i].toFixed(4)}，Pᵢ=${balance.probability[i].toFixed(4)}。`,
                }}
              >
                <i
                  style={{
                    height: `${Math.max(2, (c / Math.max(1, ...balance.count)) * 60)}px`,
                  }}
                />
                <span>{i + 1}</span>
                <b>{c}</b>
              </ConceptHelp>
            ))}
          </div>
          <small>
            柱高是实际选中次数，不是实测 GPU 利用率；总分派数 = 20 × {topK} ={" "}
            {20 * topK}。
          </small>
          <div className="moe-device-balance">
            <label>均匀放置到设备
              <select aria-label="MoE 均衡设备数" value={devices} onChange={e => setDevices(Number(e.target.value))}>
                {[1, 2, 4, 8].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <ConceptHelp concept={{...moeConcepts.balance,title:"设备负载均衡 · Eq. 15–17",what:"同一设备上的专家共享计算资源。这里把相邻专家均匀分组，再从上方真实路由结果计算设备负载。",why:"单个专家不必一样忙，但每张卡的总体负载应接近，否则整步需要等待最忙的卡。",how:"每组 f′ 是该设备专家 f 的平均值；P′ 是这些专家 P 的总和；设备损失为 α₂Σf′P′。",example:`${count} 个路由专家分到 ${devices} 个设备，每组 ${count/devices} 个。教学 α₂=.05，损失=${device.loss.toFixed(6)}。`,caution:"这是按原公式计算的教学路由统计，不是 GPU 实测。上方专家 α=.01 也是教学值；145B 实验采用 α₁=.003、α₂=.05。"}} className="moe-balance-loss">
              <small>α₂=.05 · Eq. 15–17</small><strong>LDevBal={device.loss.toFixed(6)}</strong>
            </ConceptHelp>
            <div className="moe-device-cards">
              {device.count.map((count, d) => <ConceptHelp key={d} concept={{...moeConcepts.balance,title:`设备 ${d+1}：汇总 ${r.scores.length/devices} 个专家`,what:"这台设备承担其所放置专家的全部分派。",how:`f′=${device.frequency[d].toFixed(4)}（组内平均），P′=${device.probability[d].toFixed(4)}（组内求和），本组损失贡献=${(.05*device.frequency[d]*device.probability[d]).toFixed(6)}。`,example:`本批次收到 ${count} 次专家分派；一次 Token 可激活同一设备上的多个专家。`}}>
                <small>DEVICE {d+1}</small><b>{count} 次分派</b><code>f′ {device.frequency[d].toFixed(3)} · P′ {device.probability[d].toFixed(3)}</code>
              </ConceptHelp>)}
            </div>
          </div>
        </div>
      )}
      <div className="moe-lab-controls">
        <label>
          {kind === "shared" ? "总专家预算 mN" : "路由专家数"}
          <select
            aria-label="MoE 路由专家数"
            value={count}
            onChange={(e) => {
              setCount(Number(e.target.value));
              setTopK((k) => Math.min(k, Number(e.target.value)));
            }}
          >
            {[8, 16, 32, 64].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          {kind === "shared" ? "总激活预算 mK" : "Top-K"}
          <select
            aria-label="MoE Top-K"
            value={topK}
            onChange={(e) => {
              const value = Number(e.target.value);
              setTopK(value);
              setShared((s) => Math.min(s, value - 1));
            }}
          >
            {Array.from({ length: Math.min(8, count) }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        {kind === "shared" && (
          <label>
            共享数
            <select
              aria-label="MoE 共享专家数"
              value={shared}
              onChange={(e) => setShared(Number(e.target.value))}
            >
              {[0, 1, 2]
                .filter((n) => n < topK)
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          输入第一维{" "}
          <input
            aria-label="MoE 输入第一维"
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={input[0]}
            onChange={(e) =>
              setInput((v) => [Number(e.target.value), v[1], v[2]])
            }
          />
          <b>{input[0].toFixed(2)}</b>
        </label>
        <button onClick={() => setSeed((s) => (s % 20) + 1)}>
          换一组教学权重 ↻
        </button>
      </div>
      <p className="moe-clarification">
        {kind === "shared" && <>共享隔离前后保持总专家预算 {count}、总激活预算 {topK}：当前 {shared} 个共享 + {budget.routed} 个路由，其中路由激活 {budget.topK} 个。 </>}
        可调数值用于验证计算。2B / 16B / 145B
        的真实配置见正文与原表，不把当前教学设置冒充论文模型。
      </p>
    </div>
  );
}
