export type ConceptId = 'kv' | 'page' | 'block-table' | 'sharing' | 'batching' | 'scheduler'

export type Concept = { id: ConceptId; label: string; title: string; plain: string; why: string; formula: string }

export const concepts: Concept[] = [
  { id: 'kv', label: 'KV Cache', title: '每生成一个 token，都要记住过去', plain: '自回归解码会反复用到过去 token 的 Key/Value。把它缓存下来，就不用每一步从头计算。', why: '每生成一个新 token，缓存都会沿着序列长度线性增长；并发请求相当于把这条增长曲线叠加。于是推理阶段常常先耗尽显存容量，而不是先耗尽矩阵乘法算力。', formula: 'KV bytes ≈ 2 × layers × tokens × KV width × bytes/element' },
  { id: 'page', label: 'Physical block', title: '把大张量切成固定大小的小页', plain: 'PagedAttention 把 KV Cache 切成固定 token 数的 block，block 可以放在显存任意空闲位置。', why: '固定 block 把“未知长度”转成“按需追加”：前面的 block 填满后再申请下一个，最多只在最后一个 block 留下尾部空洞。', formula: 'logical block i → physical block table[i]' },
  { id: 'block-table', label: 'Block table', title: '请求自己的页表', plain: '请求看到的是连续逻辑序列，kernel 通过 block table 把逻辑块翻译成物理块。', why: '这相当于操作系统的页表：程序使用连续虚拟地址，硬件负责找到分散的物理页。逻辑token位置与attention数学语义不变，显存的摆放自由了；kernel不必串行按逻辑顺序读取。', formula: 'physical = block_table[request][logical]' },
  { id: 'sharing', label: 'Prefix sharing', title: '共享前缀，只在写入时复制', plain: '相同 prompt 的 KV 只保留一份，多条请求引用同一组物理块。', why: '共享的安全条件是前缀只读；引用计数记录有多少请求仍在使用它，只有某个分支要写入时才复制。这样重复 prompt、parallel sampling 和 beam search 都能省下重复容量。', formula: 'refcount(block) > 1 ⇒ write → copy-on-write' },
  { id: 'batching', label: 'Continuous batching', title: '请求随时进出 batch', plain: '请求在iteration边界加入；某条请求完成后释放block，新请求可在预算与恢复优先规则允许时补位。', why: '静态 batch 会被最长请求拖住；continuous batching 让请求像流水一样加入和退出，GPU 每一轮尽量都处理足够多的活跃 token。', formula: 'maximize active tokens / step under memory budget' },
  { id: 'scheduler', label: 'Scheduler', title: '调度器管理 token 与 block 的预算', plain: '调度器决定哪些请求继续 decode、哪些请求做 prefill，以及要申请/释放多少物理 block。', why: 'scheduler 把显存从“执行时才发现不够”的隐性风险变成显式预算：先检查 free blocks，再决定本轮能运行哪些请求，系统行为更稳定也更容易解释。', formula: 'free_blocks = total_blocks − allocated_blocks' },
]
