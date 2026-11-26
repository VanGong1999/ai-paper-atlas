# Attention workbench Task 3 report

Baseline `3b7923020ca4a315390de8ed6bbd11af7de7ea32` on `main`. The browser checks used the existing Vite server at `http://127.0.0.1:5178` and Chrome. To start that server from the repository root, use `npm run dev -- --host 127.0.0.1 --port 5178 --strictPort`.

## Implementation

- The Learn stage dispatches on the existing `lesson.stage` field. It renders the Figure 1 encoder/decoder pipeline, Figure 2 attention and multi-head pipelines, §3.5 position curves, and Table 1 comparisons. Remaining lessons render the existing source-bound nodes through the same explanation controls.
- A shared overlay pairs SVG groups and native buttons with Task 1 explainables. It opens after 100 ms, follows the pointer or focused element, flips near edges, and uses a fixed portal to avoid clipping by stage and panel scroll containers. Enter and Space select an element for the right panel, and Escape dismisses the overlay. Focused targets have an accessible description before the card opens.
- The heatmap retains all 16 selectable weights and adds query/key cross-highlighting and the selected row's weighted sum. Curves expose calculated points and two keyboard-operable controls. The Table 1 comparison exposes the twelve sourced cells and three diagram bars that update with the metric. Heatmap weights, sampled positions and calculated values, and bar inputs are explicitly labeled as teaching examples.
- SVG zoom changes the rendered SVG dimensions inside the scrollable stage. The heatmap and controls remain in normal flow. Playback pauses animated strokes, replay resets their phase and the existing step timer, and reduced motion suppresses animated strokes while retaining playback controls.
- The browser assertions and this report are tracked explicitly under the otherwise ignored `.superpowers/sdd` directory.

## Playwright before implementation

Commands

```sh
pw_task3=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
"$pw_task3" -s=attention-task3-before open http://127.0.0.1:5178/papers/attention --browser=chrome
/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh -s=attention-task3-before run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-3-browser.js)"
```

Output (exit 1, expected)

```text
### Error
Error: architecture: Missing node encoder | Q/K/V and keyboard focus: Missing query | formula variables: Missing per-variable hooks | matrix cells: Expected sixteen cell hooks | multi-head and comparison table: Expected eight explainable heads | position curves: Missing curve point hooks | viewport edges and stage pan: Missing inline formula target | playback and reduced motion: locator.evaluate: Timeout 2500ms exceeded.
```

## Playwright after implementation

The first implementation run read the outgoing card while the next target was still within its show delay. A diagnostic run observed `matrixImmediate=缩放点积` and `matrixSettled=注意力矩阵单元`. The assertions now wait for the intended card's text. A visual check exposed a collision with the home timeline's `.stage-controls` rule. The position control probe failed with `Position controls cover the curve chart` before the paper-specific CSS class was applied.

Commands

```sh
pw_task3=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
"$pw_task3" -s=attention-task3-final open http://127.0.0.1:5178/papers/attention --browser=chrome
set -o pipefail
"$pw_task3" -s=attention-task3-final run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-3-browser.js)" | sed -n '1,2p'
```

Output (exit 0)

```text
### Result
"Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion."
```

The probes check actual Tab navigation and Enter/Space activation, tooltip association and Escape, all four viewport corners at 320 px, the Stage tooltip during zoomed pan, weighted aggregation, axis interaction, and no application console errors. Browser startup logs included the existing favicon 404, excluded by the assertions.

## Task 2 Playwright regressions

Commands

```sh
pw_task3=/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh
"$pw_task3" -s=attention-task3-regressions open http://127.0.0.1:5178/papers/attention --browser=chrome
set -o pipefail
for test in task-2-round1-browser task-2-round3-browser task-2-round4-browser task-2-browser; do
  "$pw_task3" -s=attention-task3-regressions run-code "$(cat ".superpowers/sdd/2026-11-26-attention-workbench/${test}.js")" | sed -n '1,2p' || exit
done
```

Output (exit 0)

```text
### Result
"Passed responsive SVG reachability/readability, zoom clipping, overflow, replay timer reset, and deep translation chapter reveal."
### Result
"Passed 768px top visibility, 320px functional zoom bounds, right-panned tooltip visibility, and document overflow checks."
### Result
{"cursorGapsPx":[8,11,11],"reachableNodes":11,"directCellClicks":16}
### Result
"Passed mode switching, source context, playback and progress, PDF, desktop columns and 390/320px overflow checks in light/dark themes."
```

## Production build and source integrity

Command

```sh
npm run build && git diff --check && cmp public/article/1706.03762v7.pdf dist/article/1706.03762v7.pdf && git diff --exit-code -- src/data/papers/attention public/article/1706.03762v7.pdf
```

Output (exit 0)

```text
> ai-paper-atlas@0.1.0 build
> tsc --noEmit && vite build

vite v7.3.8 building client environment for production...
transforming...
✓ 1204 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                       1.09 kB │ gzip:   0.59 kB
dist/assets/index-DihrC_Bc.css       36.65 kB │ gzip:   8.28 kB
dist/assets/ForceOrbit-e3zKYG8S.js  206.43 kB │ gzip:  71.02 kB
dist/assets/index-CSftlOIc.js       532.69 kB │ gzip: 179.88 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 2.50s
```

