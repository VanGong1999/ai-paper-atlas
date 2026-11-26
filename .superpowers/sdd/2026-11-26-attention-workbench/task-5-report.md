# Task 5 source audit and final acceptance

Reviewed the workbench plan, design spec, Task 5 brief, and Task 1–4 reports. Baseline was `2f57bdf` on local `main`. The source was the supplied `public/article/1706.03762v7.pdf` (15 physical pages, SHA-256 `bdfaa68d8984f0dc02beaca527b76f207d99b666d31d1da728ee0728182df697`). Browser checks used local Vite and Chrome, with external page requests intercepted. The audit reads local files.

## PDF cross-checks

| Source | Verified workbench content |
| --- | --- |
| Abstract p. 1 and §6.1 / Table 2 p. 8 | EN-DE big **28.4**. EN-FR big **41.8** in the abstract and Table 2, **41.0** in §6.1 prose. The Learn fact and Chinese translator note distinguish the two locations. Table 2's base row gives 27.3 / 38.1. Section 6.1 gives EN-FR big dropout 0.1 instead of 0.3. |
| §§3.1–3.5 pp. 3–6 | The base encoder and decoder each have six layers and width 512. There are eight heads with key, query and value dimensions of 64 per head. The FFN is 512 → 2048 → 512. Checked residual placement, equation (1), multi-head concatenation and projection, equation (2), tied embedding/output weights and embedding scaling, and the sinusoidal pair against the printed formula layouts. |
| §5.1 p. 7 | EN-DE uses about 4.5M sentence pairs and a shared BPE vocabulary of about 37,000 tokens. EN-FR uses 36M sentences and 32,000 wordpieces. The batch has about 25,000 source and 25,000 target tokens. |
| §§5.2–5.4 pp. 7–8 | One machine with eight NVIDIA P100s. Base: 0.4 s/step, 100,000 steps, 12 hours. Big: 1.0 s/step, 300,000 steps, 3.5 days. Adam uses β₁=0.9, β₂=0.98, ε=10⁻⁹ and equation (3) with 4,000 warmup steps. Base residual dropout and label smoothing each use 0.1. The original lead-in says three types, followed by two named paragraphs. The Chinese reader now preserves that wording and labels the observation as a translator note. |
| Table 1 p. 6, Table 2 p. 8, Table 3 p. 9, Table 4 p. 10 | All 46 data rows match the supplied PDF, including column positions, printed blanks and the merged FLOPs and row E cells. Table 2 uses newstest2014 test BLEU and estimated FLOPs. Table 3 uses EN-DE newstest2013 dev BLEU, per-wordpiece PPL and base values for unlisted configurations. Big's printed changed settings and metrics include width 1024, FFN 4096, 16 heads, dropout 0.3, 300K steps, 4.33 PPL, 26.4 BLEU and 213M parameters. Table 4 gives WSJ section 23 F1 by training condition, including Transformer 91.3 WSJ-only and 92.7 semi-supervised. |
| Figures 1–2 pp. 3–4 | Original image crops and captions match. Checked encoder/decoder flow and attention/multi-head redraws against the diagrams. The Figure 2 card still links to p. 4. Its tooltip now cites §3.2.2 p. 5 for the head configuration. |
| Author notes p. 1, References pp. 10–12, Figures 3–5 pp. 13–15 | Verified all 27 ordered bilingual blocks and all 40 bibliography entries. The English reader regenerates identically by block from the supplied PDF. The three appendix images and captions match the source pages. Figure 3 shows the distant dependency from `making`, Figure 4 describes two heads apparently associated with anaphora, and Figure 5 presents examples that appear related to sentence structure. The redraws show selected links. |
| §7 p. 10 | The conclusion describes the translation results and leaves local attention, non-text modalities and less sequential generation as research plans. |

The audit combines the existing locator and bibliography validation with direct PDF column extraction, in-memory re-rendering of the nine original previews, English reader regeneration, and checks of selected numbers and formulas against the UI data. It flags missing previews, unused explainable IDs and known legacy off-paper topics. The 28 Learn steps all use source-bound facts and separate teaching text. Historical GPT/BERT, FlashAttention, MoE/MLA evolution, and chat/tool-use copy was already removed from the visible Attention workbench. The four topic labels live in the hidden `延伸阅读` registry. Table 2's cited MoE result comes from the supplied paper and remains in the table. The lead-in translation is the only Task 1 data edit supported by this audit. The original PDF, previews, English reader, lesson and explanation registries are byte-for-byte or Git-diff identical to the baseline.

## Exact browser commands

