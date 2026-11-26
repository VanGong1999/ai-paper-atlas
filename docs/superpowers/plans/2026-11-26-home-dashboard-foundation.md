# 首页布局 + Realtime/Three 底座 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 subagent-driven-development（推荐）或 executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 重排首页为「左主图 + 右筛选 + 下 Live Feed」，悬停用指针旁卡片；并落地 WebSocket/mock Realtime 与 R3F `PaperScene` 壳，供后续论文可视化复用。

**架构：** 布局仍由 `HomePage` 拼装现有 timeline 组件。Realtime 以可替换的 `RealtimeSource`（mock 定时推送 / 未来真 WS）经 `useRealtime` 供给 Live Feed，offline 时回退 `timeline` 聚合。Three 侧只提供论文可挂的 `PaperScene`，首页图谱继续 `react-force-graph-2d`。

**技术栈：** Vite、React 19、TypeScript、framer-motion、react-force-graph-2d、three、@react-three/fiber、@react-three/drei（按需）、Vitest（纯逻辑测试）

**规格：** `docs/superpowers/specs/2026-11-26-home-dashboard-layout-design.md`

## 全局约束

- 不更换 `tokens.css` 色板（保持 lime 终端）
- 首页主图保持 2D，不迁 force-graph-3d
- 本轮不迁移 Attention `Stage` 到 Three
- Realtime mock 必须在 UI 显示 LIVE/OFFLINE，不得伪装成外部真实监控或论文实验
- 遵守 `prefers-reduced-motion`
- 未经用户明确要求不要 `git commit`
- 每个任务结束后跑通该任务写明的验证命令

## 审查重点（Review Focus）

1. **WS/mock 断开或从未连接** — Live Feed 必须回退 timeline 聚合，且状态为 OFFLINE，不能空白卡死  
2. **悬停快速划过多个节点** — 只保留当前节点卡片，移出画布后卡片消失，无残留  
3. **卡片靠近视口右/下边缘** — 位置需夹紧在容器内，不被裁切到看不见  
4. **筛选后 events 为空** — 主图/Live Feed/回退统计不抛错，有空态或零值  
5. **系统开启减少动态效果** — PaperScene 与 Live Feed 数字/粒子不强依赖动画才能读懂信息  

---

## 文件结构（将创建 / 修改）

| 文件 | 职责 |
|------|------|
| `src/realtime/types.ts` | Realtime 消息与连接状态类型 |
| `src/realtime/mockSource.ts` | 开发期定时推送的 `RealtimeSource` |
| `src/realtime/client.ts` | 对 Source 的订阅封装（含状态） |
| `src/realtime/useRealtime.ts` | React hook：`status` + 最新 `metrics`/`pulses` |
| `src/realtime/fallbackStats.ts` | 从 `TimelineEvent[]` 派生与 Live Feed 同形的回退数据 |
| `src/realtime/*.test.ts` | Vitest 单测 |
| `src/components/paper/PaperScene.tsx` | R3F Canvas 壳 + 占位网格 |
| `src/pages/DevPaperScenePage.tsx` | 可选手测页（不进顶栏） |
| `src/pages/HomePage.tsx` | 新网格；去 hover→侧栏；接 realtime |
| `src/components/timeline/ForceOrbit.tsx` | 指针旁 HoverCard |
| `src/components/timeline/DashboardPanels.tsx` | 通栏 Live Feed；去 FOCUS；接 realtime/回退 |
| `src/components/timeline/FilterChips.tsx` / `home.css` | 右栏样式、通栏、hover 定位 |
| `src/components/timeline/LiveTicker.tsx` | 从 Home 移除引用（文件可删可留） |
| `src/App.tsx` | 注册 `/dev/paper-scene`（若做手测页） |
| `package.json` / `vite.config.ts` / `vitest` 配置 | 依赖与 test script |

---

### 任务 1：Realtime 类型、mock、回退与 hook

**文件：**
- 创建：上表 `src/realtime/*`
- 修改：`package.json`（加 `vitest`、script `"test": "vitest run"`）
- 修改：`vite.config.ts` 或 `vitest.config.ts`（`environment: 'node'` 足够测纯函数）

- [ ] **步骤 1：添加 Vitest 并写失败测试**

在 `src/realtime/fallbackStats.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { buildFallbackFeed } from './fallbackStats'
import type { TimelineEvent } from '../data/timeline'

const sample: TimelineEvent[] = [/* 最少 2 条，topics 含 AI Infra / AI Agent */]

describe('buildFallbackFeed', () => {
  it('counts visible events and topic mix from filtered list', () => {
    const feed = buildFallbackFeed(sample, sample.length)
    expect(feed.visibleCount).toBe(sample.length)
    expect(feed.topicMix[0]?.count).toBeGreaterThan(0)
  })

  it('handles empty events without throwing', () => {
    const feed = buildFallbackFeed([], 10)
    expect(feed.visibleCount).toBe(0)
    expect(feed.topicMix).toEqual([])
  })
})
```

