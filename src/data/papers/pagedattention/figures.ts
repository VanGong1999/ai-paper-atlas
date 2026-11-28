export type PagedFigure = {
  id: string
  number: number
  title: string
  page: number
  kind: 'figure' | 'table'
  originalAsset: string
  interpretation: string
  source: 'paper' | 'derived'
}

const pageAsset = (page: number) => `/article/pagedattention/figures/page-${String(page).padStart(2, '0')}.png`

const titles = [
  '连续内存分配与碎片浪费', '不同系统中的平均内存浪费', '现有系统中的 KV Cache 管理',
  'vLLM 系统总览', 'PagedAttention 算法示意', 'Block table 翻译过程',
  '两个请求如何存储 KV Cache', 'Parallel sampling 示例', 'Beam search 示例',
  '机器翻译的共享 prompt', '输入/输出长度分布', 'OPT 单序列生成吞吐',
  '服务中的平均 batch 请求数', '并行生成与 beam search', '共享带来的内存节省',
  '翻译 workload 性能', '聊天 workload 性能', '消融实验', '重计算与换入换出开销',
]

const pages = [1, 2, 4, 5, 5, 6, 6, 7, 7, 8, 9, 10, 10, 11, 11, 12, 12, 12, 13]

export const figures: PagedFigure[] = titles.map((title, index) => ({
  id: `fig-${index + 1}`,
  number: index + 1,
  title,
  page: pages[index],
  kind: 'figure',
  originalAsset: pageAsset(pages[index]),
  interpretation: [
    '把看似零散的空洞、预留空间和重复副本统一成“内存没有被有效装满”的问题。',
    '序列越长、请求越多，传统连续分配越容易让可用显存消失在碎片里。',
    '现有方案通常把每条请求当成一个不断变长的连续张量，因此难以动态扩缩。',
    'vLLM 把调度器、GPU worker、block manager 与 PagedAttention kernel 串成一条服务路径。',
    '逻辑 token block 不要求连续物理地址，attention 读取时通过映射找到真正的 KV block。',
    'block table 是每条请求的页表：逻辑块编号 → 物理块编号。',
    '多个请求可以把 KV 存进不同物理块，同时共享调度器统一管理空闲块。',
    '并行采样只需共享 prompt 的 KV，再为不同采样分支分配新的尾部 block。',
    'beam search 的分支可以共享前缀，只有发生写入时才触发 copy-on-write。',
    '共享 prompt 把重复的 prefill 计算与重复 KV 存储都压缩成一次。',
    '真实 workload 的长度分布说明“预先猜最大长度”会造成大量内部碎片。',
    '在相同延迟目标下，减少 KV 浪费可以塞进更多并发请求。',
    '平均 batch size 直接反映显存利用率：能放下多少请求，就能处理多少 token。',
    '更复杂的解码策略反而更受益，因为它们更容易产生共享前缀。',
    '共享的收益随 prompt 重合度提升而提升，节省的是容量与重复计算。',
    '不同输入/输出比例下，PagedAttention 仍保持稳定的吞吐优势。',
    '聊天请求长度波动大，分页管理能把尾部碎片控制在 block 内。',
    '消融结果验证收益主要来自更高的 batch，而不是额外的算子魔法。',
    '分页的索引开销远小于连续分配带来的容量损失。',
  ][index],
  source: 'paper',
}))

export const tableFigures: PagedFigure[] = [{
  id: 'table-1', number: 1, kind: 'table', page: 9, title: '模型规模与服务器配置', originalAsset: pageAsset(9),
  interpretation: '实验覆盖 OPT-125M 到 OPT-175B，并在明确的 GPU/显存配置下比较吞吐与延迟。', source: 'paper',
}]

export const allFigures = [...figures, ...tableFigures]