Chrome 158.0.8127.37, using the locally installed Playwright CLI via its wrapper. The runner opens a fresh Chrome session per suite, applies the legacy port and outer-panel selector adaptations recorded in Task 4, and serves an empty Google Fonts stylesheet from the route handler. All other non-loopback requests are aborted. Task 2 suite files were present locally in the SDD workspace.

```sh
npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
```

In a second terminal at the repo root:

```sh
s=.superpowers/sdd/2026-11-26-attention-workbench
bash "$s/task-5-run-browser.sh" "$s"/task-[2345]*browser.js > "$s/task-5-browser-final.log" 2>&1
```

The focused run before correcting the Figure 2 tooltip used the same runner with only `"$s/task-5-browser.js"` and failed with `Error: 1440x900 light: Figure 2 hover fact source`.

## Exact audit, data, and build commands

Node 22.22.1. The local Python environment used pdfplumber 0.11.9, pypdfium2 5.13.0, and Pillow 13.0.0.

```sh
set -e
s=.superpowers/sdd/2026-11-26-attention-workbench
export PDF_PYTHON="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python"
node scripts/attention-audit.mjs > "$s/task-5-audit.json"
node scripts/attention-pdf-inventory.mjs --validate > "$s/task-5-inventory.json"
node --test scripts/attention-audit.test.mjs scripts/attention-pdf-inventory.test.mjs scripts/attention-reader.test.mjs > "$s/task-5-data-tests.log"
npm run build > "$s/task-5-build.log" 2>&1
cmp public/article/1706.03762v7.pdf dist/article/1706.03762v7.pdf
git diff --exit-code 2f57bdf -- public/article/1706.03762v7.pdf public/article/attention src/data/papers/attention/{lessons,explainables,figures,originals-en}.ts src/components/paper/attention-original-text.json
git diff --check
```

## Audit and inventory results

Both commands exited 0. The audit result below includes the coverage and issue fields. The JSON output also lists the individual claim and formula checks with their page numbers and each Figure/Table preview result.

```json
{
  "pdf": {
    "asset": "/article/1706.03762v7.pdf",
    "sha256": "bdfaa68d8984f0dc02beaca527b76f207d99b666d31d1da728ee0728182df697",
    "pages": 15
  },
  "coverage": {
    "sections": 27,
    "englishReaderBlocksMatchingPdf": 27,
    "references": 40,
    "appendixCaptions": 3,
    "lessons": 10,
    "steps": 28,
    "explainables": 34,
    "keyClaims": {
      "matched": 13,
      "total": 13
    },
    "formulas": {
      "matched": 9,
      "total": 9
    }
  },
  "missingPreviews": [],
  "orphanedExplainables": [],
  "offPaperContent": [],
  "issues": []
}
```

The independent inventory returned 27 sections, 34 explainables, 10 lessons, 28 steps and `"issues": []`. All nine previews matched their PDF crops.

## Data test results

Exit 0. Exact TAP output follows.

```text
TAP version 13
# Subtest: audits the supplied PDF, displayed tables and both reader mappings
ok 1 - audits the supplied PDF, displayed tables and both reader mappings
  ---
  duration_ms: 4077.216875
  type: 'test'
  ...
# Subtest: rejects misattributed BLEU, altered formulas, swapped table columns and uncited copy
ok 2 - rejects misattributed BLEU, altered formulas, swapped table columns and uncited copy
  ---
  duration_ms: 4036.124417
  type: 'test'
  ...
# Subtest: identifies the BLEU step when its source is changed to another valid passage
ok 3 - identifies the BLEU step when its source is changed to another valid passage
  ---
  duration_ms: 1557.892833
  type: 'test'
  ...
# Subtest: identifies omitted author credits and numbered references in the Chinese reader
ok 4 - identifies omitted author credits and numbered references in the Chinese reader
  ---
  duration_ms: 1727.263583
  type: 'test'
  ...
# Subtest: all nine captions and titles resolve to their exact supplied PDF page
ok 5 - all nine captions and titles resolve to their exact supplied PDF page
  ---
  duration_ms: 2.01475
  type: 'test'
  ...
# Subtest: each Chinese section aligns with an English entry and its exact source range
ok 6 - each Chinese section aligns with an English entry and its exact source range
  ---
  duration_ms: 0.19275
  type: 'test'
  ...
# Subtest: every section has a full English reading, including non-excerpt paragraphs and page continuations
ok 7 - every section has a full English reading, including non-excerpt paragraphs and page continuations
  ---
  duration_ms: 1.738625
  type: 'test'
  ...
# Subtest: Table 3 columns carry distinct source-grounded parameter explanations
ok 8 - Table 3 columns carry distinct source-grounded parameter explanations
  ---
  duration_ms: 0.251
  type: 'test'
  ...
1..8
# tests 8
# suites 0
# pass 8
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 8180.208334
```

