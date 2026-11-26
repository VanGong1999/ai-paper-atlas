async (page) => {
  page.setDefaultTimeout(2500)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://127.0.0.1:5178/papers/attention')
  await page.locator('.lesson-nav').getByRole('button', { name: '缩放点积注意力' }).click()
  await page.locator('.steps button').nth(1).click()

  const formula = page.locator('.formula-box')
  const key = formula.locator('[data-explainable="key"]').first()
  const softmax = page.locator('.stage-canvas [data-explainable="attention-softmax"]').first()
  const card = page.getByRole('tooltip')
  const keyCard = card.filter({ hasText: 'K · 键' })
  const softmaxCard = card.filter({ hasText: '注意力 Softmax' })

  await formula.locator('[data-explainable="query"]').first().focus()
  await page.keyboard.press('Tab')
  if (!await key.evaluate(el => el === document.activeElement)) throw new Error('Tab missed inline K')
  await keyCard.waitFor()
  async function enterSoftmaxCard() {
    await softmax.hover()
    await softmaxCard.waitFor()
    await softmaxCard.hover()
    // Stay past both the focus handoff and pointer-only dismissal delays.
    await page.waitForTimeout(400)
    if (!await softmaxCard.isVisible()) throw new Error('Softmax closed under the pointer')
  }
  await enterSoftmaxCard()
  await page.mouse.move(1, 1)
  if (!await key.evaluate(el => el === document.activeElement)) throw new Error('Card exit moved focus')
  await keyCard.waitFor()
  if (await key.getAttribute('aria-describedby') !== await keyCard.getAttribute('id')) {
    throw new Error('Restored card is not associated with inline K')
  }
  await page.keyboard.press('Enter')
  await page.locator('.selected-explanation').filter({ hasText: 'K · 键' }).waitFor()
  await page.keyboard.press('Escape')
  await card.waitFor({ state: 'detached' })

  await page.locator('.steps button').nth(1).focus()
  await enterSoftmaxCard()
  await page.mouse.move(1, 1)
  await card.waitFor({ state: 'detached' })
  return 'Passed focused K restoration, Enter/Escape, and pointer-only card retention and dismissal.'
}
