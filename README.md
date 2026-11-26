# ORBIT / AI 研究图谱

高密度交互式研究图谱：力导向网络首页（可切弯曲时间线）+ Transformer 论文驾驶舱（教学导读 / 全文中译 / 原文对照）。

技术栈：Vite + React + TypeScript + Framer Motion + react-force-graph-2d。

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

## 构建

```bash
npm run build
npm run preview
```

产物在 `dist/`。论文 PDF 位于 `public/article/1706.03762v7.pdf`，构建时会复制进 `dist/article/`。

### GitHub Pages 子路径

若仓库不是 `username.github.io` 根站，构建前设置 base：

```bash
VITE_BASE=/your-repo-name/ npm run build
```

### GitHub Pages 自动部署

仓库已包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

首次使用时，在仓库的 `Settings → Pages → Build and deployment → Source` 中选择 `GitHub Actions`。本仓库的项目站点地址通常是：

```text
https://<github-username>.github.io/ai-paper-atlas/
```

Workflow 会自动设置 `/ai-paper-atlas/` 资源前缀，并生成 `404.html` 以支持直接打开论文详情等前端路由。

## 页面

| 路径 | 说明 |
|------|------|
| `/` | 力导向研究网络（主）/ 弯曲时间线（可切换）；顶部筛选、侧栏动态卡片、底部事件列表 |
| `/library` | 已收录论文库；点击进入详情或可视化 |
| `/library/:id` | 单篇摘要详情（无可视化时） |
| `/papers/:slug` | 单篇论文可视化（如 `/papers/attention`）。在 `src/data/papers/registry.ts` 注册新 slug 即可扩展 |

## 数据维护

- 首页事件：`src/data/timeline.ts`
- 论文课程：`src/data/papers/attention/lessons.ts`
- 中译正文：`src/data/papers/attention/fulltext-zh.ts`
- 英文对照：`src/data/papers/attention/originals-en.ts`

## 说明

时间线为精选教学图谱，不是完整发布史；日期尽量采用公开论文/公告首次时间。Attention 页中译与英文摘录服务于对照阅读，完整表述以 PDF / arXiv 为准。示意热力图等交互数据为教学用途，并非论文真实权重。