## Production build results

Exit 0. Exact build output follows.

```text

> ai-paper-atlas@0.1.0 build
> tsc --noEmit && vite build

vite v7.3.8 building client environment for production...
transforming...
✓ 1211 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                       1.09 kB │ gzip:   0.59 kB
dist/assets/index-D7CcjKhQ.css       42.01 kB │ gzip:   9.29 kB
dist/assets/ForceOrbit-DqiCq9ar.js  206.43 kB │ gzip:  71.02 kB
dist/assets/index-BB9L1zEC.js       589.09 kB │ gzip: 199.00 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.55s
```

The PDF byte comparison, baseline source comparison, and whitespace checks exited 0 with empty output.

## Browser results

The runner exited 0 with 15 successful suites, comprising 14 existing Task 2–4 suites and the Task 5 matrix. Exact results follow.

```text
task-2-browser
### Result
"Passed mode switching, source context, playback and progress, PDF, desktop columns and 390/320px overflow checks in light/dark themes."
task-2-round1-browser
### Result
"Passed responsive SVG reachability/readability, zoom clipping, overflow, replay timer reset, and deep translation chapter reveal."
task-2-round3-browser
### Result
"Passed 768px top visibility, 320px functional zoom bounds, right-panned tooltip visibility, and document overflow checks."
task-2-round4-browser
### Result
{"cursorGapsPx":[11,11,11],"reachableNodes":11,"directCellClicks":16}
task-3-browser
### Result
"Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion."
task-3-round1-browser
### Result
"Passed explainable architecture flows, distinct Softmax identity, and 320px trigger separation."
task-3-round2-browser
### Result
"Passed output data-flow targets, distinct attention/output Softmax identities, full sourced tooltip content, and 320x760 placement."
task-3-round3-browser
### Result
"Passed 320x760 interactive sourced tooltip content/scrolling and encoder/decoder residual hit ordering."
task-3-round4-browser
### Result
"Passed focused K restoration, Enter/Escape, and pointer-only card retention and dismissal."
task-4-browser
### Result
"Passed all nine previews and redraw tabs, PDF fallback on image failure, exact badges, chapter/step links, four tables and cell hover/focus, all 27 bilingual mappings and narrow scrolling in light/dark."
task-4-round1-browser
### Result
"Passed bilingual chapter handoff, direct figure chapter links, and distinct Table 3 parameter explanations."
task-4-round2-browser
### Result
"Passed References-to-Figures normalization, row E positional-embedding explanation, and p.7 training source footers."
task-4-round3-browser
### Result
"Passed Figures filter preservation, §6.1/§4/References coverage, and row E merged-versus-metric explainables."
task-4-round4-browser
### Result
"Passed §4 → BLEU/Table 2, References via Learn → all nine cards, unchanged lesson context, §6.1 direct link, manual filters and revisited-step reset."
```

The matrix result is below. The corner probe repositions a real formula trigger at each corner to exercise the placement algorithm. It also uses an unmodified SVG node for hover and verifies both the figure preview and embedded PDF fallbacks.

```text
task-5-browser
### Result
["1440x900 light: 4 modes, no overflow, 4 hover + 4 focus corners, pause/replay/reduced motion, both PDF fallbacks","1440x900 dark: 4 modes, no overflow, 4 hover + 4 focus corners, pause/replay/reduced motion, both PDF fallbacks","1024x900 light: 4 modes, no overflow, 4 hover + 4 focus corners, pause/replay/reduced motion, both PDF fallbacks","1024x900 dark: 4 modes, no overflow, 4 hover + 4 focus corners, pause/replay/reduced motion, both PDF fallbacks","390x844 light: 4 modes, no overflow, 4 hover + 4 focus corners, pause/replay/reduced motion, both PDF fallbacks","390x844 dark: 4 modes, no overflow, 4 hover + 4 focus corners, pause/replay/reduced motion, both PDF fallbacks"]
```

## Residual concerns

- Vite retains the 500 kB advisory for the main chunk at 589.09 kB minified.
- Browser acceptance used Chrome. The native PDF viewer depends on browser support, and the direct supplied-PDF link was tested.
- The figures in the appendix redraw selected connections at uniform visual weight. Figure links retain the original plots. The previously reported 1024×184 tooltip case falls outside this browser matrix.
- The automated claims list covers explicit facts and formulas. Translation and redraw interpretation also received manual source review. Preview pixel comparison depends on the renderer versions noted above.
- Final review was a self-review. This session had no code-review subagent tool.

# Task 5 fix round 1

The audit and tests now cover the three reproduced mutation failures.

