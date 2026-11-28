import { lazy, type ComponentType } from 'react'
import { AttentionPage } from '../../pages/AttentionPage'
import { PagedAttentionPage } from '../../pages/PagedAttentionPage'
import { DistillationPage } from '../../pages/DistillationPage'
import { ReactPage } from '../../pages/ReactPage'
import { DeepSeekMoEPage } from '../../pages/DeepSeekMoEPage'
const DeepSeekV2Page = lazy(() => import('../../pages/DeepSeekV2Page').then(module => ({ default: module.DeepSeekV2Page })))

/** 后续新论文页：在此注册 slug → 页面组件，时间线 visual 填 `/papers/<slug>` */
export const paperRegistry: Record<string, ComponentType> = {
  attention: AttentionPage,
  pagedattention: PagedAttentionPage,
  distillation: DistillationPage,
  react: ReactPage,
  'deepseek-moe': DeepSeekMoEPage,
  'deepseek-v2': DeepSeekV2Page,
}

export function getPaperPage(slug: string) {
  return paperRegistry[slug]
}
