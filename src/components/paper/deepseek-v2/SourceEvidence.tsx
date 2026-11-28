import { useMemo, useState } from "react";
import source from "../../../data/papers/deepseek-v2/source-inventory.json";
import { chapters, paperUrl } from "../../../data/papers/deepseek-v2/content";
import { Formula } from "./Formula";

export function OriginalEquations({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const groups = [
    { id: "attention", name: "MHA · 1–8", min: 1, max: 8 },
    { id: "mla", name: "低秩压缩 · 9–13", min: 9, max: 13 },
    { id: "rope", name: "解耦 RoPE · 14–19", min: 14, max: 19 },
    { id: "moe", name: "MoE · 20–22", min: 20, max: 22 },
    { id: "routing", name: "均衡损失 · 23–31", min: 23, max: 31 },
    { id: "alignment", name: "GRPO · 32–36", min: 32, max: 36 },
    { id: "formulas", name: "完整 MLA · 37–47", min: 37, max: 47 },
  ];
  return (
    <div className="v2-original-equations">
      <div className="v2-section-caption">
        原论文 47 个编号公式<span>逐式提取自 arXiv v5</span>
      </div>
      <div className="v2-evidence-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          全部
        </button>
        {groups.map((g) => (
          <button
            key={g.id}
            className={filter === g.id ? "active" : ""}
            onClick={() => setFilter(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>
      {source.formulas
        .filter(
          (f) =>
            filter === "all" ||
            groups.some(
              (g) => g.id === filter && f.number >= g.min && f.number <= g.max,
            ),
        )
        .map((f) => {
          const group = groups.find(
            (g) => f.number >= g.min && f.number <= g.max,
          )!;
          return (
            <section key={f.number}>
              <div>
                <b>({f.number})</b>
                <button onClick={() => onNavigate(group.id)}>
                  {chapters.find((c) => c.id === group.id)?.title} →
                </button>
                <a
                  href={`${paperUrl}#${f.anchor}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  原文 ↗
                </a>
              </div>
              <Formula
                math={f.latex
                  .replaceAll("\\mathds", "\\mathbb")
                  .replaceAll("\\color[rgb]{0,0,1}", "")}
              />
            </section>
          );
        })}
    </div>
  );
}
const descriptions: Record<number, string> = {
  1: "同一 Token 的理论缓存元素数。能力标签是作者实验总结，不是通用定理。",
  2: "Base 模型在同一内部评估框架下比较。shots 与指标以原表为准，BPB 越低越好，其他指标通常越高越好。",
  3: "Chat 模型标准评测，SFT 与 RL 存在任务间取舍。不同基准的评测单位与提示不同。",
  4: "英文开放生成：MT-Bench 与 AlpacaEval 2.0。LC win rate 为长度控制后的胜率，不等于普通准确率。",
  5: "中文开放生成 AlignBench，由 GPT-4-0613 评分。维度分数、总体分数与百分比准确率不可混用。",
  6: "V2-Lite Base 与较小模型对比，训练 Token、参数量和架构不同。",
  7: "V2-Lite Chat 对比；这是 15.7B 模型，不是完整 236B V2。",
  8: "约 7B Dense，均训练 1.33T Token；通过调整层数对齐参数规模，不能当作所有结构变量完全相同。",
  9: "两种规模的 MLA/MHA 消融，表中激活参数、总参数与缓存预算同时列出。小模型训练 1.33T，大模型训练 420B Token。",
  10: "争议题的人类标注一致性。较低一致性说明区域文化与评价标签可能产生偏差。",
  11: "补充数学与代码评测，保留原始模型版本和任务划分。",
};
export function SourceTables() {
  const [number, setNumber] = useState(2),
    [query, setQuery] = useState(""),
    [chart, setChart] = useState(false),
    [column, setColumn] = useState(0),
    [descending, setDescending] = useState(false);
  const table = source.tables.find((t) => t.number === number)!;
  const rows = table.rows.filter(
    (r) =>
      !query ||
      r.some((c) => c.text.toLowerCase().includes(query.toLowerCase())),
  );
  const numeric = useMemo(
    () =>
      rows
        .map((r) => ({
          name: r[0]?.text ?? "",
          values: r
            .slice(1)
            .filter((c) => /^-?\d+(\.\d+)?$/.test(c.text))
            .map((c) => Number(c.text)),
        }))
        .filter((r) => r.values.length > 0),
    [rows],
  );
  const numericCount = Math.max(0, ...numeric.map((r) => r.values.length)),
    selectedColumn = Math.min(column, Math.max(0, numericCount - 1));
  const plot = numeric
    .filter((r) => r.values.length > selectedColumn)
    .map((r) => ({ name: r.name, value: r.values[selectedColumn] }));
  if (descending) plot.sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...plot.map((r) => Math.abs(r.value)));
  return (
    <section className="v2-source-tables">
      <div className="v2-section-caption">
        全部原始表格 <span>37 tables · 可搜索、绘图与追溯</span>
      </div>
      <div className="v2-evidence-toolbar">
        <select
          aria-label="选择论文原始表格"
          value={number}
          onChange={(e) => {
            setNumber(Number(e.target.value));
            setQuery("");
            setColumn(0);
            setChart(false);
          }}
        >
          {source.tables.map((t) => (
            <option key={t.number} value={t.number}>
              Table {t.number} · {t.caption.slice(0, 70)}
            </option>
          ))}
        </select>
        <input
          aria-label="搜索原始表格"
          placeholder="筛选表内内容…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {numericCount > 0 && (
          <button onClick={() => setChart((x) => !x)}>
            {chart ? "▤ 表格" : "▥ 数值绘图"}
          </button>
        )}
      </div>
      <div className="v2-source-note">
        {descriptions[number] ??
          "附录 G 的评估提示格式示例。它展示输入、few-shot 模板与答案组织方式，不是新增实验得分。"}{" "}
        <a
          href={`${paperUrl}#${table.anchor}`}
          target="_blank"
          rel="noreferrer"
        >
          Table {number} 原文 ↗
        </a>
      </div>
      {chart && numericCount > 0 ? (
        <>
          <div className="v2-evidence-toolbar">
            <label>
              数值列{" "}
              <select
                aria-label="原表数值列"
                value={selectedColumn}
                onChange={(e) => setColumn(Number(e.target.value))}
              >
                {Array.from({ length: numericCount }, (_, i) => (
                  <option value={i} key={i}>
                    第 {i + 1} 个数值（顺序同原行）
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => setDescending((x) => !x)}>
              {descending ? "↓ 按数值排序" : "⇅ 原始行序"}
            </button>
          </div>
          <p className="v2-chart-caution">
            绘图按每行数值出现顺序提取；不同指标量纲可能不同。解释结论前请核对原始表头。
          </p>
          <div className="v2-raw-chart">
            {plot.map((r, i) => (
              <div key={i} title={`${r.name}: ${r.value}`}>
                <span>{r.name}</span>
                <div>
                  <i style={{ width: `${(Math.abs(r.value) / max) * 100}%` }} />
                </div>
                <b>{r.value}</b>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="v2-source-table-scroll">
          <table className="v2-data-table">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) =>
                    c.header ? (
                      <th key={j} colSpan={c.colSpan} rowSpan={c.rowSpan}>
                        {number < 12 && c.text.includes("\\") ? (
                          <Formula
                            block={false}
                            math={c.text.replaceAll("\\penalty", "")}
                          />
                        ) : (
                          c.text
                        )}
                      </th>
                    ) : (
                      <td key={j} colSpan={c.colSpan} rowSpan={c.rowSpan}>
                        {number < 12 && c.text.includes("\\") ? (
                          <Formula
                            block={false}
                            math={c.text.replaceAll("\\penalty", "")}
                          />
                        ) : (
                          c.text
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="v2-empty-search">没有匹配的数据行。</p>
          )}
        </div>
      )}
      <p className="v2-table-caption">{table.caption}</p>
    </section>
  );
}
