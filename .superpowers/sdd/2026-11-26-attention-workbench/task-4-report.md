# Attention workbench Task 4 report

## Implementation and sources

- Figures exposes five figures and four tables from the Task 1 registry. Cards include section filters, registry captions, exact PDF page badges, original/re-draw tabs and links to related Learn steps and bilingual sections. The original tab uses crops of the supplied PDF and retains a direct page link if a crop fails to load.
- The gallery reuses the existing architecture drawing and shared explanation controller. The Figure 2 redraw follows the two original operation flows. Appendix redraws show selected visible connections from the original panels. The four HTML tables preserve printed precision, blanks, and merged cells, including the two Transformer training-cost cells in Table 2 and the positional-embedding row in Table 3.
- The English reader uses PDF-derived paragraphs, equations, footnotes, 40 reference entries and the three appendix captions. All 27 Chinese blocks are read from the existing Task 1 registry and paired with the same English ID and page range. The shared Learn and manual reading positions persist across modes.
- The original asset is `public/article/1706.03762v7.pdf`, SHA-256 `bdfaa68d8984f0dc02beaca527b76f207d99b666d31d1da728ee0728182df697`. The source data diff and distribution PDF comparison were empty.

## Data completeness and TDD

Commands run from the repository root in zsh.

```sh
node --disable-warning=ExperimentalWarning --test scripts/attention-reader.test.mjs
```

Before implementation, exit 1 with 2 passes and 1 failure. The original registry tests confirmed nine exact per-page fallbacks and 27 Chinese-to-English source IDs. The full-reading assertion failed with `Full English reading is missing`. The figures already had valid PDF fallbacks and the section map already existed.

```sh
npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
pw=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
suite=.superpowers/sdd/2026-11-26-attention-workbench
"$pw" -s=task4-red open http://127.0.0.1:5184/papers/attention --browser=chrome
"$pw" -s=task4-red run-code "$(cat "$suite/task-4-browser.js")" | sed '/^### Ran Playwright code/,$d'
```

The Chrome assertions returned `### Error`, starting with `all originals, badges, fallback and redraws: Expected nine registered cards`. The filter, original/redraw tabs, English source badges and narrow table scroller were also missing. The CLI exits successfully at the shell level even for a failed browser assertion, so final runs explicitly require the `### Result` marker. Port 5184 was used because 5178 was occupied.

```sh
/Users/gongfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python scripts/attention-reader-assets.py
node --disable-warning=ExperimentalWarning --test scripts/attention-reader.test.mjs
```

Both exited 0. The final run reported 3 tests passed, 0 failed. The full-reading checks also compare the bibliography and available registry excerpts with the PDF-derived reading.

The first build identified the duplicate `Explainable` type and component names in one import scope. A type alias resolved the collision. A later Chrome assertion detected the missing printed section number in the chapter filter, returning `Chapter filter must use the printed section number` for the `task4-label-red` session. The final suite checks the corrected filter label and confirms keyboard switching for the card tabs.

## Focused Chrome and Task 2/3 regression suites

```zsh
pw=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
suite=.superpowers/sdd/2026-11-26-attention-workbench
run_browser() {
  local script="$1" session="t4-final-$1"
  "$pw" -s="$session" open http://127.0.0.1:5184/papers/attention --browser=chrome >/dev/null || return 1
  local result
  result=$("$pw" -s="$session" run-code "$(sed -e 's/127\.0\.0\.1:5178/127.0.0.1:5184/g' -e "s/page.getByRole('tabpanel')/page.locator('#paper-mode-panel')/g" "$suite/$script.js")")
  print -r -- "$result" | sed '/^### Ran Playwright code/,$d'
  "$pw" -s="$session" close >/dev/null
  [[ "$result" == '### Result'* ]]
}
suite_exit=0
for script in task-4-browser task-2-browser task-2-round1-browser task-2-round3-browser task-2-round4-browser task-3-browser task-3-round1-browser task-3-round2-browser task-3-round3-browser task-3-round4-browser; do
  print -r -- "$script"
  run_browser "$script" || suite_exit=1
done
exit "$suite_exit"
```