在 `src/realtime/mockSource.test.ts`：断言 `createMockRealtimeSource` 在 start 后能收到至少一条 `metrics`（可用 fake timers）。

- [ ] **步骤 2：运行测试确认失败**

运行：`npm test`  
预期：FAIL（模块/导出不存在）

- [ ] **步骤 3：实现 Realtime 模块**

锁定接口：

```ts
// types.ts
export type ConnectionStatus = 'connecting' | 'live' | 'offline'

export type MetricsPayload = {
  visibleCount: number
  infraCount: number
  agentCount: number
  coveragePct: number // 0–100
  topicMix: { topic: string; count: number; color: string }[]
  orgSignal: { org: string; count: number }[]
}

export type PulsePayload = {
  id: string
  date: string
  title: string
  at: number
}

export type RealtimeMessage =
  | { type: 'metrics'; payload: MetricsPayload }
  | { type: 'pulse'; payload: PulsePayload }
  | { type: 'paper.event'; payload: Record<string, unknown> } // 预留

export type RealtimeSource = {
  start: (onMessage: (msg: RealtimeMessage) => void) => () => void // 返回 stop
}
```

```ts
// fallbackStats.ts
export function buildFallbackFeed(
  events: TimelineEvent[],
  allCount: number,
): MetricsPayload & { recent: PulsePayload[] }
```

`createMockRealtimeSource(options?: { intervalMs?: number })`：定时推送略微抖动的 metrics + pulse（可基于初始 snapshot，不必连真服务器）。

`useRealtime(source: RealtimeSource | null)` → `{ status, metrics, pulses, stop }`；`source === null` 或 stop/error → `offline`。

- [ ] **步骤 4：运行测试确认通过**

运行：`npm test`  
预期：PASS

---

### 任务 2：PaperScene（R3F 壳）

**文件：**
- 修改：`package.json` — 依赖 `three`、`@react-three/fiber`、`@react-three/drei`、`@types/three`
- 创建：`src/components/paper/PaperScene.tsx`
- 创建：`src/pages/DevPaperScenePage.tsx`
- 修改：`src/App.tsx` — `<Route path="/dev/paper-scene" element={<DevPaperScenePage />} />`（不进 TopBar）

- [ ] **步骤 1：安装依赖**

运行：`npm install three @react-three/fiber @react-three/drei`  
并安装匹配的 `@types/three`（若需要）

- [ ] **步骤 2：实现 `PaperScene`**

签名：

```tsx
type PaperSceneProps = {
  className?: string
  children?: React.ReactNode
}

export function PaperScene({ className, children }: PaperSceneProps): JSX.Element
```

行为：全尺寸 Canvas；背景贴近 `--bg`；默认 children 为空时渲染简单占位（如网格 + 一盏灯 + 静止或慢旋的 box）；若 `prefers-reduced-motion: reduce` 则关闭自动旋转。

- [ ] **步骤 3：Dev 手测页**

`DevPaperScenePage` 仅渲染全屏 `PaperScene`。浏览器打开 `/dev/paper-scene` 应无控制台致命错误。

- [ ] **步骤 4：验证 build**

运行：`npm run build`  
预期：成功

---

### 任务 3：首页网格 — 右筛选 + 去 LiveTicker

**文件：**
- 修改：`src/pages/HomePage.tsx`
- 修改：`src/styles/home.css`（`.home`、`.home-body`、新增 `.filter-rail` / 通栏占位）
- 修改：`src/components/timeline/FilterChips.tsx` — 根节点可加 `className` 或包在 rail 里；标签行在窄栏内纵向堆叠可换行

- [ ] **步骤 1：改 `HomePage` 结构**

目标 DOM 结构：

```
home
  home-hero（不动）
  home-body
    graph-stage | curve   +   filter-rail(FilterChips)
    live-feed-slot（先挂现有 DashboardPanels，下一任务再改通栏）
  EventList（保留）
```

去掉 `<LiveTicker />`。曲线视图也使用「主图 + 右筛选」同一壳。

- [ ] **步骤 2：CSS**

`.home-body`：主区 `1fr` + 右栏约 `300px`；下方 Live Feed `grid-column: 1 / -1`。  
`≤900px`：右栏改到主图下方（筛选在 Live Feed 之上或之下，建造者选可读方案）。

- [ ] **步骤 3：验证**

运行：`npm run dev`，目测：筛选在右、无顶栏 ticker、hero 仍在。  
运行：`npm run build` 预期成功。

---

### 任务 4：ForceOrbit 指针旁 HoverCard

