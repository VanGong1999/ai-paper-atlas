export type PagedFigure = { id:string;number:number;title:string;page:number;kind:'figure'|'table';originalAsset:string;interpretation:string;source:'paper'|'derived' }
const pageAsset=(page:number)=>`/article/pagedattention/figures/page-${String(page).padStart(2,'0')}.png`
const entries:[string,number,string][]=[
 ['KV容量与batch吞吐的动机',1,'左图为13B模型在A100 40GB上的内存布局：权重约26GB/65%，KV占约30%；右图联系batch增长、KV占用与token/s。本图不是通用固定比例，也不是Fig.12的req/s评测。'],
 ['平均KV占用：有效token、预留与碎片',2,'§6.2实验中的平均构成。现有系统真正用于token状态的比例为20.4–38.2%；vLLM为96.3%。这是特定负载的测量，不表示任何配置都恰好96.3%。'],
 ['现有系统的三种浪费',4,'请求A最大2048，B最大512：图中区分未来会用的reserved、最终不用的internal，以及外部碎片；相同词在不同上下文也有不同KV。'],
 ['vLLM系统总览',5,'中央scheduler与KV manager维护block tables、CPU/GPU allocator；控制信息发送给各GPU worker，worker内模型分片与cache engine执行实际计算。'],
 ['PagedAttention的非连续块读取',5,'query“forth”读取三块非连续K/V。Eq.4按块重写attention；所有有效token共用一个归一化分母，不能对各块独立softmax后直接相加。'],
 ['Block table翻译与按需增长',6,'B=4，7-token prompt先分P7/P1并记录filled=4/3；下一轮填P1尾槽，再下一轮才申请P3。不要求预留最大长度，也无需搬移旧块。'],
 ['两个请求共用全局块池',6,'A与B的逻辑序列各自连续，物理块交错分布。此图展示池内按需放置，并不意味着不同文本的KV自动可共享。完成请求可释放块给其他请求。'],
 ['Parallel sampling与尾块COW',7,'两个sample先共享P7/P1，refs=2。A1写未满P1前复制到P3并将P1 refs减为1；A2随后可直接写P1。完整前缀P7仍共享，不复制。'],
 ['Beam search候选重排',7,'width=4；剪枝使P2/P4/P5/P8引用归零，分配P9–P12给新候选。共同祖先块保持共享；fork/append/free改变候选页表，只有写共享尾块才COW。'],
 ['共享系统前缀的翻译示意',8,'英法翻译示例来自文献[5]，展示相同指令/示例与不同任务输入。它是机制图；Fig.16真实实验使用WMT16英德，而不是这个英法示例。'],
 ['ShareGPT与Alpaca输入/输出长度',9,'ShareGPT均值161.31/337.99 tokens；Alpaca为19.31/58.45。图示长度分布，时间戳由Poisson过程合成；不是采集到的实际到达轨迹。'],
 ['OPT单序列：请求率与归一化延迟',10,'六个面板对应OPT13/66/175B×ShareGPT/Alpaca。横轴req/s，纵轴mean(端到端延迟/输出token数)，单位s/token。曲线陡升表示到达率超过服务容量；175B+短Alpaca时转为compute-bound。'],
 ['OPT-13B平均批内请求数',10,'ShareGPT 2req/s：OrcaMax/Pow2/Oracle/vLLM=7.00/9.81/13.62/30.42；Alpaca 30req/s：7.00/43.24/72.75/132.44。batch容量解释机制，但batch比值不等于吞吐倍数。'],
 ['多序列生成与Beam search服务曲线',11,'OPT13B+Alpaca，parallel size与beam width各为2/4/6；横轴req/s，纵轴normalized latency。共享越多通常收益越大，具体倍数取决于解码方式与对照基线。'],
 ['共享KV块带来的实测内存节省',11,'OPT13B+Alpaca：parallel sampling输出2/4/6时6.09/8.53/9.79%；beam width2/4/6时37.56/53.13/55.16%。分母是不共享时总块数，不是全GPU显存。'],
 ['共享翻译前缀的服务曲线',12,'LLaMA13B，WMT16英德，1-shot前缀80 tokens、5-shot前缀341 tokens。对Orca Oracle，同延迟吞吐1.67×/3.58×；更长共享前缀减少重复KV与prefill。'],
 ['聊天workload服务曲线',12,'OPT13B+ShareGPT，历史取最后1024 tokens，最多输出1024 tokens，轮间不持有KV。vLLM约可承载2×请求率；不是跨轮持久prefix-cache评测。'],
 ['消融：kernel开销与block size',12,'(a)分页attention kernel比FT延迟高20–26%，只是attention算子；(b)block太小难利用并行、太大增加碎片和降低共享，论文默认B=16。不能用该图宣称kernel本身加速。'],
 ['重算与CPU换入换出的取舍',13,'(a)小块产生大量小传输，swap效率差；大块swap可比重算快，原文称重算延迟最多高约20%。(b)OPT13B+ShareGPT，同请求率下B=16–64两者端到端相近；这不是block-table查表开销图。'],
]
export const figures:PagedFigure[]=entries.map(([title,page,interpretation],i)=>({id:`fig-${i+1}`,number:i+1,title,page,kind:'figure',originalAsset:pageAsset(page),interpretation,source:'paper'}))
export const tableFigures:PagedFigure[]=[{id:'table-1',number:1,kind:'table',page:9,title:'模型规模与服务器配置',originalAsset:pageAsset(9),interpretation:'13B/66B/175B：1/4/8张A100，总显存40/160/640GB，权重26/132/346GB，KV容量12/21/264GB，KV槽15.7K/9.7K/60.1K。175B使用80GB卡。不同规模需结合硬件比较；本表没有OPT-125M。',source:'paper'}]
export const allFigures=[...figures,...tableFigures]
