#!/bin/bash
set -u
export npm_config_offline=true
export npm_config_update_notifier=false
pw="$HOME/.codex/skills/playwright/scripts/playwright_cli.sh"
suite=.superpowers/sdd/2026-11-26-attention-workbench
base=http://127.0.0.1:5184
status=0
total=0
passed=0
for script in "$@"; do
  total=$((total + 1))
  name=${script##*/}
  session="task5-${name%.js}"
  printf '%s\n' "${name%.js}"
  "$pw" -s="$session" open about:blank --browser=chrome >"$suite/$name.open.log" 2>&1 || { cat "$suite/$name.open.log"; status=1; continue; }
  code=$(sed -e 's/127\.0\.0\.1:5178/127.0.0.1:5184/g' -e "s/page.getByRole('tabpanel')/page.locator('#paper-mode-panel')/g" "$script")
  "$pw" -s="$session" run-code "async (page) => {
    await page.context().route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.origin === '$base') return route.continue()
      // Chrome's local PDF viewer uses chrome-extension:// resources. Never
      // turn those into an HTTP 204: that breaks the viewer MIME contract.
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return route.continue()
      if (url.pathname.endsWith('.pdf')) return route.continue()
      if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        return route.fulfill({ contentType: 'text/css', body: '' })
      }
      return route.fulfill({ status: 204, body: '' })
    })
    await page.goto('$base/papers/attention')
    return await ($code)(page)
  }" >"$suite/$name.log" 2>&1
  sed '/^### Ran Playwright code/,$d' "$suite/$name.log"
  if ! rg -q '^### Result$' "$suite/$name.log" || rg -q '^### Error$' "$suite/$name.log"; then
    status=1
  else
    passed=$((passed + 1))
  fi
  "$pw" -s="$session" close >/dev/null 2>&1 || true
done
printf 'summary: %s/%s suites passed\n' "$passed" "$total"
exit "$status"
