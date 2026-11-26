# 首页仪表盘布局与可扩展底座设计

日期：2026-11-26  
范围：首页布局/交互 + Realtime / Three 可复用底座；不改 Library、不换全局色板；Attention 论文舞台本轮不强制迁到 Three

## 意图与原因

把首页从「顶栏筛选 + 左图右仪表盘」调成更清晰的作战室布局：主图占视觉中心，筛选在右侧，原右侧指标沉到主图下方 Live Feed 通栏。悬停摘要改到鼠标旁悬浮框。

同时为后续更多论文可视化铺两块底座：**Realtime（WebSocket + 开发 mock）** 与 **Three/R3F 论文场景壳**，避免每篇论文各写一套实时与 3D 接入。

成功标准：

- 悬停节点时指针旁出摘要卡；右侧筛选实时重塑主图；下方 Live Feed 展示状态类面板
- Live Feed 优先消费 Realtime 通道；断线或无连接时回退本地 `timeline` 统计
- 存在可被论文页挂载的 `PaperScene`（R3F）壳，至少有可运行的占位场景
- `npm run build` 通过；尊重 `prefers-reduced-motion`
- 视觉保持现有 lime 终端色

## 目标

### 布局与交互（方案 A）

- Hero 保留现状
- 左主图（ForceOrbit 2D / CurvedTimeline）+ 右筛选（FilterChips）
- 下方 Live Feed 通栏：SYSTEM STATUS、TOPIC MIX、ORG SIGNAL、RECENT PULSE
- 删除 FOCUS NODE；力导向悬停用 `HoverCard`（或等价）贴指针
- 首页主图**暂留 2D**（`react-force-graph-2d`）

### 底座（本轮一并落地）

1. **Realtime**
   - WebSocket 客户端抽象（连接、重连、订阅、状态：connecting / live / offline）
   - 开发期 mock：可用内存 mock server、或 Vite 插件/小脚本、或 `MockRealtimeSource` 用定时器模拟推送（建造者选一种能 `dev` 下跑通的）
   - 事件形状稳定、可扩展，例如：`metrics`（计数类）、`log`/`pulse`（流水）、预留 `paper.*` 给论文舞台
   - Live Feed：**优先**吃 Realtime；offline 时回退 `timeline` 派生统计
   - UI 上如实反映连接状态（如 LIVE / OFFLINE），不把 mock 伪装成外部真实监控

2. **Three 脚手架**
   - 依赖：`three` + `@react-three/fiber`（及实现壳所需的最少配套，如 `@react-three/drei` 若需要）
   - 提供 `PaperScene`（名称可微调）：论文页可挂的 R3F Canvas 壳（自适应容器、色调贴近 tokens、支持 `prefers-reduced-motion` 降级）
   - 附带最小 demo/占位（几何体或网格），证明可挂载；**本轮不要求**把 Attention 的 SVG `Stage` 迁过去
   - 后续新论文可视化在此壳内扩展；可与同一 Realtime 通道订阅 `paper.*` 事件

## 非目标

- 不更换全局配色 / 字体为霓虹粉青
- 不把首页力导向图换成 Three.js / force-graph-3d
- 不部署生产级独立后端；本轮只需 dev 可演示的 mock
- 不迁移现有 Attention `Stage` 到 Three
- 不改 Library 页信息架构

## 反目标

- 用假实时数据冒充论文实验或真实外部系统而无状态标识
- 悬停信息同时出现在悬浮框与侧栏
- 为 3D/WS 牺牲首屏可用性或忽略 `prefers-reduced-motion`

## 约束

- 继续 Vite + React + TS + framer-motion
- 首页图谱继续用现有 2D force-graph，直到未来单独立项再考虑 3D 图谱
- PROMPT.md：论文结果与示意推断分开；示意数据不伪装成论文实验
- Realtime mock 与 timeline 回退逻辑必须可切换、可测
- 移动端：右侧筛选可折行/滚动；Live Feed 可横向滚——具体断点留给建造者

