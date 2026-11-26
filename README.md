# ORBIT / AI 研究图谱

高密度交互式研究图谱，包含力导向网络、弯曲时间线和《Attention Is All You Need》论文工作台。

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
| `/papers/attention` | 《Attention Is All You Need》工作台 |

## Attention 论文工作台

| 模式 | 内容 |
|------|------|
| Learn | 按章节与步骤学习，含交互式舞台、公式、来源链接，以及播放、暂停和重放。可用鼠标悬停或键盘聚焦查看说明。 |
| Figures | 浏览 Figure 1–5 和 Table 1–4，切换 PDF 截图与重绘，按章节筛选并跳转至相关译文、步骤或 PDF 页。 |
| 全文中译 | 27 个中英对照阅读块，涵盖正文、作者贡献说明、致谢、40 条参考文献和附录图注。 |
| PDF | 在当前步骤所引页打开内嵌 PDF，也可在新标签页打开完整文件。 |

工作台的论文事实以仓库内的 [`1706.03762v7.pdf`](public/article/1706.03762v7.pdf) 为唯一来源。英译法大模型的 BLEU 按原文标注，摘要和表 2 为 **41.8**，§6.1 正文为 **41.0**。热力图中的手设权重和曲线代入值有教学示意标签。

### 本地验证

需要 Node.js 22.18+ 和包含 `pdfplumber`、`pypdfium2`、`Pillow` 的 Python 环境。若 `python3` 不是该环境，请将 `PDF_PYTHON` 设为相应解释器路径。

```sh
node scripts/attention-audit.mjs
node scripts/attention-pdf-inventory.mjs --validate
node --test scripts/attention-audit.test.mjs scripts/attention-pdf-inventory.test.mjs scripts/attention-reader.test.mjs
npm run build
```

浏览器验收使用仓库提交的 11 个套件（Task 3 四个、Task 4 五个、Task 5 两个）。运行器需要 Chrome、ripgrep 和已缓存 Playwright CLI 的 Codex Playwright 包装脚本。用下面的命令启动开发服务器，在另一个终端运行套件。

```sh
npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
```

```sh
s=.superpowers/sdd/2026-11-26-attention-workbench
bash "$s/task-5-run-browser.sh" \
  "$s/task-3-browser.js" "$s/task-3-round1-browser.js" "$s/task-3-round2-browser.js" "$s/task-3-round4-browser.js" \
  "$s/task-4-browser.js" "$s/task-4-round1-browser.js" "$s/task-4-round2-browser.js" "$s/task-4-round3-browser.js" "$s/task-4-round4-browser.js" \
  "$s/task-5-browser.js" "$s/task-5-final-browser.js"
```

`task-5-browser.js` 在 1440、1024、390 三种宽度下分别检查浅色和深色主题，共六种组合。每种组合都通过鼠标悬停和键盘聚焦检查图 4 提示卡摘要中的“似乎参与”。

审计输出 JSON，记录 PDF 校验和、关键事实、公式、中英映射、原图裁剪、表格行以及未引用的解释项。原图像素核对使用 `pdfplumber` 0.11.9、`pypdfium2` 5.13.0 和 `Pillow` 13.0.0 复验。

[Task 5 验收报告](.superpowers/sdd/2026-11-26-attention-workbench/task-5-report.md) 记录了 Chrome 浏览器矩阵与复跑命令。

## 数据维护

- 首页事件：`src/data/timeline.ts`
- 论文课程：`src/data/papers/attention/lessons.ts`
- 中译正文：`src/data/papers/attention/fulltext-zh.ts`
- 英文对照：`src/data/papers/attention/originals-en.ts` 管理来源映射，`scripts/attention-reader-assets.py` 从 PDF 生成正文和原图预览。

## 说明

时间线收录精选研究事件，日期优先采用论文或公告首次公开的时间。