The replay adapts the local URL and scopes the legacy outer-tabpanel selector. The initial unscoped Task 2 run reported 10 tab panels once the Figures tab opened, comprising the outer panel and nine card panels. All original behavior assertions are retained. The focused run tested 1440px, 390px and 320px, forced a preview failure to check the direct PDF fallback, and returned

```text
"Passed all nine previews and redraw tabs, PDF fallback on image failure, exact badges, chapter/step links, four tables and cell hover/focus, all 27 bilingual mappings and narrow scrolling in light/dark."
```

## Production build and source integrity

```sh
npm run build && cmp public/article/1706.03762v7.pdf dist/article/1706.03762v7.pdf && git diff --exit-code b8d9909 -- src/data/papers/attention public/article/1706.03762v7.pdf && git diff --check
```

Exit 0. TypeScript passed and Vite transformed 1211 modules and built in 1.87 seconds. The main chunk was 583.37 kB minified and 197.08 kB gzipped. Vite reported its 500 kB advisory. The PDF byte comparison, Task 1 data comparison and whitespace checks completed silently.

## PDF inventory tests and validation

```zsh
export PDF_PYTHON=/Users/gongfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python
set -o pipefail
node --test scripts/attention-pdf-inventory.test.mjs && node scripts/attention-pdf-inventory.mjs --validate | tail -10
```

Exit 0. Both inventory tests passed. Validation reported 27 sections, 34 explainables, 10 lessons, 28 steps and `"issues": []`.

## Task 2 and Task 3 Chrome regression results

The loop above exited 1 because the two main suites captured `net::ERR_CONNECTION_CLOSED` from the existing Google Fonts stylesheet. All seven round-specific suites passed in that run. A standalone Task 2 retry with the same URL and selector adaptation also hit the font endpoint error. The following rerun isolated that dependency by serving an empty stylesheet for that one external URL, so Chrome used the app's configured fallback fonts. The local app, source assets and assertions were exercised directly.

```zsh
pw=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
suite=.superpowers/sdd/2026-11-26-attention-workbench
run_offline_browser() {
  local name="$1" session="t4-offline-$1"
  "$pw" -s="$session" open about:blank --browser=chrome >/dev/null || return 1
  local code result
  code=$(sed -e 's/127\.0\.0\.1:5178/127.0.0.1:5184/g' -e "s/page.getByRole('tabpanel')/page.locator('#paper-mode-panel')/g" "$suite/$name.js")
  result=$("$pw" -s="$session" run-code "async (page) => {
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await page.goto('http://127.0.0.1:5184/papers/attention')
    return await ($code)(page)
  }")
  print -r -- "$result" | sed '/^### Ran Playwright code/,$d'
  "$pw" -s="$session" close >/dev/null
  [[ "$result" == '### Result'* ]]
}
suite_exit=0
for script in task-2-browser task-3-browser; do
  print -r -- "$script"
  run_offline_browser "$script" || suite_exit=1
done
exit "$suite_exit"
```

Both passed, exit 0. The nine regression results, using the two successful reruns where applicable, were

| Suite | Result |
| --- | --- |
| task-2-browser | Passed mode switching, source context, playback and progress, PDF, desktop columns and 390/320px overflow checks in light/dark themes. |
| task-2-round1-browser | Passed responsive SVG reachability/readability, zoom clipping, overflow, replay timer reset, and deep translation chapter reveal. |
| task-2-round3-browser | Passed 768px top visibility, 320px functional zoom bounds, right-panned tooltip visibility, and document overflow checks. |
| task-2-round4-browser | `{"cursorGapsPx":[11,11,11],"reachableNodes":11,"directCellClicks":16}` |
| task-3-browser | Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion. |
| task-3-round1-browser | Passed explainable architecture flows, distinct Softmax identity, and 320px trigger separation. |
| task-3-round2-browser | Passed output data-flow targets, distinct attention/output Softmax identities, full sourced tooltip content, and 320x760 placement. |
| task-3-round3-browser | Passed 320x760 interactive sourced tooltip content/scrolling and encoder/decoder residual hit ordering. |
| task-3-round4-browser | Passed focused K restoration, Enter/Escape, and pointer-only card retention and dismissal. |

## Residual concerns

