import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import "../../styles/concept-help.css";

export type TeachingConcept = {
  title: string;
  what: string;
  why: string;
  how: string;
  example?: string;
  shape?: string;
  formula?: string;
  source: string;
  href?: string;
  caution?: string;
};
type Selection = {
  concept: TeachingConcept;
  element: HTMLElement;
  owner: string;
};
type HelpController = {
  open: (selection: Selection) => void;
  leave: () => void;
  pin: (selection: Selection) => void;
};
const HelpContext = createContext<HelpController | null>(null);

export function ConceptHelpScope({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const timer = useRef<number | undefined>(undefined);
  const card = useRef<HTMLElement>(null);
  const clear = () => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
  };
  const leave = () => {
    clear();
    if (!pinned)
      timer.current = window.setTimeout(() => setSelected(null), 180);
  };
  const close = () => {
    clear();
    setSelected(null);
    setPinned(false);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setPinned(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!selected) return;
    const place = () => {
      const box = selected.element.getBoundingClientRect(),
        width = Math.min(390, window.innerWidth - 24);
      const height = Math.min(
        card.current?.offsetHeight ?? 460,
        window.innerHeight - 24,
      );
      const left = pinned
        ? window.innerWidth - width - 12
        : Math.min(
            window.innerWidth - width - 12,
            Math.max(12, box.right + 12),
          );
      const top = pinned
        ? 80
        : Math.min(window.innerHeight - height - 12, Math.max(12, box.top));
      setPosition({ left: Math.max(12, left), top: Math.max(12, top) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    const observer = new ResizeObserver(place);
    if (card.current) observer.observe(card.current);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      observer.disconnect();
    };
  }, [selected, pinned]);
  const controller: HelpController = {
    open: (value) => {
      clear();
      if (!pinned) setSelected(value);
    },
    leave,
    pin: (value) => {
      clear();
      setSelected(value);
      setPinned(true);
    },
  };
  return (
    <HelpContext.Provider value={controller}>
      {children}
      {selected &&
        createPortal(
          <aside
            ref={card}
            className={`concept-help-card ${pinned ? "pinned" : ""}`}
            style={position}
            role={pinned ? "dialog" : "tooltip"}
            aria-label={selected.concept.title}
            onMouseEnter={clear}
            onMouseLeave={leave}
          >
            <header>
              <span>
                {pinned ? "已固定 · 可滚动详读" : "概念详解 · 点击元素可固定"}
              </span>
              <button type="button" aria-label="关闭概念解释" onClick={close}>
                ×
              </button>
            </header>
            <h3>{selected.concept.title}</h3>
            <p className="concept-what">{selected.concept.what}</p>
            <section>
              <b>为什么需要它</b>
              <p>{selected.concept.why}</p>
            </section>
            <section>
              <b>一步步怎样计算 / 发生</b>
              <p>{selected.concept.how}</p>
            </section>
            {selected.concept.shape && (
              <div className="concept-shape">{selected.concept.shape}</div>
            )}
            {selected.concept.formula && (
              <code>{selected.concept.formula}</code>
            )}
            {selected.concept.example && (
              <section className="concept-example">
                <b>用具体例子理解</b>
                <p>{selected.concept.example}</p>
              </section>
            )}
            {selected.concept.caution && (
              <p className="concept-caution">
                注意：{selected.concept.caution}
              </p>
            )}
            <footer>
              {selected.concept.href ? (
                <a
                  href={selected.concept.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selected.concept.source} ↗
                </a>
              ) : (
                selected.concept.source
              )}
              <span>Esc 关闭</span>
            </footer>
          </aside>,
          document.body,
        )}
    </HelpContext.Provider>
  );
}

export function ConceptHelp({
  concept,
  children,
  className = "",
  onActivate,
}: {
  concept: TeachingConcept;
  children: ReactNode;
  className?: string;
  onActivate?: () => void;
}) {
  const help = useContext(HelpContext),
    owner = useId();
  if (!help) throw new Error("ConceptHelp requires ConceptHelpScope");
  return (
    <button
      type="button"
      className={`concept-help-trigger ${className}`}
      aria-label={concept.title}
      onMouseEnter={(e) =>
        help.open({ concept, element: e.currentTarget, owner })
      }
      onMouseLeave={help.leave}
      onFocus={(e) => help.open({ concept, element: e.currentTarget, owner })}
      onBlur={help.leave}
      onClick={(e) => {
        help.pin({ concept, element: e.currentTarget, owner });
        onActivate?.();
      }}
    >
      {children}
    </button>
  );
}
