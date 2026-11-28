import { filterEvidenceRows } from "../../../data/papers/deepseek-moe/evidence";
import { useState } from "react";
import source from "../../../data/papers/deepseek-moe/source-inventory.json";
import { moeSource } from "../../../data/papers/deepseek-moe/content";
import { Formula } from "../deepseek-v2/Formula";
const clean = (text: string) => text.replace(/\\+times\s*/g, "×");
export function MoEFormulas() {
  return (
    <div className="moe-equations">
      {source.formulas.map((f) => (
        <section key={f.number}>
          <header>
            <b>Eq. {f.number}</b>
            <span>
              {f.number <= 5
                ? "Transformer / 传统 MoE"
                : f.number <= 8
                  ? "细粒度切分"
                  : f.number <= 11
                    ? "共享隔离"
                    : f.number <= 14
                      ? "专家均衡"
                      : "设备均衡"}
            </span>
            <a
              href={`${moeSource}#${f.anchor}`}
              target="_blank"
              rel="noreferrer"
            >
              原文 ↗
            </a>
          </header>
          <Formula math={f.latex.replaceAll("\\mathds", "\\mathbb")} />
        </section>
      ))}
    </div>
  );
}
export function MoEEvidence({ initialTable = 1 }: { initialTable?: number }) {
  const [number, setNumber] = useState(initialTable),
    [metric, setMetric] = useState(""),
    [view, setView] = useState<"chart" | "table">("chart"),
    [sort, setSort] = useState(false),
    [query, setQuery] = useState("");
  const table = source.tables.find((t) => t.number === number)!,
    headers = table.rows[0];
  const metrics = table.rows.filter(
      (r) =>
        /(Acc|Loss|BPB|EM|Pass)/.test(r[0].text) &&
        r.slice(2).every((c) => Number.isFinite(Number(c.text))),
    ),
    row = metrics.find((r) => r[0].text === metric) ?? metrics[0];
  const bars = row
      ? row.slice(2).map((c, i) => ({
          name: headers[i + 2]?.text ?? `模型 ${i + 1}`,
          value: Number(c.text),
        }))
      : [],
    isLoss = !!row && /(Loss|BPB)/.test(row[0].text);
  if (sort)
    bars.sort((a, b) => (isLoss ? a.value - b.value : b.value - a.value));
  const max = Math.max(1, ...bars.map((b) => b.value)),
    visible = filterEvidenceRows(table.rows, query);
  return (
    <div className="moe-evidence">
      <div className="moe-evidence-controls">
        <label>
          原始表格
          <select
            aria-label="DeepSeekMoE 原表"
            value={number}
            onChange={(e) => {
              setNumber(Number(e.target.value));
              setMetric("");
              setQuery("");
            }}
          >
            {source.tables.map((t) => (
              <option key={t.number} value={t.number}>
                Table {t.number} · {t.caption.slice(0, 50)}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
        >
          {view === "chart" ? "原始完整表" : "交互图表"}
        </button>
        <a
          href={`${moeSource}#${table.anchor}`}
          target="_blank"
          rel="noreferrer"
        >
          来源 ↗
        </a>
      </div>
      {view === "chart" && row ? (
        <>
          <div className="moe-evidence-controls">
            <label>
              指标
              <select
                aria-label="DeepSeekMoE 指标"
                value={row[0].text}
                onChange={(e) => setMetric(e.target.value)}
              >
                {metrics.map((r) => (
                  <option key={r[0].text} value={r[0].text}>
                    {r[0].text}
                  </option>
                ))}
              </select>
            </label>
            <span>
              {row[1].text} · {isLoss ? "越低越好" : "越高越好"}
            </span>
            <button onClick={() => setSort((v) => !v)}>
              {sort ? "恢复原表顺序" : "按指标排序"}
            </button>
          </div>
          <div className="moe-benchmark-bars">
            {bars.map((b) => (
              <div
                key={b.name}
                className={b.name.includes("DeepSeekMoE") ? "highlight" : ""}
                title={`${clean(b.name)} · ${row[0].text}: ${b.value} · ${row[1].text} · Table ${number}`}
              >
                <span>{clean(b.name)}</span>
                <div>
                  <i style={{ width: `${(b.value / max) * 100}%` }} />
                </div>
                <b>{b.value}</b>
              </div>
            ))}
          </div>
          <p className="moe-clarification">
            数据逐格来自原论文。横向只比较同一指标；Loss/BPB
            与准确率的方向不同。不使用虚构“综合归一化分数”。
          </p>
        </>
      ) : (
        <>
          <input
            className="moe-table-search"
            aria-label="搜索 DeepSeekMoE 原表"
            placeholder="筛选表格行…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="moe-table-overflow">
            <table>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) =>
                      i === 0 ? (
                        <th key={j} colSpan={c.colSpan} rowSpan={c.rowSpan}>
                          {clean(c.text)}
                        </th>
                      ) : (
                        <td key={j} colSpan={c.colSpan} rowSpan={c.rowSpan}>
                          {clean(c.text)}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <details className="moe-evidence-conditions">
        <summary>实验条件、比较范围与局限</summary>
        <p>
          {number <= 2 || number === 8 || number === 9
            ? "2B 验证规模：100B 训练 Token、相同语料与超参数。基线的激活参数和总参数需同时看，尤其扩大 GShard 与 Dense 的比较。"
            : number <= 4
              ? "16B Base：2T Token；与 DeepSeek 7B 使用同一语料，与 LLaMA2 7B 数据分布不同。激活参数约 2.8B，理论 FLOPs 比值不是实测吞吐。"
              : number === 5
                ? "Chat：三个模型使用同一 1.4M SFT 数据。LLaMA2 SFT 是作者微调基线，非官方 LLaMA2 Chat。"
                : number === 6
                  ? "145B 初步实验：所有模型只比较到 245B Token。142B 半激活与 145B 是不同配置，18.2% 与 28.5% 分别对应不同模型。"
                  : number === 10
                    ? "约 13B 规模的架构对比，训练 100B Token；不能混入 16B 的 2T Token 结果。"
                    : "三个规模的超参数总览，路由/共享数、层数、隐藏维与训练设置必须按同一行解读。"}
        </p>
        <p>{table.caption}</p>
      </details>
    </div>
  );
}