- Chrome was the browser exercised. The Vite chunk-size advisory and intermittent external font availability remain.
- Appendix redraws show selected connections at a uniform visual weight. The original tab and PDF link retain each full visualization.
- The reader regularization lead-in says three types, followed by two named paragraphs in this PDF. Section 6.1 reports 41.0 for English–French and Table 2 reports 41.8. The corresponding PDF readings are preserved.

## Task 4 fix round 1

Reviewer finding 1 was caused by `figureChapter` being independent state. The main mode-tab transition retained the selected bilingual `translationId` without copying it into the Figures filter. The fix copies that chapter when the main Figures tab is selected. Direct card links continue to set the explicit chapter themselves.

Reviewer finding 2 was caused by every Table 3 configuration column using the shared `variants` explanation. The fix keeps Task 1 data unchanged and supplies component-local, PDF-grounded explainables for N, d_model, d_ff, h, d_k, d_v, P_drop, ε_ls, train steps, PPL, BLEU and params. The redraw also exposes the nearby §5.1 batch-token and §5.3 learning-rate context. Table 3 h now cites the §3.2.2 head configuration and A-group behavior. ε_ls cites §5.4 and the D-group variation. P_drop cites §5.4 and the §6.2 over-fitting observation.

Focused regression command

```sh
PW=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
"$PW" -s=t4-round1-final5 open http://127.0.0.1:5184/papers/attention --browser=chrome
result=$("$PW" -s=t4-round1-final5 run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-4-round1-browser.js)")
print -r -- "$result" | sed '/^### Ran Playwright code/,$d'
"$PW" -s=t4-round1-final5 close
```

Output and exit 0

```text
### Result
"Passed bilingual chapter handoff, direct figure chapter links, and distinct Table 3 parameter explanations."
```

The data check was extended with a fourth assertion.

```sh
node --disable-warning=ExperimentalWarning --test scripts/attention-reader.test.mjs
```

Output and exit 0

```text
1..4
# tests 4
# pass 4
# fail 0
```

The focused check initially selected a D-group P_drop cell while intending ε_ls, then the selector was narrowed to the printed `ϵ_ls` column. A second inspection confirmed the final tooltip contents. The final focused run checks the Chinese chapter handoff, direct chapter links, `标签平滑` for ε_ls, and `注意力头数` for h.

Full Task 4 command

```sh
PW=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
"$PW" -s=t4-pty-task4b open http://127.0.0.1:5184/papers/attention --browser=chrome
result=$("$PW" -s=t4-pty-task4b run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-4-browser.js)")
print -r -- "$result" | sed '/^### Ran Playwright code/,$d'
"$PW" -s=t4-pty-task4b close
```

Output and exit 0

```text
### Result
"Passed all nine previews and redraw tabs, PDF fallback on image failure, exact badges, chapter/step links, four tables and cell hover/focus, all 27 bilingual mappings and narrow scrolling in light/dark."
```

The narrow check now resets the gallery filter to `all` before measuring Table 3's local scroll area. This makes the existing full-gallery check independent of the preceding bilingual chapter selection.

Task 2 and Task 3 regression commands

```zsh
PW=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
suite=.superpowers/sdd/2026-11-26-attention-workbench
run_suite() {
  local name="$1" session="t4-reg-$1"
  "$PW" -s="$session" open http://127.0.0.1:5184/papers/attention --browser=chrome >/dev/null || return 1
  local source result
  source=$(sed -e 's/127\.0\.0\.1:5178/127.0.0.1:5184/g' -e "s/page.getByRole('tabpanel')/page.locator('#paper-mode-panel')/g" "$suite/$name.js")
  result=$("$PW" -s="$session" run-code "$source")
  print -r -- "$name"
  print -r -- "$result" | sed '/^### Ran Playwright code/,$d'
  "$PW" -s="$session" close >/dev/null
  [[ "$result" == '### Result'* ]]
}
run_suite task-2-browser
run_suite task-2-round1-browser
run_suite task-2-round3-browser
run_suite task-2-round4-browser
run_suite task-3-browser
run_suite task-3-round1-browser
run_suite task-3-round2-browser
run_suite task-3-round3-browser
run_suite task-3-round4-browser
```

All commands exited 0. Results