- Training entries have explicit expected values and PDF locations for batch data, hardware and schedule, optimizer parameters and warmup exponent, residual dropout, and label smoothing. Both the explainable record and the generated Learn step are checked.
- Table cells preserve superscript exponent semantics. The PDF extraction helper restores scientific-notation superscripts, and the audit reports an exponent-structure issue when a value such as `2.3 · 10¹⁹` becomes `2.3 · 1019`.
- Appendix captions are checked by stable `figure-3`, `figure-4`, and `figure-5` mappings, each with its source page and `appendix` original ID. Figure cards use those IDs for Chinese tooltip facts and cite the matching appendix page.

No supplied PDF bytes or Task 1 registries changed in this fix round. The browser runner now fulfills blocked external requests with empty responses so the offline replay does not manufacture console network errors.

## Exact fix-round verification commands

Data, audit, inventory, and build:

```sh
export PDF_PYTHON="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python"
node --test scripts/attention-audit.test.mjs scripts/attention-reader.test.mjs scripts/attention-pdf-inventory.test.mjs
node scripts/attention-audit.mjs > .superpowers/sdd/2026-11-26-attention-workbench/task-5-fix1-audit.json
node scripts/attention-pdf-inventory.mjs --validate | tail -10
npm run build
cmp public/article/1706.03762v7.pdf dist/article/1706.03762v7.pdf
git diff --check
git diff --exit-code c2e6057 -- public/article/1706.03762v7.pdf src/data/papers/attention/{lessons,explainables,figures,originals-en}.ts src/components/paper/attention-original-text.json
```

Exact test output:

```text
1..11
# tests 11
# pass 11
# fail 0
# cancelled 0
# skipped 0
```

Exact inventory result:

```text
"sections": 27,
"explainables": 34,
"lessons": 10,
"steps": 28,
"issues": []
```

The audit JSON reported `issues: []`, 13/13 key claims, 9/9 formulas, 27 English reader blocks, 40 references, 3 stable appendix captions, 34 explainables, 10 lessons, and 28 steps. The production build exited 0 and reported 1211 transformed modules. Vite retained its existing warning for the 589.26 kB minified main chunk. PDF comparison, Task 1 source comparison, and `git diff --check` exited 0 with empty output.

Browser replay:

```sh
npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
s=.superpowers/sdd/2026-11-26-attention-workbench
bash "$s/task-5-run-browser.sh" "$s"/task-[2345]*browser.js > "$s/task-5-fix1-browser-final.log" 2>&1
```

Exact browser result count and output:

```text
15 successful suites
task-2-browser: Passed mode switching, source context, playback and progress, PDF, desktop columns and 390/320px overflow checks in light/dark themes.
task-2-round1-browser: Passed responsive SVG reachability/readability, zoom clipping, overflow, replay timer reset, and deep translation chapter reveal.
task-2-round3-browser: Passed 768px top visibility, 320px functional zoom bounds, right-panned tooltip visibility, and document overflow checks.
task-2-round4-browser: {"cursorGapsPx":[11,11,11],"reachableNodes":11,"directCellClicks":16}
task-3-browser: Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion.
task-3-round1-browser: Passed explainable architecture flows, distinct Softmax identity, and 320px trigger separation.
task-3-round2-browser: Passed output data-flow targets, distinct attention/output Softmax identities, full sourced tooltip content, and 320x760 placement.
task-3-round3-browser: Passed 320x760 interactive sourced tooltip content/scrolling and encoder/decoder residual hit ordering.
task-3-round4-browser: Passed focused K restoration, Enter/Escape, and pointer-only card retention and dismissal.
task-4-browser: Passed all nine previews and redraw tabs, PDF fallback on image failure, exact badges, chapter/step links, four tables and cell hover/focus, all 27 bilingual mappings and narrow scrolling in light/dark.
task-4-round1-browser: Passed bilingual chapter handoff, direct figure chapter links, and distinct Table 3 parameter explanations.
task-4-round2-browser: Passed References-to-Figures normalization, row E positional-embedding explanation, and p.7 training source footers.
task-4-round3-browser: Passed Figures filter preservation, §6.1/§4/References coverage, and row E merged-versus-metric explainables.
task-4-round4-browser: Passed §4 → BLEU/Table 2, References via Learn → all nine cards, unchanged lesson context, §6.1 direct link, manual filters and revisited-step reset.
task-5-browser: Passed 1440x900, 1024x900, and 390x844 light/dark matrix with all four modes, no overflow, four hover corners, four focus corners, pause/replay, reduced motion, and both PDF fallbacks.
```

The first replay attempt exited 1 because the runner aborted external requests and the existing Task 2 console-error assertion reported those synthetic failures. The committed runner was changed to fulfill those requests with empty responses. The final replay exited 0 with all 15 suites successful.
