import katex from "katex";
import "katex/dist/katex.min.css";

export function Formula({
  math,
  block = true,
}: {
  math: string;
  block?: boolean;
}) {
  return (
    <span
      className={`v2-formula ${block ? "block" : ""}`}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(math, {
          throwOnError: false,
          displayMode: block,
          strict: false,
        }),
      }}
    />
  );
}