```text
task-2-browser: Passed mode switching, source context, playback and progress, PDF, desktop columns and 390/320px overflow checks in light/dark themes.
task-2-round1-browser: Passed responsive SVG reachability/readability, zoom clipping, overflow, replay timer reset, and deep translation chapter reveal.
task-2-round3-browser: Passed 768px top visibility, 320px functional zoom bounds, right-panned tooltip visibility, and document overflow checks.
task-2-round4-browser: {"cursorGapsPx":[11,11,11],"reachableNodes":11,"directCellClicks":16}
task-3-browser: Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion.
task-3-round1-browser: Passed explainable architecture flows, distinct Softmax identity, and 320px trigger separation.
task-3-round2-browser: Passed output data-flow targets, distinct attention/output Softmax identities, full sourced tooltip content, and 320x760 placement.
task-3-round3-browser: Passed 320x760 interactive sourced tooltip content/scrolling and encoder/decoder residual hit ordering.
task-3-round4-browser: Passed focused K restoration, Enter/Escape, and pointer-only card retention and dismissal.
```

Final build and integrity command

```sh
npm run build
cmp public/article/1706.03762v7.pdf dist/article/1706.03762v7.pdf
git diff --check
git diff --exit-code b9a5857 -- src/data/papers/attention public/article/1706.03762v7.pdf
```

Output and exit 0

```text
✓ 1211 modules transformed.
✓ built in 1.50s
dist/assets/index-DUtfHxVc.js 587.94 kB | gzip: 198.65 kB
```

Vite retained its existing 500 kB advisory. The Task 1 data/PDF diff, PDF byte comparison and whitespace checks completed silently.

Final data and PDF inventory command

```sh
node --disable-warning=ExperimentalWarning --test scripts/attention-reader.test.mjs
export PDF_PYTHON=/Users/gongfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python
set -o pipefail
node --test scripts/attention-pdf-inventory.test.mjs && node scripts/attention-pdf-inventory.mjs --validate | tail -10
```

Both exited 0. The reader check reported 4 passed and 0 failed. The inventory check reported 2 passed and validation ended with `"sections": 27`, `"explainables": 34`, `"lessons": 10`, `"steps": 28` and `"issues": []`.

## Task 4 fix round 2

The References/all-chapters handoff now normalizes unsupported reader chapter IDs to `all` before rendering or storing the Figures filter. Valid figure-bearing chapter IDs remain explicit, including direct figure-specific links. Table 3 merged row E now supplies a row-level explainable for learned positional embeddings replacing sinusoidal positional encoding. The learning-rate/warmup and batch-token explainables now use their training-section sources on PDF p. 7, with `5.3 Optimizer` and `5.1 Training Data and Batching` labels.

Focused data command

```sh
node --disable-warning=ExperimentalWarning --test scripts/attention-reader.test.mjs
```

Output and exit 0

```text
1..4
# tests 4
# pass 4
# fail 0
```

Focused Chrome command

```sh
PW=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
"$PW" -s=t4-round2-pass open http://127.0.0.1:5184/papers/attention --browser=chrome >/dev/null
"$PW" -s=t4-round2-pass run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-4-round2-browser.js)"
```

Output and exit 0

```text
### Result
"Passed References-to-Figures normalization, row E positional-embedding explanation, and p.7 training source footers."
```

The focused browser assertions observed `chapter: all` and `cards: 9` after References → Figures, verified row E with `learned positional embeddings`, `PDF p. 9`, and no layer-count explanation, and verified warmup and batch-token footers with `5.3 Optimizer` / `5.1 Training Data` and `PDF p. 7`.

Full Chrome regression command

```zsh
PW=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
suite=.superpowers/sdd/2026-11-26-attention-workbench
run_suite() {
  local name="$1" session="r2-suite-$1"
  "$PW" -s="$session" open http://127.0.0.1:5184/papers/attention --browser=chrome >/dev/null || return 1
  local source result
  source=$(sed -e 's/127\.0\.0\.1:5178/127.0.0.1:5184/g' -e "s/page.getByRole('tabpanel')/page.locator('#paper-mode-panel')/g" "$suite/$name.js")
  result=$("$PW" -s="$session" run-code "$source")
  print -r -- "$name"
  print -r -- "$result" | sed '/^### Ran Playwright code/,$d'
  "$PW" -s="$session" close >/dev/null 2>&1 || true
  [[ "$result" == '### Result'* ]]
}
run_suite task-4-round2-browser
run_suite task-4-browser
run_suite task-2-browser
run_suite task-2-round1-browser
run_suite task-2-round3-browser
run_suite task-2-round4-browser
run_suite task-3-browser
run_suite task-3-round1-browser
run_suite task-3-round2-browser
run_suite task-3-round3-browser
run_suite task-3-round4-browser
```

