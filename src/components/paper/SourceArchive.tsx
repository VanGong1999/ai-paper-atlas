import { useState } from "react";
import "../../styles/source-archive.css";

export type SourcePage = { page: number; text: string };
export type SourceEntry = {
  id: string;
  title: string;
  page: number;
  description: string;
};
export function SourceArchive({
  title,
  pdf,
  imageRoot,
  pages,
  entries,
  initialPage = 1,
}: {
  title: string;
  pdf: string;
  imageRoot: string;
  pages: SourcePage[];
  entries: SourceEntry[];
  initialPage?: number;
}) {
  const [page, setPage] = useState(initialPage),
    [mode, setMode] = useState<"image" | "text">("image"),
    [search, setSearch] = useState("");
  const source = pages.find((p) => p.page === page) ?? pages[0],
    matches = pages.filter(
      (p) => !search || p.text.toLowerCase().includes(search.toLowerCase()),
    );
  const asset = (path: string) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
  return (
    <div className="source-archive">
      <header>
        <strong>{title} · 原文档案</strong>
        <span>{pages.length} 页 · 原图与原文逐页可读</span>
        <a href={`${asset(pdf)}#page=${page}`} target="_blank" rel="noreferrer">
          PDF p.{page} ↗
        </a>
      </header>
      <div className="source-archive-controls">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← 上页
        </button>
        <label>
          页码
          <select
            aria-label={`${title} 原文页码`}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
          >
            {pages.map((p) => (
              <option key={p.page} value={p.page}>
                p.{p.page}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setPage((p) => Math.min(pages.length, p + 1))}
          disabled={page === pages.length}
        >
          下页 →
        </button>
        <button
          className={mode === "image" ? "active" : ""}
          onClick={() => setMode("image")}
        >
          原图
        </button>
        <button
          className={mode === "text" ? "active" : ""}
          onClick={() => setMode("text")}
        >
          全文文字
        </button>
      </div>
      <div className="source-archive-body">
        <aside>
          <input
            aria-label={`${title} 原文搜索`}
            placeholder="在全文中搜索…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <div className="source-search-results">
              {matches.map((p) => (
                <button
                  key={p.page}
                  onClick={() => {
                    setPage(p.page);
                    setMode("text");
                  }}
                >
                  PDF p.{p.page}
                  <small>
                    {p.text.slice(
                      Math.max(
                        0,
                        p.text.toLowerCase().indexOf(search.toLowerCase()) - 35,
                      ),
                      Math.max(
                        0,
                        p.text.toLowerCase().indexOf(search.toLowerCase()) - 35,
                      ) + 120,
                    )}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            entries.map((e) => (
              <button
                key={e.id}
                className={page === e.page ? "active" : ""}
                onClick={() => setPage(e.page)}
              >
                <span>{e.title}</span>
                <small>
                  p.{e.page} · {e.description}
                </small>
              </button>
            ))
          )}
        </aside>
        <section aria-label={`${title} 原文内容`}>
          <div className="source-current-page">
            PDF p.{page} / {pages.length}
            <span>
              {entries
                .filter((e) => e.page === page)
                .map((e) => e.title)
                .join(" · ")}
            </span>
          </div>
          {mode === "image" ? (
            <img
              key={page}
              src={`${asset(imageRoot)}/page-${page}.png`}
              alt={`${title} 原论文第 ${page} 页，保留原始图表、公式和版式`}
              loading="lazy"
            />
          ) : (
            <>
              <p className="source-text-note">
                PDF 文字提取供检索；公式、图中文字及跨栏顺序请以“原图”和 PDF
                为准。
              </p>
              <pre>{source.text}</pre>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
