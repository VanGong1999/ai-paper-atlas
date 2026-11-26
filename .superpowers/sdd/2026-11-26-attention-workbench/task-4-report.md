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