Output and exit 0

```text
task-4-round2-browser: Passed References-to-Figures normalization, row E positional-embedding explanation, and p.7 training source footers.
task-4-browser: Passed all nine previews and redraw tabs, PDF fallback on image failure, exact badges, chapter/step links, four tables and cell hover/focus, all 27 bilingual mappings and narrow scrolling in light/dark.
task-2-browser: Passed mode switching, source context, playback and progress, PDF, desktop columns and 390/320px overflow checks in light/dark themes.
task-2-round1-browser: Passed responsive SVG reachability/readability, zoom clipping, overflow, replay timer reset, and deep translation chapter reveal.
task-2-round3-browser: Passed 768px top visibility, 320px functional zoom bounds, right-panned tooltip visibility, and document overflow checks.
task-2-round4-browser: {"cursorGapsPx":[11,11,11],"reachableNodes":11,"directCellClicks":16}
task-3-browser: Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion.
task-3-round1-browser: Passed explainable architecture flows, distinct Softmax identity, and 320px trigger separation.
task-3-round2-browser: Passed output data-flow targets, distinct attention/output Softmax identities, full sourced tooltip content, and 320x760 placement.
task-3-round3-browser: Passed 320x760 interactive sourced tooltip content/scrolling and encoder/decoder residual hit ordering.
task-3-round4-browser: Passed focused K restoration, Enter/Escape, and pointer-only card retention and dismissal.
```

Build, inventory, and integrity command

```sh
npm run build
node --disable-warning=ExperimentalWarning --test scripts/attention-reader.test.mjs
export PDF_PYTHON=/Users/gongfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python
set -o pipefail
node --test scripts/attention-pdf-inventory.test.mjs && node scripts/attention-pdf-inventory.mjs --validate | tail -10
cmp public/article/1706.03762v7.pdf dist/article/1706.03762v7.pdf
git diff --exit-code b9a5857 -- src/data/papers/attention public/article/1706.03762v7.pdf
git diff --check
```

Output and exit 0

```text
✓ 1211 modules transformed.
✓ built in 1.29s
index-BjR3Qric.js 588.65 kB | gzip: 198.91 kB
reader: 4 passed, 0 failed
inventory: 2 passed, 0 failed
validation: sections 27, explainables 34, lessons 10, steps 28, issues []
```

The existing Vite advisory remains for the main bundle exceeding 500 kB. No Task 1 data or supplied PDF bytes changed.

## Task 4 fix round 3

The Figures mode now tracks whether its current chapter filter was explicitly chosen or entered by a direct figure link. A mode switch from bilingual fulltext still hands off a valid chapter and normalizes unsupported chapters such as References to `all`. Switching Figures → Learn → Figures preserves the explicit valid filter, and direct `本节图表 →` links set an explicit filter without being overwritten. Table 3 row-level content now applies only to cells spanning multiple columns, so row E's merged cell uses the positional-embedding explanation while its PPL and BLEU metric cells use their own column explainables.

Focused red regression command before implementation

```sh
PW=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
"$PW" -s=t4-round3-red2 open http://127.0.0.1:5184/papers/attention --browser=chrome >/dev/null
"$PW" -s=t4-round3-red2 run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-4-round3-browser.js)"
```

Expected red output

```text
### Error
Error: Figures → Learn → Figures should preserve §6.1 filter
```

Focused green command

```sh
PW=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
"$PW" -s=t4-round3-final open http://127.0.0.1:5184/papers/attention --browser=chrome >/dev/null
"$PW" -s=t4-round3-final run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-4-round3-browser.js)"
```

Output and exit 0

```text
### Result
"Passed Figures filter preservation, §6.1/§4/References coverage, and row E merged-versus-metric explainables."
```

