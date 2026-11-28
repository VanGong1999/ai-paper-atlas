import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ConceptHelp, ConceptHelpScope } from "../components/paper/ConceptHelp";
import { SourceArchive } from "../components/paper/SourceArchive";
import { MoELab } from "../components/paper/deepseek-moe/MoELab";
import {
  MoEEvidence,
  MoEFormulas,
} from "../components/paper/deepseek-moe/MoEEvidence";
import {
  moeConcepts,
  moeLessons,
  moePdf,
  moeSource,
  moeSourceEntries,
} from "../data/papers/deepseek-moe/content";
import pages from "../data/papers/deepseek-moe/source-pages.json";
import "../styles/deepseek-moe.css";
const steps = [
  "输入隐藏状态",
  "亲和度与 Softmax",
  "Top-K 稀疏门",
  "选中 FFN 执行",
  "聚合与残差",
];
const presets = [
  {
    name: "2B 验证",
    total: "2.0B",
    active: "0.3B",
    layers: 9,
    hidden: 1280,
    heads: 10,
    shared: 1,
    routed: 63,
    topK: 7,
    tokens: "100B",
    context: "2K",
  },
  {
    name: "16B Base",
    total: "16.4B",
    active: "2.8B",
    layers: 28,
    hidden: 2048,
    heads: 16,
    shared: 2,
    routed: 64,
    topK: 6,
    tokens: "2T",
    context: "4K",
  },
  {
    name: "145B 初步",
    total: "144.6B",
    active: "22.2B",
    layers: 62,
    hidden: 4096,
    heads: 32,
    shared: 4,
    routed: 128,
    topK: 12,
    tokens: "245B",
    context: "4K",
  },
];
function Architecture() {
  const [preset, setPreset] = useState(1),
    m = presets[preset];
  return (
    <div className="moe-architecture">
      <header>
        <span>原始模型配置 · Table 7</span>
        <select
          aria-label="DeepSeekMoE 配置"
          value={preset}
          onChange={(e) => setPreset(Number(e.target.value))}
        >
          {presets.map((m, i) => (
            <option key={m.name} value={i}>
              {m.name}
            </option>
          ))}
        </select>
      </header>
      <div className="moe-config-stats">
        <div>
          <small>总参数</small>
          <b>{m.total}</b>
        </div>
        <div>
          <small>每 Token 激活</small>
          <b>{m.active}</b>
        </div>
        <div>
          <small>训练 Token</small>
          <b>{m.tokens}</b>
        </div>
        <div>
          <small>上下文</small>
          <b>{m.context}</b>
        </div>
      </div>
      <div className="moe-architecture-flow">
        <ConceptHelp concept={moeConcepts.input} className="moe-embedding">
          <small>TOKEN → EMBEDDING</small>
          <strong>[B, T, {m.hidden}]</strong>
          <span>每个 Token 得到 d 维特征</span>
        </ConceptHelp>
        <div className="moe-architecture-down">↓</div>
        <div className="moe-transformer-block">
          <span className="moe-block-caption">
            TRANSFORMER × {m.layers} LAYERS
          </span>
          <ConceptHelp
            concept={{
              ...moeConcepts.input,
              title: "原始 MoE 的 Multi-Head Attention",
              what: "在同一序列的不同位置之间读取和混合信息。DeepSeekMoE 原论文采用标准 MHA。",
              how: "Q/K/V 投影 → 因果注意力 → 输出投影 → 加残差。每头维度 128。",
              shape: `${m.heads} heads × 128 dim · hidden ${m.hidden}`,
              caution:
                "这里不是 V2 的 MLA，不能把潜变量缓存路径放进这篇原始论文。",
            }}
            className="moe-attention-box"
          >
            <b>Multi-Head Attention</b>
            <code>{m.heads} heads · dim/head 128</code>
          </ConceptHelp>
          <div className="moe-architecture-down">↓ RMSNorm / residual</div>
          <div className="moe-two-paths">
            <ConceptHelp
              concept={moeConcepts.shared}
              className="moe-shared-box"
            >
              <small>ALWAYS ON</small>
              <b>{m.shared} 个共享专家</b>
              <span>每个 Token 都执行</span>
            </ConceptHelp>
            <span>＋</span>
            <ConceptHelp
              concept={moeConcepts.router}
              className="moe-routed-box"
            >
              <small>CONDITIONAL COMPUTE</small>
              <b>
                {m.topK} / {m.routed} 个路由专家
              </b>
              <span>先计算分数，再执行 Top-K</span>
            </ConceptHelp>
          </div>
          <ConceptHelp
            concept={moeConcepts.output}
            className="moe-residual-box"
          >
            <b>Σ shared + Σ gate × routed + input</b>
            <code>输出 [B,T,{m.hidden}]</code>
          </ConceptHelp>
        </div>
        <div className="moe-architecture-down">↓</div>
        <div className="moe-lm-head">
          最终归一化 → 词表投影 → 下一个 Token 概率
        </div>
      </div>
      <p className="moe-clarification">
        {preset === 0
          ? "2B 验证将全部 FFN 换为 MoE。"
          : "首层 FFN 保持 Dense，其余层采用 MoE。"}{" "}
        模型形状为原论文配置；本图不执行完整预训练模型。
      </p>
    </div>
  );
}
export function DeepSeekMoEPage() {
  const [params, setParams] = useSearchParams(),
    id = params.get("chapter") ?? "overview",
    lesson = moeLessons.find((l) => l.id === id) ?? moeLessons[0];
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [search, setSearch] = useState(""),
    [navOpen, setNavOpen] = useState(false);
  const change = (next: string) => {
    setParams({ chapter: next }, { replace: true });
    setStep(0);
    setPlaying(false);
    setNavOpen(false);
  };
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () =>
        setStep((s) => {
          if (s === 4) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      2600 / speed,
    );
    return () => clearTimeout(timer);
  }, [playing, speed, step]);
  useEffect(() => {
    document.title = `DeepSeekMoE · ${lesson.title} | ORBIT`;
    return () => {
      document.title = "ORBIT / AI 研究图谱";
    };
  }, [lesson.title]);
  const interactive = ["routing", "segmentation", "shared", "balance"].includes(
    lesson.scene,
  );
  return (
    <ConceptHelpScope>
      <div className="moe-reader">
        <header className="moe-page-header">
          <div>
            <strong>DeepSeekMoE</strong>
            <span>专家专业化 · 原文交互精读</span>
            <small>arXiv:2401.06066v1 · 2024.01</small>
          </div>
          <div>
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="moe-mobile-nav-toggle"
            >
              目录
            </button>
            <a
              href={`${import.meta.env.BASE_URL}${moePdf}`}
              target="_blank"
              rel="noreferrer"
            >
              完整 PDF ↗
            </a>
            <a href={moeSource} target="_blank" rel="noreferrer">
              HTML 原文 ↗
            </a>
          </div>
        </header>
        <div className="moe-reading-layout">
          <aside
            className={`moe-nav ${navOpen ? "open" : ""}`}
            aria-label="DeepSeekMoE 章节"
          >
            <label>
              论文学习目录
              <input
                aria-label="搜索 DeepSeekMoE 章节"
                placeholder="搜索概念、实验、公式…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {moeLessons
              .filter((l) =>
                `${l.title} ${l.section} ${l.intro}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((l, i) => (
                <button
                  key={l.id}
                  className={lesson.id === l.id ? "active" : ""}
                  aria-current={lesson.id === l.id ? "page" : undefined}
                  onClick={() => change(l.id)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    {l.title}
                    <small>{l.section}</small>
                  </div>
                </button>
              ))}
            <footer>
              17 个原始公式 · 10 张原表
              <br />
              33 页正文与附录逐页可读
            </footer>
          </aside>
          <main className="moe-main">
            <div className="moe-section-heading">
              <small>
                {lesson.section} · PDF p.{lesson.page}
              </small>
              <h1>{lesson.title}</h1>
              <p>{lesson.question}</p>
            </div>
            {lesson.scene === "architecture" ? (
              <Architecture />
            ) : interactive ? (
              <MoELab key={lesson.id} kind={lesson.scene} step={step} />
            ) : lesson.scene === "evidence" ? (
              <MoEEvidence
                key={lesson.id}
                initialTable={
                  lesson.id === "scale16"
                    ? 3
                    : lesson.id === "alignment"
                      ? 5
                      : lesson.id === "scale145"
                        ? 6
                        : 1
                }
              />
            ) : lesson.scene === "formulas" ? (
              <MoEFormulas />
            ) : (
              <SourceArchive
                key={lesson.id}
                title="DeepSeekMoE"
                pdf={moePdf}
                imageRoot="article/deepseek/moe/pages"
                pages={pages.pages}
                entries={moeSourceEntries}
                initialPage={lesson.page}
              />
            )}
            {interactive && (
              <div className="moe-step-engine">
                <button
                  aria-label={playing ? "暂停 MoE 步骤" : "播放 MoE 步骤"}
                  onClick={() => {
                    if (step === 4) setStep(0);
                    setPlaying((v) => !v);
                  }}
                >
                  {playing ? "❚❚" : "▶"}
                </button>
                {steps.map((s, i) => (
                  <button
                    key={s}
                    className={step === i ? "active" : ""}
                    onClick={() => {
                      setStep(i);
                      setPlaying(false);
                    }}
                  >
                    <span>{i + 1}</span>
                    {s}
                  </button>
                ))}
                <select
                  aria-label="MoE 播放速度"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  <option value={0.5}>0.5×</option>
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                </select>
              </div>
            )}
            <div className="moe-source-boundary">
              <b>论文事实 / 教学模拟</b>
              <p>{lesson.caution}</p>
            </div>
          </main>
          <aside
            className="moe-reading-notes"
            aria-label="DeepSeekMoE 原理详解"
          >
            <span className="moe-notes-kicker">
              FIRST PRINCIPLES · 从问题到证据
            </span>
            <h2>{lesson.question}</h2>
            <p>{lesson.intro}</p>
            {lesson.details.map((detail, i) => (
              <section key={detail.title}>
                <h3>
                  <i>{String(i + 1).padStart(2, "0")}</i>
                  {detail.title}
                </h3>
                <p>{detail.body}</p>
              </section>
            ))}
            <div className="moe-inspect-hint">
              悬停带边框的计算节点、专家或负载柱，可查看具体输入、输出、计算和例子；点击后固定阅读，Esc
              关闭。
            </div>
            <a
              className="moe-note-source"
              href={`${import.meta.env.BASE_URL}${moePdf}#page=${lesson.page}`}
              target="_blank"
              rel="noreferrer"
            >
              核对原文 · {lesson.section}
              <small>PDF p.{lesson.page} ↗</small>
            </a>
          </aside>
        </div>
      </div>
    </ConceptHelpScope>
  );
}
