# 添加论文提示词

在 Vite + React 应用中为 ORBIT 研究图谱新增一篇论文驾驶舱。

1. 在 `src/data/papers/【slug】/` 准备 `lessons.ts`（教学步骤与舞台节点）、`fulltext-zh.ts`（按原文章节的中译）、`originals-en.ts`（英文对照摘录）。
2. 新增 `src/pages/【Name】Page.tsx`，复用 `components/paper/*` 驾驶舱壳（Learn / 全文中译 / hover 讲解 / 步骤条）。
3. 在 `src/data/papers/registry.ts` 注册 slug → 页面组件；在 `src/data/timeline.ts` 加入准确日期、机构、主题、中文摘要、`url` 与 `visual: '/papers/【slug】'`。首页点击该节点即进入，无需改顶栏。
4. PDF 放入 `public/article/`，链接使用 `import.meta.env.BASE_URL`。
5. 先阅读原论文，区分论文结果与解释性推断；交互可视化用示意数据，不伪装成论文实验。支持减少动态效果（`prefers-reduced-motion`）。
6. `npm run build` 通过后说明验证结果。
