import type { ComponentType } from 'react'
import { AttentionPage } from '../../pages/AttentionPage'

/** 后续新论文页：在此注册 slug → 页面组件，时间线 visual 填 `/papers/<slug>` */
export const paperRegistry: Record<string, ComponentType> = {
  attention: AttentionPage,
}

export function getPaperPage(slug: string) {
  return paperRegistry[slug]
}