**文件：**
- 修改：`src/components/timeline/ForceOrbit.tsx`
- 修改：`src/pages/HomePage.tsx` — 删除 `hover` state 与 `onHoverEvent`→面板传递（若仍为节点高亮可内聚在 ForceOrbit）
- 修改：`src/styles/home.css` — `.force-orbit` 为 `position: relative`；`.hover-card` 相对轨道容器定位

- [ ] **步骤 1：在 ForceOrbit 内集成 HoverCard**

- 状态：`hoverEvent: TimelineEvent | null`，`pointer: { x, y }`（相对 `wrapRef` 的坐标）
- `onNodeHover`：仅 `kind === 'event' && event` 时设卡；否则清空
- `onMouseMove`（容器）：更新 pointer；渲染时将 card 左上角放在 pointer + 偏移，并用 `Math.min/max` 夹紧，覆盖「审查重点 3」
- 快速划过：每次 hover 只渲染当前 event（审查重点 2）
- 可移除对外 `onHoverEvent`，或保留但不被 Home 用于侧栏

- [ ] **步骤 2：验证**

手动：悬停论文节点出卡，移出消失，贴边不裁切；点击仍导航。  
`npm run build` 成功。

---

### 任务 5：DashboardPanels → Live Feed 通栏 + Realtime

**文件：**
- 修改：`src/components/timeline/DashboardPanels.tsx`
- 修改：`src/pages/HomePage.tsx` — `useRealtime(createMockRealtimeSource())`，把 `status/metrics/pulses` 与 `events` 传入面板
- 修改：`src/styles/home.css` — `.dash-panels` 改为横向通栏（grid 多列或横向 scroll）

- [ ] **步骤 1：删除 FOCUS NODE 整块**；props 去掉 `hover`

- [ ] **步骤 2：数据合并**

```ts
// 伪逻辑
const feedMetrics = status === 'live' && metrics ? metrics : buildFallbackFeed(events, allCount)
const feedPulses = status === 'live' && pulses.length ? pulses : feedMetrics.recent
```

展示连接态 pill：`LIVE` / `CONNECTING` / `OFFLINE`。  
覆盖审查重点 1、4（空 events → 零值不炸）。

- [ ] **步骤 3：通栏布局**

四块：SYSTEM STATUS（含连接态与 coverage）、TOPIC MIX、ORG SIGNAL、RECENT PULSE。横排；窄屏可横滑。

- [ ] **步骤 4：验证**

- mock 运行时数字/脉冲有更新，状态 LIVE  
- 临时让 source 为 `null` 或 stop → OFFLINE + timeline 回退  
- `npm run build` 成功  

---

### 任务 6：收尾与全量验证

**文件：** 按需清理无用 export、死 CSS（`.hover-panel` 等）、确认 `LiveTicker` 无引用

- [ ] **步骤 1：全路径手测清单**

- [ ] 力导向：悬停卡、筛选重塑、点击进论文/library  
- [ ] 弯曲时间线：右筛选 + 下方 Live Feed + 自带 HoverCard  
- [ ] `/dev/paper-scene` 可打开  
- [ ] 系统「减少动态效果」下页面仍可读（审查重点 5）  

- [ ] **步骤 2：最终验证**

运行：`npm test && npm run build`  
预期：全部通过  

- [ ] **步骤 3：对照规格勾选**

确认规格中：布局 A、HoverCard、删 FOCUS、Realtime 优先/回退、PaperScene 壳、不迁首页 3D、不迁 Attention Stage——均已满足或显式推迟。

---

## 规格覆盖对照

| 规格项 | 任务 |
|--------|------|
| 左主图 + 右筛选 + 下 Live Feed | 3、5 |
| Hero 保留 | 3（不改 hero） |
| 悬停 HoverCard、删 FOCUS | 4、5 |
| LiveTicker 默认删除 | 3 |
| Realtime + mock + 回退 + 状态 | 1、5 |
| PaperScene R3F 壳 | 2 |
| 首页 2D / 不迁 Attention | 全局约束 |
| lime 色板不变 | 全局约束 |
| prefers-reduced-motion | 2、6 |
| build 通过 | 2–6 |

## 执行交接

计划已完成并保存到 `docs/superpowers/plans/2026-11-26-home-dashboard-foundation.md`。请审阅这份计划。你希望用哪种执行方式？

- **子代理驱动** — 每任务全新子代理实现 + 审查，最彻底  
- **原生执行** — 我在当前会话按任务直接实现，最后再做一次分支级审查；更快  

针对这份计划，我推荐 **原生执行**：任务接口已在计划里钉死，且布局/Realtime/Three 前后依赖紧，同会话推进更不容易接口漂移。这份计划抓住你想要的东西了吗？我们用哪种方式？