The focused check verified §6.1 → Table 2 across Figures → Learn → Figures and through the direct chapter figure link, bilingual §4 → Table 1, References → all nine cards, row E's merged positional-embedding tooltip, and distinct PPL/BLEU tooltips for 4.92 and 25.7.

Full Chrome regression command

```zsh
PW=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
suite=.superpowers/sdd/2026-11-26-attention-workbench
run_suite() {
  local name="$1" session="r3-suite-$1"
  "$PW" -s="$session" open http://127.0.0.1:5184/papers/attention --browser=chrome >/dev/null || return 1
  local source result
  source=$(sed -e 's/127\.0\.0\.1:5178/127.0.0.1:5184/g' -e "s/page.getByRole('tabpanel')/page.locator('#paper-mode-panel')/g" "$suite/$name.js")
  result=$("$PW" -s="$session" run-code "$source")
  print -r -- "$name"
  print -r -- "$result" | sed '/^### Ran Playwright code/,$d'
  "$PW" -s="$session" close >/dev/null 2>&1 || true
  [[ "$result" == '### Result'* ]]
}
run_suite task-4-round3-browser
run_suite task-4-browser
run_suite task-2-browser
run_suite task-2-round1-browser
run_suite task-2-round3-browser
run_suite task-2-round4-browser
run_suite task-3-browser
run_suite task-3-round1-browser
run_suite task-3-round2-browser
run_suite task-3-round3-browser
run_suite task-3-round4-browser
```

Output and exit 0

```text
task-4-round3-browser: Passed Figures filter preservation, §6.1/§4/References coverage, and row E merged-versus-metric explainables.
task-4-browser: Passed all nine previews and redraw tabs, PDF fallback on image failure, exact badges, chapter/step links, four tables and cell hover/focus, all 27 bilingual mappings and narrow scrolling in light/dark.
task-2-browser: Passed mode switching, source context, playback and progress, PDF, desktop columns and 390/320px overflow checks in light/dark themes.
task-2-round1-browser: Passed responsive SVG reachability/readability, zoom clipping, overflow, replay timer reset, and deep translation chapter reveal.
task-2-round3-browser: Passed 768px top visibility, 320px functional zoom bounds, right-panned tooltip visibility, and document overflow checks.
task-2-round4-browser: {"cursorGapsPx":[11,11,11],"reachableNodes":11,"directCellClicks":16}
task-3-browser: Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion.
task-3-round1-browser: Passed explainable architecture flows, distinct Softmax identity, and 320px trigger separation.
task-3-round2-browser: Passed output data-flow targets, distinct attention/output Softmax identities, full sourced tooltip content, and 320x760 placement.
task-3-round3-browser: Passed 320x760 interactive sourced tooltip content/scrolling and encoder/decoder residual hit ordering.
task-3-round4-browser: Passed focused K restoration, Enter/Escape, and pointer-only card retention and dismissal.
```

Build, data, inventory, and integrity command

```sh
npm run build && node --disable-warning=ExperimentalWarning --test scripts/attention-reader.test.mjs && export PDF_PYTHON=/Users/gongfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python && node --test scripts/attention-pdf-inventory.test.mjs && node scripts/attention-pdf-inventory.mjs --validate | tail -10 && cmp public/article/1706.03762v7.pdf dist/article/1706.03762v7.pdf && git diff --exit-code b9a5857 -- src/data/papers/attention public/article/1706.03762v7.pdf && git diff --check
```

Output and exit 0

```text
✓ 1211 modules transformed.
✓ built in 1.33s
index-Cn_FO7Cp.js 588.84 kB | gzip: 199.00 kB
reader: 4 passed, 0 failed
inventory: 2 passed, 0 failed
validation: sections 27, explainables 34, lessons 10, steps 28, issues []
```

The existing Vite 500 kB advisory remains. No Task 1 data or supplied PDF bytes changed.

## Task 4 fix round 4

Figures now derives its default filter from the selected translation chapter or, when there is no manual translation selection, from the current Learn step’s source. The gallery normalizes chapters without figures to `all`. A direct chapter link or manual gallery choice (including `all`) overrides that default for the current reading position. Switching tabs preserves the override. Moving to a different lesson, step, or translation chapter clears it. Step navigation and playback use the same position update. Gallery filtering leaves the lesson, step, and reading progress intact.

