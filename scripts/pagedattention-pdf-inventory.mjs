import fs from 'node:fs'
import path from 'node:path'

export const root = path.resolve('public/article/pagedattention')
export const pdfPath = path.join(root, '2309.06180v1.pdf')

export const figurePages = {
  1: 1, 2: 2, 3: 4, 4: 5, 5: 5, 6: 6, 7: 6, 8: 7, 9: 7,
  10: 8, 11: 9, 12: 10, 13: 10, 14: 11, 15: 11, 16: 12, 17: 12, 18: 12, 19: 13,
}

export function inventory() {
  if (!fs.existsSync(pdfPath)) throw new Error(`Missing ${pdfPath}`)
  return Object.entries(figurePages).map(([number, page]) => ({
    number: Number(number),
    page,
    asset: `/article/pagedattention/figures/page-${String(page).padStart(2, '0')}.png`,
  }))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inventory()
  console.log(JSON.stringify({ pdf: pdfPath, figures: result }, null, 2))
}
