# Light-theme final fix report

Both Important review findings are resolved in one fix wave on `main`, based on `8a29b40`. The same Chromium checks reproduced the failures on that revision and passed against the fixed production build. The wave also fixes the dark search placeholders.

## Saved theme at first paint

The earlier implementation waited for React to mount before applying the saved preference. The HTML document now starts with an explicit dark default, and a synchronous script in the head checks `orbit-theme` before any stylesheet or application script. A saved light value sets the root attribute immediately. Missing or invalid values and storage access exceptions use the dark default. React initializes its toggle from that root attribute. Subsequent toggles still update the document and attempt to save the preference.

Verified with local headless Google Chrome 158.0.8127.37 at 1440 × 900 using Playwright and the Vite production preview. External font requests were blocked for repeatability. On `/papers/attention`, the check selected light using the actual toggle, reloaded, and held the application bundle until after the production stylesheet loaded, a further 1.2 seconds elapsed, and a screenshot was captured. In both runs Chromium had recorded first paint and the React root had zero children.

| While the bundle was held | Before | After |
| --- | --- | --- |
| Root theme attribute | Absent | `light` |
| Computed body color and screenshot pixel at (10, 10) | `#0c0e0d` | `#f6f2e8` |

After releasing the bundle, the document, saved value, and button’s pressed state all indicated light. Switching back to dark and reloading produced the corresponding dark values. A fresh profile and an invalid saved value both selected dark. With access to local storage forced to throw, the page mounted in dark and the toggle applied light for the session. The browser recorded zero uncaught page errors.

## Paper diagram contrast and interaction

The edge animation now supplies its pulse value through a CSS custom property. Dark mode uses that value directly. Light mode uses the existing accent ink (`#34572d`) and maps the pulse into a higher opacity range. Both themes use the existing keyframes, duration, delay, and playback control.

On the first lesson of `/papers/attention`, the check clicked pause, allowed the transition to settle, then resumed and sampled both edges on animation frames for 2.1 seconds, covering the full 1.8-second cycle. For each background, the calculation composites the computed stroke at the lowest observed opacity in sRGB, then computes the relative-luminance contrast.

| Light state | Effective opacity | On stage bottom (#f6f2e8) | On stage top (#fffcf5) |
| --- | ---: | ---: | ---: |
| Before, paused | 0.5500 | 2.21:1 | 2.29:1 |
| Before, pulse minimum | 0.3501 | 1.61:1 | 1.64:1 |
| After, paused | 0.8425 | 5.00:1 | 5.33:1 |
| After, pulse minimum | 0.7725 | 4.24:1 | 4.47:1 |

The initial animation value also gives a light opacity of 0.72, calculated at 3.75:1 and 3.94:1 on the two endpoints. A conservative calculation layering the strongest radial tint and two intersecting grid lines over the darker endpoint gives 3.27:1 initially, 3.63:1 at the pulse trough, and 4.18:1 paused.

Dark mode retained the measured stroke RGB (190, 220, 123), the 0.55 paused opacity, and the 0.35–0.90 pulse. In both themes the pause and play controls stopped and restarted the pulse, zoom increased from 100% to 110% and returned, and hovering a node displayed its tooltip.

## Minor findings

- Dark search placeholders now use the existing muted-text color within the shared search control. Computed placeholder contrast improved from 4.21:1 to 6.73:1 on the homepage and from 4.00:1 to 6.39:1 in the library.
- The mobile browser toolbar still has the static dark `theme-color`. Native mobile browser chrome was outside the desktop Chromium verification, so this optional metadata change is deferred.

## Repository checks

`npm run build` passed TypeScript checking and Vite 7.3.8 production bundling with 1,192 modules transformed. `git diff --check` passed. The temporary browser harness used the existing Playwright and Chrome installations. No dependencies were added.