### Targeted Chrome reproduction

Before the fix, changing Learn steps cleared the translation ID and the Figures tab handler skipped its filter update. The handler also skipped unsupported chapters when entering Figures from Learn. The following is the exact focused suite output before the implementation change, exit 1.

```text
task-4-round4-browser
### Error
Error: §4 → Learn BLEU → Figures: expected sec6-1/table-2, got sec4/table-1
manual filter across unchanged reading views: expected sec4/table-1, got all/table-2,figure-1,figure-2,table-1,table-3,table-4,figure-3,figure-4,figure-5
References → Learn → Figures: expected all/9 cards, got sec4/table-1
revisited BLEU step after leaving it: expected sec6-1/table-2, got all/table-2,figure-1,figure-2,table-1,table-3,table-4,figure-3,figure-4,figure-5
```

### Task 2, Task 3 and Task 4 Chrome suites

Started Vite with `npm run dev -- --host 127.0.0.1 --port 5184 --strictPort`. Each `task-{2,3,4}*browser.js` ran in a fresh Chrome session using the installed Playwright CLI. The runner served an empty stylesheet for the external Google Fonts URL, navigated to `/papers/attention`, then executed the suite with `run-code`. As in earlier rounds, it replaced port 5178 with 5184 and scoped the legacy `page.getByRole('tabpanel')` selector to `#paper-mode-panel`. Each run required a `### Result` response. The final round 4 suite also checks that clicking the direct §6.1 link supersedes a manual `all` selection within the same chapter.

Exact runner output with the CLI’s echoed JavaScript omitted, exit 0.

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

### Reader data and PDF inventory

```sh
export PDF_PYTHON=/Users/gongfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python
node --disable-warning=ExperimentalWarning --test scripts/attention-reader.test.mjs scripts/attention-pdf-inventory.test.mjs
```

Exact output, exit 0.

```text
TAP version 13
# Subtest: identifies the BLEU step when its source is changed to another valid passage
ok 1 - identifies the BLEU step when its source is changed to another valid passage
  ---
  duration_ms: 2727.614042
  type: 'test'
  ...
# Subtest: identifies omitted author credits and numbered references in the Chinese reader
ok 2 - identifies omitted author credits and numbered references in the Chinese reader
  ---
  duration_ms: 1789.927958
  type: 'test'
  ...
# Subtest: all nine captions and titles resolve to their exact supplied PDF page
ok 3 - all nine captions and titles resolve to their exact supplied PDF page
  ---
  duration_ms: 2.503792
  type: 'test'
  ...
# Subtest: each Chinese section aligns with an English entry and its exact source range
ok 4 - each Chinese section aligns with an English entry and its exact source range
  ---
  duration_ms: 0.311625
  type: 'test'
  ...
# Subtest: every section has a full English reading, including non-excerpt paragraphs and page continuations
ok 5 - every section has a full English reading, including non-excerpt paragraphs and page continuations
  ---
  duration_ms: 2.148041
  type: 'test'
  ...
# Subtest: Table 3 columns carry distinct source-grounded parameter explanations
ok 6 - Table 3 columns carry distinct source-grounded parameter explanations
  ---
  duration_ms: 0.12825
  type: 'test'
  ...
1..6
# tests 6
# suites 0
# pass 6
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 4613.375917
```

```sh
set -o pipefail
node scripts/attention-pdf-inventory.mjs --validate 2>&1 | tail -10
```

Exact output, exit 0.

```text
        "redrawType": "attention-pattern"
      }
    ],
    "sections": 27,
    "explainables": 34,
    "lessons": 10,
    "steps": 28,
    "issues": []
  }
}
```

### Production build and source integrity

`npm run build` output, exit 0.

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
dist/assets/ForceOrbit-CKLKWxLx.js  206.43 kB │ gzip:  71.02 kB
dist/assets/index-FgSVEmT6.js       588.96 kB │ gzip: 198.95 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.52s
```

The following checks each exited 0 with empty output.

```sh
cmp public/article/1706.03762v7.pdf dist/article/1706.03762v7.pdf
git diff --exit-code b9a5857 -- src/data/papers/attention public/article/1706.03762v7.pdf
git diff --cached --check
```