## 实现方案

| 方案 | 做法 | 取舍 |
|------|------|------|
| A 仅布局 | 只重排首页 | 无后续扩展底座 |
| **底座先行（已选）** | 布局 A + WS 客户端/mock + R3F `PaperScene` 壳；首页主图仍 2D | 本轮多一点基建，换后续论文可视化少重复 |
| 首页也上 3D | 替换 ForceOrbit 为 3D | 观感强、成本高，对多论文帮助有限 |
| 一次做满 | 真后端 + 首页 3D + 迁移 Attention | 范围过大 |

**已选：底座先行。**

## 布局（用户已确认）

```
[ Hero：标题说明 + 力导向/弯曲时间线切换 ]   ← 保持现状

┌──────────────────────────────┬─────────────────┐
│ 主可视化（2D）                │ 搜索 + 筛选标签   │
│ ForceOrbit / CurvedTimeline  │ FilterChips       │
└──────────────────────────────┴─────────────────┘
│ Live Feed 通栏（Realtime 优先，offline 回退 timeline）│
│ SYSTEM STATUS · TOPIC MIX · ORG · RECENT … + 连接态   │
└────────────────────────────────────────────────┘
[ EventList — 建造者决定是否与 RECENT 去重 ]
```

曲线视图使用同一壳：左主图 + 右筛选 + 下 Live Feed。

## 交互

### 悬停（力导向）

- 指针旁 `HoverCard`；避让视口边缘
- 内容对齐现有 HoverCard / 原 FOCUS 信息
- 默认仅 `event` 节点出卡；枢纽节点建造者可自行决定是否简卡
- 点击导航不变
- 删除 hover → 侧栏 FOCUS

### 筛选

- `FilterChips` 在右侧；逻辑不变；变化驱动主图与（回退模式下的）Live Feed

### Live Feed 数据优先级

1. Realtime `metrics` / `pulse` 若 live → 驱动对应卡片  
2. 否则用当前筛选后的 `timeline` 聚合（与现 DashboardPanels 同源）  
3. 连接态指示必显  

独立 `LiveTicker`：默认删除，通栏标题用 LIVE FEED（建造者可改为并入顶行）。

## 组件与文件（预期）

布局：

- `src/pages/HomePage.tsx`
- `src/components/timeline/ForceOrbit.tsx` — HoverCard
- `src/components/timeline/DashboardPanels.tsx` — 通栏 + 去 FOCUS + 接 Realtime/回退
- `src/components/timeline/FilterChips.tsx`、`HoverCard.tsx`、`LiveTicker.tsx`、`home.css`

底座（路径可微调）：

- `src/realtime/` — 类型、客户端、mock source、React hook（如 `useRealtime`）
- `src/components/paper/PaperScene.tsx`（或 `src/three/PaperScene.tsx`）— R3F 壳 + 占位
- `package.json` — 增加 `three`、`@react-three/fiber`（及必要 peer/配套）

可选：一篇文档短述「新论文如何挂 PaperScene + 订阅 realtime」——**建造者决定是否本轮写**。

## 留给建造者的决定

- 右栏宽度与小屏断点
- Live Feed 多列 grid vs 横向 scroll
- EventList 去留/去重
- Mock 实现形态（纯前端定时器 vs 本地 WS 端口）
- `PaperScene` 目录位置与是否用 drei
- 是否加一条极简 demo 路由展示 PaperScene（默认：不必新路由，导出组件 + 可在 Attention 旁注释/或仅单元式手测即可；若手测困难可加 `/dev/paper-scene` 且勿链入顶栏）

## 验证

- 布局与悬停：出卡、筛选、点击导航、曲线视图不回归
- Realtime：mock 推送时 Live Feed 更新；断开/停止 mock 后回退 timeline，状态指示正确
- PaperScene：dev 下能挂载占位场景，无控制台致命错误；reduced-motion 下可静止或降动画
- `npm run build` 通过
