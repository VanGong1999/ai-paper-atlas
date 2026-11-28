# ORBIT / AI 研究图谱

高密度交互式研究图谱，包含力导向网络、弯曲时间线和论文可视化工作台。

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
| `/library` | 已收录论文库；只展示已经完成交互式可视化的论文 |
| `/library/:id` | 单篇摘要详情（无可视化时） |
| `/papers/attention` | 《Attention Is All You Need》工作台 |
| `/papers/pagedattention` | PagedAttention / vLLM 工作台 |
| `/papers/distillation` | Knowledge Distillation 工作台 |
| `/papers/react` | ReAct: Synergizing Reasoning and Acting 工作台 |
| `/papers/deepseek-v2` | DeepSeek-V2 三栏交互精读，支持亮暗主题 |

## 当前已收录论文

`/library` 当前列出已接入交互式可视化页面的论文：

1. **Attention Is All You Need** — `/papers/attention`
2. **PagedAttention / vLLM** — `/papers/pagedattention`
3. **Distilling the Knowledge in a Neural Network** — `/papers/distillation`
4. **ReAct: Synergizing Reasoning and Acting in Language Models** — `/papers/react`
5. **DeepSeek-V2** — `/papers/deepseek-v2`

时间线中尚未完成可视化的论文、开源权重和研究节点不会出现在“已收录论文”列表中；它们仍保留在首页研究时间线中，等待后续接入。

## Attention 论文工作台

| 模式 | 内容 |
|------|------|
| Learn | 按章节与步骤学习，含交互式舞台、公式、来源链接，以及播放、暂停和重放。可用鼠标悬停或键盘聚焦查看说明。 |
| Figures | 浏览 Figure 1–5 和 Table 1–4，切换 PDF 截图与重绘，按章节筛选并跳转至相关译文、步骤或 PDF 页。 |
| 全文中译 | 27 个中英对照阅读块，涵盖正文、作者贡献说明、致谢、40 条参考文献和附录图注。 |
| PDF | 在当前步骤所引页打开内嵌 PDF，也可在新标签页打开完整文件。 |

工作台的论文事实以仓库内的 [`1706.03762v7.pdf`](public/article/1706.03762v7.pdf) 为唯一来源。英译法大模型的 BLEU 按原文标注，摘要和表 2 为 **41.8**，§6.1 正文为 **41.0**。热力图中的手设权重和曲线代入值有教学示意标签。

Attention 与 PagedAttention 的速查模式还包含论文覆盖矩阵：按概念、公式、流程、实现、实验和边界列出关键论点，并保留章节/页码锚点。覆盖审计命令为：

```sh
node scripts/paper-coverage-audit.mjs
node --test scripts/paper-coverage-audit.test.mjs
```

覆盖矩阵明确区分两篇论文的边界：Attention 定义 Q/K/V 如何产生数学结果；PagedAttention 不改变 attention mathematics，只负责 KV Cache 的存储布局、block table 地址翻译、共享、调度与 serving 实验。

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

## DeepSeek-V2 交互精读

入口：`/papers/deepseek-v2`。也已接入研究时间线与已收录论文列表。

- 19 章、76 个讲解步骤，三栏工作台支持目录/详解折叠、拖动调宽、概念悬停与固定解释。
- 亮色与暗色覆盖公式、SVG、图表和控件；右上角切换并自动记忆。
- 架构图支持 100%–300% 缩放和滚动查看；手机端可展开目录与讲解抽屉。
- 数值模拟：矩阵乘法、多头因果 Attention（自定义输入及 Q/K/V 投影）、KV 缓存预算、MLA 低秩投影、RoPE、矩阵吸收等价性、专家 Top-K 与设备限制路由、均衡损失、GRPO 组内优势。
- 原文证据：arXiv **2405.04434v5** 的 **47 个编号公式、37 张原始表格**；表 2 八个核心指标提供模型筛选与排序，数值原表支持通用绘图；附录提示模板按原表阅读。
- 原论文 PDF 使用项目已有的 `public/article/deepseek/2405.04434.pdf`；公式与表格来源索引由 arXiv v5 HTML 生成，包含源 HTML 的 SHA-256。
- 学习进度只保存在当前浏览器。URL 支持 `?chapter=mla&step=1`（步骤从 0 编号）。键盘 `←` / `→` 切步，`Space` 播放，`R` 重放，`⌘/Ctrl K` 搜索。

教学模拟使用确定性小矩阵，不运行 236B 模型，不在网页执行 PyTorch。完整模型配置、公开 HF 展开 K/V 的参考实现与论文内部优化推理路径分别说明。论文吞吐比较包含 FP8 权重和平均 6-bit KV 量化，不能用理论缓存比例推算速度。

```sh
node --test scripts/deepseek-v2-math.test.mjs scripts/deepseek-v2-content.test.mjs
npm run build
# 从下载的原文 HTML 重新提取，要求 47 式 / 37 表完整：
python3 scripts/deepseek-v2-source-inventory.py /path/to/2405.04434v5.html
```

浏览器验收函数位于 `scripts/deepseek-v2-browser.js`，使用 Playwright CLI 的 `run-code` 执行；开发服务需在 `http://127.0.0.1:5184`。截图与验收输出保存在忽略提交的 `output/` 目录。

## 全站论文原文复核与图解

现有五篇课程（Attention、PagedAttention、Knowledge Distillation、ReAct、DeepSeekMoE）已补充原文覆盖核对、重点事实修正及计算图讲解。DeepSeek-V2 中栏的重复章节标题区已移除。论文报告、逐节覆盖、已知边界与浏览器截图保存在本地 `output/other-papers-review.md` 及各篇 `*-source-review.md`。

- DeepSeekMoE 使用真实可计算的小维路由、FFN 聚合、共享预算和专家/设备负载；原文 17 式、10 表、33 页可以直接查阅。
- ReAct 补充 33 页原文档案，保留原始规模图，提供 Thought/Action/Observation 上下文轨迹和实际回退条件实验。
- 蒸馏支持真实 softmax、CE/KL、混合损失及梯度/T² 计算；PagedAttention 支持可操作页表和 COW；Attention 增加缩放、因果掩码和 FFN/训练流程。
- 教学权重、原文报告值和未验证设想有明确区分；原文可达不等于所有内容均有独立仿真。

```sh
# PDF 审计所用 Python 需安装 pdfplumber、pypdfium2 和 Pillow。
PDF_PYTHON=/path/to/pdf-enabled/python PATH=/path/to/pdf-enabled/bin:$PATH node --test scripts/*.test.mjs
npm run build
```

整站浏览器验收函数 `scripts/other-papers-browser.js` 检查 1440、715、390 三种宽度与两种主题；同样通过 Playwright CLI `run-code` 执行，使用端口 5184。

## 数据维护索引

- 首页事件：`src/data/timeline.ts`
- 论文课程：`src/data/papers/attention/lessons.ts`
- 中译正文：`src/data/papers/attention/fulltext-zh.ts`
- 英文对照：`src/data/papers/attention/originals-en.ts` 管理来源映射，`scripts/attention-reader-assets.py` 从 PDF 生成正文和原图预览。
- DeepSeek 论文原文：`public/article/deepseek/`，清单见 `public/article/deepseek/manifest.json`；当前已拉取 13 篇，后续可按 arXiv ID 接入论文可视化。

## 说明

时间线收录精选研究事件，日期优先采用论文或公告首次公开的时间。
