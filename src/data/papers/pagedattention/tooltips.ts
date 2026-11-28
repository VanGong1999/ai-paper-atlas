export type LayeredTooltip = {
  id: string
  term: string
  main: string
  expanded: string
  anchor: string
}

export const tooltips: LayeredTooltip[] = [
  { id: 'kv-cache', term: 'KV Cache', main: '保存过去 token 的 Key/Value，让下一步生成不用重算整段历史。', expanded: 'A. 基本观察：自回归模型每生成一个 token 都会再次读取过去 token 的 K/V。B. 约束：序列、并发和层数越大，缓存越占显存。C. 没有缓存就会每步重算，吞吐急剧下降。D. 关键突破是把它作为可管理的动态内存，而不是一块固定大 tensor。E. 去掉它，decode 会反复计算同一上下文。F. OS 对应：请求像进程，KV 像进程的工作集。', anchor: '§2 Background / KV cache motivation' },
  { id: 'internal-fragmentation', term: '内部碎片', main: '已分配的内存块内部有一部分没有被实际 token 使用。', expanded: 'A. 基本观察：输出长度未知，预留的连续空间常常填不满。B. 约束：分配单位越大，尾部空洞越明显。C. 传统预分配把未使用容量锁死。D. 固定 KV block 把浪费限制在最后一个 block。E. 没有控制内部碎片，显存会在请求尚未结束时被“空占”。F. OS 对应：页内未用的字节。', anchor: '§2 / Fig. 1–3' },
  { id: 'external-fragmentation', term: '外部碎片', main: '空闲内存分散在许多位置，总量够却没有一整段连续空间。', expanded: 'A. 基本观察：请求结束会留下大小不一的空洞。B. 约束：连续 tensor 必须找到一段足够长的空闲区。C. 因为地址必须连续，分散空闲不能被合并使用。D. PagedAttention 允许 block 散落，绕开连续性要求。E. 没有它，请求会因“连续空间不足”提前排队或失败。F. OS 对应：物理页可以非连续分配。', anchor: '§2 / Fig. 3' },
  { id: 'reservation', term: '预留浪费（reservation）', main: '为未来可能增长提前占住空间，但这些空间当前没有存任何 KV。', expanded: 'A. 基本观察：输出长度在生成前不可知。B. 约束：系统要么预留最大长度，要么承担搬移风险。C. 预留最大长度会把短请求的未用尾部锁住。D. 按需分配让容量随真实 token 增长。E. 没有它的反例是频繁搬家；有它过度预留又会降低并发。F. OS 对应：为进程预留虚拟地址范围。', anchor: '§2 / Fig. 1–3' },
  { id: 'kv-block', term: 'KV Block', main: '存放固定数量 token 的 K/V 小页，是 PagedAttention 的基本分配单位。', expanded: 'A. 基本观察：动态序列需要可追加、可回收的最小单位。B. 约束：block 太小会增加索引开销，太大会增加尾部碎片。C. 大连续 tensor 无法灵活扩展。D. 固定 block 让 allocate、append、free 都变成简单操作。E. 没有 block，逻辑序列仍会被迫绑定到连续物理地址。F. OS 对应：page。', anchor: '§3.1 PagedAttention' },
  { id: 'block-table', term: 'Block Table', main: '把请求看到的逻辑 block 编号翻译成 GPU 中真实物理 block 的映射表。', expanded: 'A. 基本观察：模型只需要逻辑 token 顺序，显存只需要知道物理位置。B. 约束：两者必须在每次 attention 读取时对齐。C. 没有映射，kernel 不知道去哪里 gather K/V。D. block table 解耦逻辑连续与物理连续。E. 去掉它，分页后的 KV 无法被正确访问。F. OS 对应：页表和虚拟地址翻译。', anchor: '§3.1 / Fig. 6' },
  { id: 'logical-block', term: '逻辑块', main: '从请求视角看到的连续 token 分段，例如 L0、L1、L2。', expanded: 'A. 基本观察：attention 需要按 token 顺序理解上下文。B. 约束：逻辑顺序不能因为物理搬移而改变。C. 让逻辑地址直接等于物理地址会重新引入碎片。D. 逻辑块只描述顺序，不决定存放位置。E. 没有逻辑层，模型会被迫理解底层显存布局。F. OS 对应：虚拟页号。', anchor: '§3.1 / Fig. 5–6' },
  { id: 'physical-block', term: '物理块', main: 'GPU 显存池中真实存放 K/V 数据的位置，例如 P7、P2、P19。', expanded: 'A. 基本观察：GPU 只关心某个地址是否可读写。B. 约束：物理块必须有容量、生命周期和回收状态。C. 连续分配会让物理位置被序列长度绑死。D. 物理 block 可以任意取空闲位置，再由 block table 连接回来。E. 没有它，分页只是抽象概念，无法节省真实显存。F. OS 对应：物理页框。', anchor: '§3.1 / Fig. 6–7' },
  { id: 'paged-attention', term: 'PagedAttention', main: '只改变 KV 的存储与寻址方式，不改变 attention 的数学语义。', expanded: 'A. 基本观察：attention 需要完整历史 K/V，但不要求它们物理连续。B. 约束：每个 query 必须按逻辑顺序读到正确 K/V。C. 连续存储为了布局牺牲容量。D. kernel 查 block table，从散落 block gather K/V 再计算。E. 没有它，block 池、共享和高效 batch 无法落地。F. OS 对应：虚拟内存分页思想迁移到 KV cache。', anchor: '§3 / Fig. 5' },
  { id: 'on-demand', term: '按需分配', main: '只有真实生成到需要的位置时，才从全局 block 池申请新 KV block。', expanded: 'A. 基本观察：未来输出长度未知。B. 约束：显存有限，不能为每条请求预留最大长度。C. 提前分配会造成 reservation 和内部碎片。D. 每填满一个 block 就追加下一个。E. 没有按需分配，短请求会长期占住用不到的空间。F. OS 对应：按需分页和缺页后分配物理页。', anchor: '§3.1 / §4.1' },
  { id: 'cow', term: 'Copy-on-Write', main: '共享 block 先只读复用，某个分支要写入时才复制成私有 block。', expanded: 'A. 基本观察：多个分支通常共享很长的前缀。B. 约束：共享期间不能让一个分支覆盖其他分支的数据。C. 直接写入会破坏其他请求的上下文。D. 引用计数发现写入冲突时复制当前 block。E. 没有 COW，只能提前复制整段前缀，浪费显存。F. OS 对应：进程 fork 后的写时复制页。', anchor: '§3.2 / Fig. 7–9' },
  { id: 'shared-prefix', term: '共享前缀', main: '多个请求共同使用的 prompt / system prompt 只保存一份 KV。', expanded: 'A. 基本观察：系统 prompt、翻译输入和采样前缀经常重复。B. 约束：共享前缀在分歧前是只读的。C. 每条请求各存一份会重复占用显存和 prefill 计算。D. 多个 block table 指向同一物理 block，并用引用计数保护。E. 没有共享，分支数越多，重复成本越线性增长。F. OS 对应：共享只读页。', anchor: '§3.2 / Fig. 10 / Fig. 15' },
  { id: 'beam-sharing', term: 'Beam Search 共享', main: 'beam 的多个候选在分叉前共享同一段历史 KV，分叉后只保存不同 suffix。', expanded: 'A. 基本观察：beam search 保留多个候选，但早期历史高度相同。B. 约束：候选必须彼此独立地继续生成。C. 复制整条序列会把共同前缀重复存储。D. 共享前缀 + COW 让 beam 在分叉点才产生新 block。E. 没有它，beam 宽度越大，KV 内存会近似重复增长。F. OS 对应：fork 后共享父进程页。', anchor: '§3.2 / Fig. 9 / Fig. 14' },
  { id: 'continuous-batching', term: 'Continuous Batching', main: '请求可以随时加入或退出正在运行的 batch，而不必等整批结束。', expanded: 'A. 基本观察：不同请求长度不同，完成时间天然错开。B. 约束：每轮运行都受可用 KV block 数限制。C. 静态 batch 会被最长请求拖住，GPU 出现空转。D. scheduler 释放完成请求的 block，并立刻补入新请求。E. 没有它，吞吐会被长尾请求和固定批次边界压低。F. OS 对应：调度器动态分配时间片与内存。', anchor: '§4 / Fig. 4 / Fig. 13' },
  { id: 'preemption-swap', term: 'Preemption / Swap', main: '显存 block 不足时，暂停低优先级请求并把 KV 暂存到 CPU 或重新计算。', expanded: 'A. 基本观察：在线请求会突发，显存预算可能瞬时不够。B. 约束：不能让整个服务因一个新请求 OOM。C. 没有抢占，scheduler 只能拒绝或等待。D. vLLM 可选择 swap KV 到 CPU，或之后 recompute；代价是带宽/计算开销。E. 没有它，峰值负载下吞吐和稳定性会骤降。F. OS 对应：进程换出到 swap。', anchor: '§4.1 / §5.2 / Fig. 19' },
  { id: 'throughput-latency', term: '吞吐–延迟权衡', main: '在单请求响应速度与单位时间完成 token 数之间寻找可接受平衡。', expanded: 'A. 基本观察：batch 越大通常吞吐越高，但排队和资源竞争也可能增加延迟。B. 约束：论文比较必须在相同延迟水平下看 throughput。C. 只追求吞吐会牺牲用户体验。D. PagedAttention 通过减少浪费，在相同延迟约束下容纳更多请求。E. 没有这个约束，2–4× 的比较就没有公平含义。F. OS 对应：吞吐与响应时间的调度权衡。', anchor: '§5 / Fig. 12–18' },
  { id: 'block-size', term: 'Block size', main: '每个 KV block 能容纳的 token 数，是碎片、并行度与共享粒度之间的旋钮。', expanded: '小 block 的尾部碎片和 COW 复制更小，但查表、分支和 CPU↔GPU 小传输更多；大 block 读取更规整，却会让短序列浪费更多。论文观察到 ShareGPT 的 16–128 较好，Alpaca 的 16、32 较好，并将 16 设为默认。', anchor: '§4.3 / §7.2 / Fig. 18' },
  { id: 'prefill-decode', term: 'Prefill / Decode', main: 'Prefill 一次处理已知 prompt；Decode 每轮只追加一个新 token。', expanded: 'Prefill 可以用矩阵-矩阵乘法并行生成 prompt KV；Decode 受前序依赖约束，每轮读取历史 KV、计算一个新 K/V，再写回 block。PagedAttention 主要解决后者不断增长的动态缓存，同时让两种 token 在 iteration-level batch 中一起执行。', anchor: '§2.2 / §4.3' },
  { id: 'refcount', term: '引用计数', main: '记录一个物理 block 当前被多少逻辑序列引用。', expanded: '共享前缀时多个 block table 可能指向同一物理 block。引用计数为 0 时才能真正回收；大于 1 时若某个序列要写入，必须先 COW。它把共享的生命周期从“凭感觉”变成可验证状态。', anchor: '§4.4 / Fig. 8–9' },
  { id: 'fcfs', term: 'FCFS', main: '按到达顺序服务请求，并优先保护早到请求。', expanded: '当 free block 不足时，vLLM 让最早到达的请求先继续，较晚请求先被抢占，从而避免饥饿。对 beam 或 parallel sampling，相关序列作为 sequence group 一起处理。', anchor: '§4.5' },
  { id: 'recompute', term: 'Recomputation', main: '不保存被抢占请求的 KV，恢复时把完整 token 序列重新做一次 prefill。', expanded: '它避免 CPU↔GPU 传输，且由于历史 token 可以拼成一个新 prompt，恢复阶段能利用矩阵并行；代价是重复计算。论文报告在小 block 下重计算通常比 swap 更合适。', anchor: '§4.5 / §7.3 / Fig. 19' },
  { id: 'kernel-fusion', term: 'Kernel fusion', main: '把分页读写与 attention 或复制合并，降低寻址和 kernel launch 的额外成本。', expanded: 'vLLM 融合 reshape+block write，融合 block read+attention，并把离散 COW copy 批处理。论文微基准中 attention kernel 比 FasterTransformer 高 20–26%，但只影响 attention，端到端吞吐仍因更大 batch 获益。', anchor: '§5.1 / §7.1 / Fig. 18' },
  { id: 'workload', term: 'Workload', main: '用真实服务数据的长度分布和到达率来测试系统，而不是只测单条请求。', expanded: '论文从 ShareGPT、Alpaca 提取输入/输出长度，用 Poisson 分布合成请求到达，并比较 normalized latency 随 request rate 的变化。请求率超过容量后，队列和延迟会突然爆炸。', anchor: '§6.1 / Fig. 11–17' },
]

export function findTooltip(label: string) {
  const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return tooltips.find(item => {
    const key = item.term.toLowerCase().replace(/[^a-z0-9]+/g, '')
    return normalized.includes(key) || key.includes(normalized)
  })
}