The diff check, PDF byte comparison, and Task 1 source diff completed silently.

## PDF inventory tests and validation

Commands

```sh
export PDF_PYTHON=/Users/gongfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python
set -o pipefail
node --test scripts/attention-pdf-inventory.test.mjs && node scripts/attention-pdf-inventory.mjs --validate | tail -6
```

Output (exit 0)

```text
TAP version 13
# Subtest: identifies the BLEU step when its source is changed to another valid passage
ok 1 - identifies the BLEU step when its source is changed to another valid passage
  ---
  duration_ms: 2392.466416
  type: 'test'
  ...
# Subtest: identifies omitted author credits and numbered references in the Chinese reader
ok 2 - identifies omitted author credits and numbered references in the Chinese reader
  ---
  duration_ms: 2847.702667
  type: 'test'
  ...
1..2
# tests 2
# suites 0
# pass 2
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 5379.744875
    "explainables": 34,
    "lessons": 10,
    "steps": 28,
    "issues": []
  }
}
```

## Residual concerns

- The existing Vite chunk-size advisory remains. The main bundle is 532.69 kB before gzip.
- Browser verification used Chrome. Original Figure/Table previews remain in Task 4, with PDF source links available in Figures.

## Fix round 1

Review findings addressed

- Meaningful architecture paths now use accessible `data-flow` targets with source-bound `encoder`, `decoder`, `cross`, and `residual` explainables. Decorative paths retain their presentation-only behavior. Flow targets support hover, focus, Enter, and selection into the detail panel.
- Tooltip sizing now uses the trigger bounds for compact edge triggers, choosing a side with enough space and reducing the card width or height before placement. Larger SVG flow targets preserve cursor-near placement. The card remains viewport-safe and separated from compact triggers at 320 px.
- The Softmax operation uses the existing source-bound `softmax` explainable in the attention pipeline and inline formula. Matrix cells continue to use the distinct `weights` explainable.

Focused fix-round browser check

Command

```sh
/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh -s=attention-task3-round1 open http://127.0.0.1:5178/papers/attention --browser=chrome
/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh -s=attention-task3-round1 run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-3-round1-browser.js)"
```

Output (exit 0)

```text
Result "Passed explainable architecture flows, distinct Softmax identity, and 320px trigger separation."
```

The check verified eight architecture flow targets, no `aria-hidden` on those targets, hover and keyboard focus on the encoder-to-decoder flow, distinct Softmax identities in the pipeline and formula, and viewport-safe non-overlap at all four 320 px corners.

Full Task 3 browser check

Command

```sh
/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh -s=attention-task3-round1-final open http://127.0.0.1:5178/papers/attention --browser=chrome
/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh -s=attention-task3-round1-final run-code "$(cat .superpowers/sdd/2026-11-26-attention-workbench/task-3-browser.js)" | sed -n '1,2p'
```

Output (exit 0)

```text
Result "Passed architecture, Q/K/V, formula variables, all matrix cells, eight heads, Table 1, curve controls, tooltip hover/focus and viewport edges, stage pan, pause/replay and reduced motion."
```

Task 2 regression checks

Command

```sh
/Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh -s=attention-task2-round1-final open http://127.0.0.1:5178/papers/attention --browser=chrome
for test in task-2-round1-browser task-2-round3-browser task-2-round4-browser task-2-browser; do
  /Users/gongfan/.codex/skills/playwright/scripts/playwright_cli.sh -s=attention-task2-round1-final run-code "$(cat ".superpowers/sdd/2026-11-26-attention-workbench/${test}.js")" | sed -n '1,2p' || exit
done
```

Output (exit 0)

```text
Result "Passed responsive SVG reachability/readability, zoom clipping, overflow, replay timer reset, and deep translation chapter reveal."
Result "Passed 768px top visibility, 320px functional zoom bounds, right-panned tooltip visibility, and document overflow checks."
Result {"cursorGapsPx":[11,11,11],"reachableNodes":11,"directCellClicks":16}
Result "Passed mode switching, source context, playback and progress, PDF, desktop columns and 390/320px overflow checks in light/dark themes."
```

Build and source-integrity check

Command

```sh
npm run build && git diff --check && git diff --exit-code -- src/data/papers/attention public/article/1706.03762v7.pdf
```

Output (exit 0)

```text
✓ 1204 modules transformed.
✓ built in 2.42s
The existing Vite advisory reported a 534.06 kB main bundle before gzip.
The diff check and Task 1 data/PDF diff completed silently.
```

PDF inventory check

Command

```sh
export PDF_PYTHON=/Users/gongfan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python
node --test scripts/attention-pdf-inventory.test.mjs && node scripts/attention-pdf-inventory.mjs --validate | tail -6
```

Output (exit 0)

```text
1..2
# tests 2
# pass 2
# fail 0
"explainables": 34,
"lessons": 10,
"steps": 28,
"issues": []
```
