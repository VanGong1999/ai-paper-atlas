import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  chapters,
  codeLines,
  codeUrl,
  paperUrl,
} from "../data/papers/deepseek-v2/content";
import { concepts } from "../data/papers/deepseek-v2/concepts";
import { Formula } from "../components/paper/deepseek-v2/Formula";
import {
  ExperimentScene,
  initialSimulation,
  SimulationControls,
  Visualization,
} from "../components/paper/deepseek-v2/Visualizations";
import type { Simulation } from "../components/paper/deepseek-v2/Visualizations";
import {
  OriginalEquations,
  SourceTables,
} from "../components/paper/deepseek-v2/SourceEvidence";
import "../styles/deepseek-v2.css";

type Mode =
  "learn" | "formulas" | "code" | "experiments" | "paper" | "coverage";
type IconName =
  | "book"
  | "grid"
  | "code"
  | "chart"
  | "search"
  | "left"
  | "right"
  | "play"
  | "pause"
  | "reset"
  | "shuffle"
  | "close"
  | "check"
  | "link"
  | "panel"
  | "external"
  | "layers";
const paths: Record<IconName, ReactNode> = {
  book: (
    <>
      <path d="M3 4h6a3 3 0 0 1 3 2v15a4 4 0 0 0-4-2H3zM21 4h-6a3 3 0 0 0-3 2v15a4 4 0 0 1 4-2h5z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" />,
  chart: (
    <>
      <path d="M4 3v17h17M8 15V9m5 6V5m5 10v-4" />
    </>
  ),
  search: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m15 15 6 6" />
    </>
  ),
  left: <path d="m14 5-7 7 7 7" />,
  right: <path d="m10 5 7 7-7 7" />,
  play: <path d="m7 4 14 8L7 20z" />,
  pause: (
    <>
      <path d="M8 4v16M16 4v16" />
    </>
  ),
  reset: (
    <>
      <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />
    </>
  ),
  shuffle: (
    <>
      <path d="M3 6h4l10 12h4m-4-4 4 4-4 4M3 18h4l4-5m3-6 3-1h4m-4-4 4 4-4 4" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m4 12 5 5L20 6" />,
  link: (
    <>
      <path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 5-10 5L2 8zM2 13l10 5 10-5M2 18l10 5 10-5" />
    </>
  ),
};
function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
function Whale() {
  return (
    <svg
      width="33"
      height="28"
      viewBox="0 0 42 34"
      fill="currentColor"
      aria-hidden
    >
      <path d="M5 17C3 10 5 4 10 3c0 5 4 7 8 8 6-7 17-5 19 3 2 10-7 17-18 16C9 29 4 25 2 20c7 1 12 0 15-3-5 1-9 1-12 0Z" />
      <path d="m29 4 4-4 1 6" />
      <circle cx="31" cy="15" r="1.6" fill="var(--v2-bg)" />
    </svg>
  );
}
function safeRead<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
const modes: { id: Mode; label: string; icon: IconName }[] = [
  { id: "learn", label: "交互精读", icon: "book" },
  { id: "formulas", label: "公式索引", icon: "grid" },
  { id: "code", label: "源码对照", icon: "code" },
  { id: "experiments", label: "实验数据", icon: "chart" },
  { id: "paper", label: "论文原文", icon: "external" },
];
const totalSteps = chapters.reduce((n, c) => n + c.steps.length, 0);

export function DeepSeekV2Page() {
  const [params, setParams] = useSearchParams();
  const candidate = chapters.findIndex((c) => c.id === params.get("chapter"));
  const chapterIndex = candidate < 0 ? 0 : candidate,
    chapter = chapters[chapterIndex];
  const rawStep = Number(params.get("step") ?? 0),
    step = Number.isInteger(rawStep)
      ? Math.max(0, Math.min(chapter.steps.length - 1, rawStep))
      : 0;
  const current = chapter.steps[step];
  const [mode, setMode] = useState<Mode>("learn"),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [search, setSearch] = useState("");
  const [sim, setSim] = useState<Simulation>(initialSimulation),
    [inspect, setInspect] = useState<string | null>(null),
    [pinned, setPinned] = useState(false);
  const [read, setRead] = useState<string[]>(() => {
    const value = safeRead<unknown>("orbit-v2-read", []);
    return Array.isArray(value)
      ? value.filter((x): x is string => typeof x === "string")
      : [];
  });
  const [sideOpen, setSideOpen] = useState(true),
    [detailOpen, setDetailOpen] = useState(true),
    [sideWidth, setSideWidth] = useState(226),
    [detailWidth, setDetailWidth] = useState(() =>
      Math.max(300, Math.round((window.innerWidth - 230) * 0.36)),
    ),
    [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null),
    detailRef = useRef<HTMLDivElement>(null),
    layoutRef = useRef<HTMLDivElement>(null),
    drag = useRef<{ side: "left" | "right"; x: number; width: number } | null>(
      null,
    );
  const [zoom, setZoom] = useState(1);
  const [mobileNav, setMobileNav] = useState(false),
    [mobileDetail, setMobileDetail] = useState(false);
  const navigate = useCallback(
    (ci: number, si = 0) => {
      setParams(
        { chapter: chapters[ci].id, step: String(si) },
        { replace: true },
      );
      setInspect(null);
      setPinned(false);
      setMobileNav(false);
      setMobileDetail(false);
    },
    [setParams],
  );
  const advance = useCallback(
    (direction: number) => {
      const next = step + direction;
      if (next < 0 && chapterIndex > 0)
        navigate(chapterIndex - 1, chapters[chapterIndex - 1].steps.length - 1);
      else if (
        next >= chapter.steps.length &&
        chapterIndex < chapters.length - 1
      )
        navigate(chapterIndex + 1);
      else if (next >= 0 && next < chapter.steps.length)
        navigate(chapterIndex, next);
      else setPlaying(false);
    },
    [step, chapterIndex, chapter.steps.length, navigate],
  );
  useEffect(() => {
    document.title = `DeepSeek-V2 · ${chapter.title} | ORBIT`;
    return () => {
      document.title = "ORBIT / AI 研究图谱";
    };
  }, [chapter.title]);
  useEffect(() => {
    try {
      localStorage.setItem("orbit-v2-read", JSON.stringify(read));
    } catch {
      /* Keep progress in memory when storage is unavailable. */
    }
  }, [read]);
  useEffect(() => {
    if (!playing || mode !== "learn") return;
    const timer = window.setTimeout(() => advance(1), 5000 / speed);
    return () => clearTimeout(timer);
  }, [playing, speed, advance, mode]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSideOpen(true);
        setMobileNav(true);
        searchRef.current?.focus();
        return;
      }
      if (
        (e.target as HTMLElement).closest(
          'input,textarea,select,button,a,[role="button"]',
        )
      )
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        advance(-1);
      } else if (e.code === "Space") {
        e.preventDefault();
        setPlaying((x) => !x);
      } else if (e.key.toLowerCase() === "r") {
        navigate(chapterIndex, 0);
      } else if (e.key === "Escape") {
        setInspect(null);
        setPinned(false);
        setMobileNav(false);
        setMobileDetail(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advance, navigate, chapterIndex]);
  useEffect(() => {
    detailRef.current?.scrollTo({ top: 0 });
  }, [chapter.id, step, inspect]);
  useEffect(() => {
    const resize = () =>
      setDetailWidth(
        Math.max(300, Math.round((window.innerWidth - 230) * 0.36)),
      );
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => setZoom(1), [chapter.id]);
  const onInspect = (id: string, pin = false) => {
    if (pinned && !pin) return;
    setInspect(id);
    if (pin) {
      setPinned(true);
      if (window.innerWidth <= 1000) setMobileDetail(true);
    }
  };
  const onNavigate = (id: string) => {
    const index = chapters.findIndex((c) => c.id === id);
    if (index >= 0) {
      setMode("learn");
      navigate(index);
    }
  };
  const visible = chapters.filter(
    (c) =>
      !search ||
      `${c.title} ${c.en} ${c.steps.map((s) => s.title + " " + s.body).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const activeKey = `${chapter.id}:${step}`,
    isRead = read.includes(activeKey),
    concept = inspect ? concepts[inspect] : null;
  const citationChapter = concept
    ? (chapters.find((c) => c.id === concept.chapter) ?? chapter)
    : chapter;
  const toggleRead = () =>
    setRead((x) =>
      x.includes(activeKey)
        ? x.filter((v) => v !== activeKey)
        : [...x, activeKey],
    );
  const pointerStart = (
    e: PointerEvent<HTMLDivElement>,
    side: "left" | "right",
  ) => {
    drag.current = {
      side,
      x: e.clientX,
      width: side === "left" ? sideWidth : detailWidth,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const pointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const { side, x, width } = drag.current;
    const viewport = layoutRef.current?.clientWidth ?? 1440;
    if (side === "left")
      setSideWidth(Math.max(190, Math.min(310, width + e.clientX - x)));
    else
      setDetailWidth(
        Math.max(300, Math.min(viewport * 0.48, width + x - e.clientX)),
      );
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const canvasScene = mode === "code" ? "mla" : chapter.scene;
  const changeMode = (next: Mode) => {
    setMode(next);
    setPlaying(false);
  };
  const globalStep =
    chapters.slice(0, chapterIndex).reduce((n, c) => n + c.steps.length, 0) +
    step;
  return (
    <div className="v2-reader">
      <header className="v2-header">
        <div className="v2-paper-identity">
          <span className="v2-whale">
            <Whale />
          </span>
          <div>
            <h1>
              DeepSeek-V2 <span>论文交互精读</span>
            </h1>
            <small>
              A STRONG, ECONOMICAL, AND EFFICIENT MoE LANGUAGE MODEL
            </small>
          </div>
          <span className="v2-version">2024.05</span>
        </div>
        <div className="v2-header-right">
          <span className="v2-source-status">
            <i />
            基于原始论文
          </span>
          <a href={paperUrl} target="_blank" rel="noreferrer">
            arXiv:2405.04434 <Icon name="external" size={12} />
          </a>
          <a
            href="https://github.com/deepseek-ai/DeepSeek-V2"
            target="_blank"
            rel="noreferrer"
            aria-label="官方 GitHub 仓库"
          >
            <Icon name="code" />
          </a>
        </div>
      </header>
      <div
        className="v2-workspace"
        ref={layoutRef}
        style={
          {
            "--v2-side": sideOpen ? `${sideWidth}px` : "44px",
            "--v2-detail": detailOpen ? `${detailWidth}px` : "0px",
          } as CSSProperties
        }
      >
        <aside
          className={`v2-sidebar ${!sideOpen ? "collapsed" : ""} ${mobileNav ? "mobile-open" : ""}`}
          aria-label="论文学习目录"
        >
          <div className="v2-sidebar-head">
            <button
              className="v2-icon-button"
              aria-label={sideOpen ? "折叠目录" : "展开目录"}
              onClick={() => setSideOpen((v) => !v)}
            >
              <Icon name="panel" />
            </button>
            {sideOpen && (
              <>
                <strong>学习目录</strong>
                <span>19 章</span>
              </>
            )}
          </div>
          {sideOpen && (
            <>
              <label className="v2-search">
                <Icon name="search" size={14} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索章节、概念…"
                  aria-label="搜索章节、概念"
                />
                <kbd>⌘ K</kbd>
              </label>
              <nav className="v2-chapter-nav">
                {visible.map((c) => {
                  const i = chapters.indexOf(c),
                    previous = visible[visible.indexOf(c) - 1],
                    complete = c.steps.every((_, si) =>
                      read.includes(`${c.id}:${si}`),
                    );
                  return (
                    <div key={c.id}>
                      {(!previous || previous.group !== c.group) && (
                        <div className="v2-nav-group">{c.group}</div>
                      )}
                      <button
                        className={`v2-chapter ${i === chapterIndex ? "active" : ""}`}
                        aria-current={i === chapterIndex ? "page" : undefined}
                        onClick={() => {
                          setMode("learn");
                          navigate(i);
                        }}
                      >
                        <span className="v2-chapter-number">
                          {complete ? (
                            <Icon name="check" size={12} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        <span>{c.title}</span>
                        {["mla", "rope", "absorption"].includes(c.id) && (
                          <i className="v2-core-dot" />
                        )}
                      </button>
                      {i === chapterIndex && !search && (
                        <div className="v2-subchapters">
                          {c.steps.map((s, j) => (
                            <button
                              key={s.title}
                              className={step === j ? "active" : ""}
                              onClick={() => navigate(i, j)}
                            >
                              <i
                                className={
                                  read.includes(`${c.id}:${j}`) ? "read" : ""
                                }
                              />
                              {s.title}
                              <span>{String(j + 1).padStart(2, "0")}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {visible.length === 0 && (
                  <p className="v2-empty-search">
                    没有匹配章节，试试 “MLA” 或 “缓存”。
                  </p>
                )}
              </nav>
              <div className="v2-sidebar-footer">
                <button onClick={() => changeMode("coverage")}>
                  <Icon name="grid" size={13} />
                  论文覆盖矩阵
                  <Icon name="right" size={12} />
                </button>
                <div>
                  <span>我的学习进度</span>
                  <b>
                    {read.length} / {totalSteps}
                  </b>
                </div>
                <progress max={totalSteps} value={read.length} />
                <small>进度自动保存在此浏览器</small>
              </div>
            </>
          )}
        </aside>
        <div
          className="v2-splitter left"
          role="separator"
          aria-label="调整目录宽度"
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={(e) => pointerStart(e, "left")}
          onPointerMove={pointerMove}
          onPointerUp={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "ArrowRight" || e.key === "ArrowLeft")
              e.preventDefault();
            if (e.key === "ArrowRight")
              setSideWidth((w) => Math.min(310, w + 10));
            if (e.key === "ArrowLeft")
              setSideWidth((w) => Math.max(190, w - 10));
          }}
        />
        <section className="v2-center" aria-label={`${chapter.title} · 交互学习`}>
          <nav className="v2-mode-tabs" aria-label="阅读模式">
            <button
              className="v2-mobile-menu"
              aria-label="打开章节目录"
              onClick={() => {
                setSideOpen(true);
                setMobileNav((v) => !v);
              }}
            >
              <Icon name="panel" />
            </button>
            {modes.map((m) => (
              <button
                key={m.id}
                className={mode === m.id ? "active" : ""}
                onClick={() => changeMode(m.id)}
              >
                <Icon name={m.icon} size={14} />
                {m.label}
              </button>
            ))}
            <button onClick={copyLink} title="复制当前步骤链接" aria-label="复制当前步骤链接"><Icon name={copied ? "check" : "link"} size={13}/>{copied ? "已复制" : ""}</button>
            <button
              className="v2-detail-toggle"
              aria-label={detailOpen ? "折叠详解" : "展开详解"}
              onClick={() =>
                window.innerWidth <= 1000
                  ? setMobileDetail((v) => !v)
                  : setDetailOpen((v) => !v)
              }
            >
              <Icon name="panel" size={14} />
            </button>
          </nav>
          <div className="v2-center-scroll">
            {mode === "learn" && (
              <>
                <div className="v2-metrics">
                  {[
                    {
                      label: "总参数量",
                      value: "236",
                      unit: "B",
                      sub: "TOTAL PARAMETERS",
                    },
                    {
                      label: "每 Token 激活",
                      value: "21",
                      unit: "B",
                      sub: "ACTIVATED PARAMETERS",
                    },
                    {
                      label: "上下文窗口",
                      value: "128",
                      unit: "K",
                      sub: "CONTEXT LENGTH",
                    },
                    {
                      label: "预训练数据",
                      value: "8.1",
                      unit: "T",
                      sub: "TRAINING TOKENS",
                    },
                  ].map((m, i) => (
                    <button
                      key={m.label}
                      onClick={() =>
                        onNavigate(
                          i === 2
                            ? "pretraining"
                            : i === 3
                              ? "pretraining"
                              : "overview",
                        )
                      }
                      title="查看参数背景与论文说明"
                    >
                      <span>{m.label}</span>
                      <strong>
                        {m.value}
                        <em>{m.unit}</em>
                      </strong>
                      <small>{m.sub}</small>
                    </button>
                  ))}
                </div>
                <div className="v2-stage">
                  <div className="v2-stage-toolbar">
                    <span>
                      <Icon name="layers" size={13} />
                      {chapter.id === "overview"
                        ? "模型架构总览"
                        : chapter.id === "mla"
                          ? "MLA 计算图"
                          : current.title}
                    </span>
                    <div>
                      <span className="v2-teaching-tag">
                        {["training", "architecture", "graph"].includes(
                          chapter.scene,
                        )
                          ? "论文架构 · 教学重绘"
                          : "教学模拟 · 实时计算"}
                      </span>
                      {[
                        "architecture",
                        "mla",
                        "rope",
                        "moe",
                        "training",
                        "graph",
                      ].includes(chapter.scene) && (
                        <div className="v2-zoom-controls">
                          <button
                            aria-label="缩小计算图"
                            disabled={zoom <= 1}
                            onClick={() =>
                              setZoom((z) => Math.max(1, z - 0.25))
                            }
                          >
                            −
                          </button>
                          <button
                            aria-label="重置计算图缩放"
                            onClick={() => setZoom(1)}
                          >
                            {Math.round(zoom * 100)}%
                          </button>
                          <button
                            aria-label="放大计算图"
                            disabled={zoom >= 3}
                            onClick={() =>
                              setZoom((z) => Math.min(3, z + 0.25))
                            }
                          >
                            +
                          </button>
                        </div>
                      )}
                      <button
                        title="重置参数与步骤"
                        aria-label="重置参数与步骤"
                        onClick={() => {
                          setSim(initialSimulation);
                          navigate(chapterIndex);
                        }}
                      >
                        <Icon name="reset" size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="v2-visual-pan" data-zoomed={zoom > 1}>
                    <div style={{ width: `${zoom * 100}%`, minWidth: "100%" }}>
                      <Visualization
                        scene={canvasScene}
                        step={step}
                        sim={sim}
                        onChange={setSim}
                        onInspect={onInspect}
                        onNavigate={onNavigate}
                        selected={inspect}
                      />
                    </div>
                  </div>
                  <div className="v2-stage-legend">
                    {[
                      ["blue", "Query"],
                      ["green", "Key"],
                      ["orange", "Value"],
                      ["purple", "KV latent"],
                      ["gold", "RoPE"],
                      ["cyan", "Routed expert"],
                    ].map(([tone, label]) => (
                      <button
                        key={label}
                        onMouseEnter={() =>
                          onInspect(
                            {
                              Query: "query",
                              Key: "key",
                              Value: "value",
                              "KV latent": "latent",
                              RoPE: "rope",
                              "Routed expert": "expert",
                            }[label] ?? "h",
                          )
                        }
                        onClick={() =>
                          onInspect(
                            {
                              Query: "query",
                              Key: "key",
                              Value: "value",
                              "KV latent": "latent",
                              RoPE: "rope",
                              "Routed expert": "expert",
                            }[label] ?? "h",
                            true,
                          )
                        }
                      >
                        <i className={`v2-dot ${tone}`} />
                        {label}
                      </button>
                    ))}
                    <small>悬停探索 · 点击固定详解</small>
                  </div>
                </div>
                <div className="v2-live-formula">
                  <span>
                    当前公式<small>{chapter.source}</small>
                  </span>
                  <Formula math={current.formula} />
                </div>
                <SimulationControls
                  scene={chapter.scene}
                  sim={sim}
                  onChange={setSim}
                />
              </>
            )}
            {mode === "formulas" && (
              <div className="v2-formula-index">
                <OriginalEquations onNavigate={onNavigate} />
                <div className="v2-section-caption">
                  公式与张量维度 <span>点击条目跳转对应计算</span>
                </div>
                {chapters.map((c, ci) => (
                  <section key={c.id}>
                    <h3>
                      {String(ci + 1).padStart(2, "0")} {c.title}
                      <small>{c.source}</small>
                    </h3>
                    {c.steps.map((s, si) => (
                      <button
                        key={s.title}
                        onClick={() => {
                          setMode("learn");
                          navigate(ci, si);
                        }}
                      >
                        <span>{s.title}</span>
                        <Formula math={s.formula} />
                        <code>{s.shape}</code>
                        <Icon name="right" size={13} />
                      </button>
                    ))}
                  </section>
                ))}
              </div>
            )}
            {mode === "code" && (
              <div className="v2-code-mode">
                <div className="v2-source-note">
                  教学用 PyTorch 代数路径 ·
                  点击代码行查看对应节点。未在浏览器执行 Python。
                  <a href={codeUrl} target="_blank" rel="noreferrer">
                    官方源码 ↗
                  </a>
                </div>
                <div className="v2-stage">
                  <Visualization
                    scene="mla"
                    step={step}
                    sim={sim}
                    onChange={setSim}
                    onInspect={onInspect}
                    onNavigate={onNavigate}
                    selected={inspect}
                  />
                </div>
                <div className="v2-code-header">
                  <Icon name="code" size={14} />
                  <span>mla_decode.py</span>
                  <small>SIMPLIFIED · COLUMN-VECTOR NOTATION</small>
                </div>
                <CodePanel onInspect={onInspect} />
              </div>
            )}
            {mode === "experiments" && (
              <>
                <ExperimentScene />
                <SourceTables />
              </>
            )}
            {mode === "paper" && (
              <div className="v2-original">
                <div className="v2-source-note">
                  本地论文 PDF · 正文、全部图表与附录。
                  <a href={paperUrl} target="_blank" rel="noreferrer">
                    打开 HTML 原文 ↗
                  </a>
                </div>
                <iframe
                  title="DeepSeek-V2 完整论文 PDF"
                  src={`${import.meta.env.BASE_URL}article/deepseek/2405.04434.pdf#view=FitH`}
                />
              </div>
            )}
            {mode === "coverage" && (
              <div className="v2-coverage">
                <div className="v2-section-caption">
                  论文知识覆盖矩阵 <span>区分讲解、模拟与原始证据</span>
                </div>
                <p>
                  19 章共 {totalSteps}{" "}
                  个讲解步骤。数值模拟为教学尺度；实验页提供表 2 的 8
                  个核心指标图表与 37 张原始表格，公式页含全部 47 个编号公式。
                </p>
                <table className="v2-data-table">
                  <thead>
                    <tr>
                      <th>章节 / 原文位置</th>
                      <th>前置知识</th>
                      <th>可视化 / 讲解</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <button onClick={() => onNavigate(c.id)}>
                            {c.title} ↗
                          </button>
                          <small>{c.source}</small>
                        </td>
                        <td>
                          {c.prerequisites
                            .map(
                              (id) => chapters.find((x) => x.id === id)?.title,
                            )
                            .join("、") || "无"}
                        </td>
                        <td>
                          <span className="v2-coverage-status">
                            ✓ {c.scene}
                          </span>
                          <small>{c.steps.length} 步 · 来源可追溯</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="v2-source-note">
                  实现边界：并非完整预训练模型运行器；原始数值表支持筛选与通用数值绘图，提示模板表保留原文格式。浏览器数学模拟与官方配置、公开
                  Python 参考实现及内部优化部署分别标注。
                </div>
              </div>
            )}
          </div>
          <footer className="v2-playback">
            <div className="v2-playback-main">
              <button
                className={`v2-play-button ${playing ? "playing" : ""}`}
                aria-label={playing ? "暂停动画" : "播放动画"}
                onClick={() => {
                  setMode("learn");
                  setPlaying((v) => !v);
                }}
              >
                <Icon name={playing ? "pause" : "play"} size={15} />
              </button>
              <button
                className="v2-icon-button"
                aria-label="上一步"
                disabled={globalStep === 0}
                onClick={() => advance(-1)}
              >
                <Icon name="left" size={15} />
              </button>
              <span className="v2-step-count">
                {String(step + 1).padStart(2, "0")} <i>/ 04</i>
              </span>
              <button
                className="v2-icon-button"
                aria-label="下一步"
                disabled={globalStep === totalSteps - 1}
                onClick={() => advance(1)}
              >
                <Icon name="right" size={15} />
              </button>
              <div className="v2-step-timeline">
                {chapter.steps.map((s, i) => (
                  <button
                    key={s.title}
                    className={`${i === step ? "active" : ""} ${i < step ? "past" : ""}`}
                    onClick={() => navigate(chapterIndex, i)}
                    aria-label={`步骤 ${i + 1}：${s.title}`}
                    title={s.title}
                  >
                    <i />
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
              <select
                aria-label="播放速度"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={1.5}>1.5×</option>
                <option value={2}>2×</option>
              </select>
              {!["architecture", "training", "graph", "experiments"].includes(
                chapter.scene,
              ) && (
                <button
                  className="v2-icon-button"
                  aria-label="随机教学输入"
                  title="随机教学输入"
                  onClick={() =>
                    setSim((v) => ({ ...v, seed: (v.seed % 20) + 1 }))
                  }
                >
                  <Icon name="shuffle" size={15} />
                </button>
              )}
            </div>
            <div className="v2-playback-hint">
              <span>
                <kbd>←</kbd>
                <kbd>→</kbd> 切换步骤 <kbd>Space</kbd> 播放 / 暂停
              </span>
              <span>
                FIG. {String(chapterIndex + 1).padStart(2, "0")}.{step + 1}
                <i /> {chapter.source}
              </span>
            </div>
          </footer>
        </section>
        <div
          className="v2-splitter right"
          role="separator"
          aria-label="调整详解宽度"
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={(e) => pointerStart(e, "right")}
          onPointerMove={pointerMove}
          onPointerUp={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "ArrowRight" || e.key === "ArrowLeft")
              e.preventDefault();
            if (e.key === "ArrowLeft")
              setDetailWidth((w) => Math.min(600, w + 10));
            if (e.key === "ArrowRight")
              setDetailWidth((w) => Math.max(300, w - 10));
          }}
        />
        {detailOpen && (
          <aside
            className={`v2-detail ${mobileDetail ? "mobile-detail-open" : ""}`}
            aria-label="同步知识讲解"
          >
            <div className="v2-detail-head">
              <button
                className="v2-mobile-detail-close v2-icon-button"
                aria-label="收起讲解面板"
                onClick={() => setMobileDetail(false)}
              >
                <Icon name="close" size={15} />
              </button>
              <div>
                <span className="v2-detail-indicator" />
                <b>
                  {concept ? (pinned ? "已固定概念" : "概念探索") : "同步精读"}
                </b>
              </div>
              <span>
                {concept ? "CONCEPT INSPECTOR" : `STEP ${step + 1} / 4`}
              </span>
              {concept && (
                <button
                  className="v2-icon-button"
                  aria-label="关闭概念详解"
                  onClick={() => {
                    setInspect(null);
                    setPinned(false);
                  }}
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
            <div className="v2-detail-scroll" ref={detailRef}>
              <div className="v2-detail-eyebrow">
                {concept
                  ? concept.en
                  : [
                      "THE PROBLEM",
                      "THE MECHANISM",
                      "THE COMPUTATION",
                      "THE BIGGER PICTURE",
                    ][step]}
                <span>{concept ? "交互知识卡" : "原理精读"}</span>
              </div>
              <h2>{concept ? concept.name : current.question}</h2>
              <p className="v2-detail-body">
                {concept ? concept.body : current.body}
              </p>
              <div className="v2-detail-section">
                <h3>
                  <span className="v2-section-number">01</span>数学表达{" "}
                  <span>MATHEMATICS</span>
                </h3>
                <div className="v2-detail-formula">
                  <Formula math={concept ? concept.math : current.formula} />
                </div>
              </div>
              <div className="v2-detail-section">
                <h3>
                  <span className="v2-section-number">02</span>张量与维度{" "}
                  <span>TENSOR SHAPES</span>
                </h3>
                <div className="v2-shape-box">
                  <Icon name="layers" size={15} />
                  <code>{concept ? concept.shape : current.shape}</code>
                </div>
                <small className="v2-dimension-note">
                  B · 批次　T · 序列长度　d · 隐藏维度
                </small>
              </div>
              <div className="v2-insight-note">
                <span>↳ 关键理解</span>
                <p>{concept ? concept.note : current.note}</p>
              </div>
              <details className="v2-derivation">
                <summary>
                  展开推导与维度检查 <span>+</span>
                </summary>
                <p>
                  {chapter.id === "absorption"
                    ? "结合律仅改变括号：(AB)C=A(BC)。两条路径的内维分别匹配，输出都是一个标量。Softmax 必须在内容与位置分数相加、缩放、Mask 之后执行。"
                    : chapter.id === "mla"
                      ? "每个 latent 分量 cᵢ=ΣⱼWᵢⱼhⱼ。W 的行数决定输出维度，因此 512×5120 乘 5120 维向量得到 512 维 latent。再乘 16384×512 的上投影，恢复所有头的内容表示。"
                      : chapter.id === "rope"
                        ? "RₘᵀRₙ=Rₙ₋ₘ，因为旋转矩阵正交，Rₘᵀ=R₋ₘ。于是 (Rₘq)ᵀ(Rₙk)=qᵀRₙ₋ₘk。频率固定时，同时平移两个位置不会改变点积。"
                        : `${current.shape}。逐个核对输入、变换与输出：矩阵的最后一个输入维度必须与其乘数内维一致；相加项形状一致；缓存额外乘 B、T、L 和每个元素的字节数。`}
                </p>
                <button
                  onClick={() =>
                    onNavigate(
                      concept?.chapter ?? chapter.prerequisites[0] ?? "math",
                    )
                  }
                >
                  查看相关计算 →
                </button>
              </details>
              <div className="v2-detail-section v2-related">
                <h3>相关知识</h3>
                <div>
                  {(chapter.prerequisites.length
                    ? chapter.prerequisites
                    : ["math", "mla", "deepseekmoe"]
                  ).map((id) => (
                    <button key={id} onClick={() => onNavigate(id)}>
                      {chapters.find((c) => c.id === id)?.title}
                      <Icon name="right" size={11} />
                    </button>
                  ))}
                </div>
              </div>
              <a
                className="v2-citation"
                href={`${paperUrl}#${citationChapter.anchor}`}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <span>论文原文出处</span>
                  <Icon name="external" size={12} />
                </div>
                <strong>DeepSeek-V2 · {citationChapter.source}</strong>
                <small>arXiv:2405.04434v5 · 19 Jun 2024</small>
              </a>
            </div>
            <div className="v2-detail-footer">
              <button className={isRead ? "complete" : ""} onClick={toggleRead}>
                <Icon name="check" size={14} />
                {isRead ? "已掌握本步骤" : "标记本步骤已掌握"}
                <span aria-hidden>{isRead ? "✓" : "+"}</span>
              </button>
              <button
                onClick={() => advance(1)}
                disabled={globalStep === totalSteps - 1}
              >
                继续学习
                {step < 3
                  ? `：${chapter.steps[step + 1].title}`
                  : chapterIndex < 18
                    ? `：${chapters[chapterIndex + 1].title}`
                    : " · 已到最后一步"}
                <Icon name="right" size={13} />
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function CodePanel({
  onInspect,
}: {
  onInspect: (id: string, pin?: boolean) => void;
}) {
  const [line, setLine] = useState(1);
  const mappings = [
    "h",
    "latent",
    "key",
    "value",
    "query",
    "query",
    "rope",
    "rope",
    "cache",
    "query",
    "key",
    "rope",
    "attention",
    "value",
    "output",
    "output",
  ];
  return (
    <div className="v2-code-lines">
      {codeLines.map((text, i) => (
        <button
          key={i}
          className={line === i ? "active" : ""}
          onClick={() => {
            setLine(i);
            onInspect(mappings[i], true);
          }}
        >
          <span>{String(i + 1).padStart(2, "0")}</span>
          <code>{text}</code>
          {line === i && <i>← current</i>}
        </button>
      ))}
    </div>
  );
}
