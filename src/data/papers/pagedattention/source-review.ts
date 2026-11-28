export type SourceSection = { id:string; title:string; pages:number[]; status:'interactive'|'explained'|'context'|'source-only'; steps:string[]; note:string }
const section=(id:string,title:string,pages:number[],status:SourceSection['status'],steps:string[],note:string):SourceSection=>({id,title,pages,status,steps,note})
/** Manually reconciled against all 16 pages of arXiv:2309.06180v1 (12 Sep 2023). */
export const sourceSections:SourceSection[]=[
 section('abstract','摘要',[1],'explained',['thesis','causal-chain'],'2–4×是摘要的跨实验概括；不同基线和负载有各自结果。'),
 section('1','Introduction',[1,2],'explained',['thesis','causal-chain'],'动态KV、三类浪费、共享动机及贡献；Fig.1–2。'),
 section('2','Background',[2,3],'explained',['autoregressive','prefill-decode'],'自回归模型、生成阶段与迭代级batching。'),
 section('2.1','Transformer-Based LLMs',[3],'interactive',['attention-read'],'Eq.1–3与因果attention；数值沙盘验证全局softmax和加权求和。'),
 section('2.2','LLM Service & Autoregressive Generation',[3],'interactive',['prefill-decode','autoregressive'],'明确采样token和缓存其KV之间的执行时序。'),
 section('2.3','Batching Techniques',[3],'explained',['continuous'],'请求在iteration边界加入；摊薄权重读取、减少padding与排队。'),
 section('3','Memory Challenges',[4],'interactive',['kv-budget','three-wastes'],'OPT-13B 800KiB/token与2048-token约1.6GB；复杂解码和未知长度。'),
 section('3.1','Memory Management in Existing Systems',[4,5],'interactive',['three-wastes'],'reserved、internal、external的定义与图3；compaction搬移大量KV不实用。'),
 section('4','Method',[5],'interactive',['overview'],'中央scheduler、KV manager、分布式worker；Fig.4。'),
 section('4.1','PagedAttention',[5],'interactive',['attention-read','blocks'],'Eq.4，非连续KV块及单头矩阵形状；全局归一化。'),
 section('4.2','KV Cache Manager',[5,6],'interactive',['translation','pool'],'逻辑表→physical ID、filled；GPU大池内切固定块，CPU池用于swap。'),
 section('4.3','Decoding with PagedAttention and vLLM',[6],'interactive',['translation','autoregressive','prefill-decode'],'Fig.6按7-token prompt演示P7/P1/P3；追加尾槽、分配、读取、释放。'),
 section('4.4','Other Decoding Scenarios',[6,7,8],'interactive',['cow','sampling','beam','prompt-sharing'],'parallel sampling、beam、预定义共享前缀、mixed decoding；fork/append/free沙盘。'),
 section('4.5','Scheduling and Preemption',[8],'interactive',['fcfs','swap-recompute'],'FCFS、整序列all-or-nothing、整组gang schedule、CPU swap与重算、恢复优先。'),
 section('4.6','Distributed Execution',[8,9],'interactive',['distributed'],'tensor-parallel head分片、同ID页表、广播token与映射、worker all-reduce及回传token。'),
 section('5','Implementation',[9],'explained',['kernel-fusions'],'FastAPI接口；Python控制面与C++/CUDA kernel；PyTorch/Transformers/NCCL。'),
 section('5.1','Kernel-level Optimization',[9],'interactive',['kernel-fusions','kernel'],'fused reshape/write、block read/attention、批量离散copy；warp负责一块。'),
 section('5.2','Supporting Various Decoding Algorithms',[9],'interactive',['cow','beam'],'fork、append、free组合支持解码，不是更改采样概率。'),
 section('6','Evaluation',[9,10,11,12],'explained',['throughput','workloads'],'评测范围完整索引，交互图仅重画明确标注数据；曲线保留原图。'),
 section('6.1','Experimental Setup',[10],'explained',['workloads'],'OPT13/66/175B、LLaMA13B；GCP A2 A100；Poisson到达，主指标mean(L_i/O_i)，1h/175B 15min。Orca是作者重实现。'),
 section('6.2','Basic Sampling',[11],'interactive',['throughput'],'Fig.12原始曲线；Fig.13带精确标签的平均batch对照；175B+Alpaca算力瓶颈例外。'),
 section('6.3','Parallel Sampling and Beam Search',[11],'interactive',['sampling','beam','throughput'],'Fig.14保留曲线；Fig.15明确值6.09/8.53/9.79%与37.56/53.13/55.16%。'),
 section('6.4','Shared Prefix',[11,12],'explained',['prompt-sharing','task-evidence'],'LLaMA13B，WMT16英德，80/341-token 1/5-shot前缀；1.67×/3.58×对Orca Oracle。Fig.10英法只是概念示例。'),
 section('6.5','Chatbot',[12],'explained',['task-evidence'],'OPT13B，ShareGPT，末1024-token历史+最多1024输出；不跨会话轮次持有KV；约2×请求率。'),
 section('7','Ablation Studies',[12,13],'explained',['ablation'],'kernel微基准、块大小、恢复策略分开解释。'),
 section('7.1','Kernel Microbenchmark',[12],'explained',['kernel'],'attention kernel延迟比FT高20–26%；不能当成整体吞吐下降。'),
 section('7.2','Impact of Block Size',[12],'interactive',['block-tradeoff'],'B默认16；ShareGPT16–128较好，Alpaca16/32较好；页面2/4/8仅教学。'),
 section('7.3','Recomputation vs Swapping',[13],'interactive',['swap-recompute'],'小块swap开销大；大块swap可更快；重算延迟最多高约20%，16–64端到端相近。'),
 section('8','Discussion',[13],'explained',['boundaries'],'动态且内存受限才适合；静态训练/compute-bound DNN可能因寻址变慢；LLM特有all-or-nothing与重算。'),
 section('9','Related Work',[13,14],'context',['related-work'],'按一般服务、Transformer服务、内存优化概括；Orca调度互补；FlashAttention偏I/O/tiling，FlexGen偏离线低显存；不逐篇复述。'),
 section('10','Conclusion',[14],'explained',['complete'],'分页、共享、显式管理组成端到端vLLM。'),
 section('acknowledgement','Acknowledgement',[14],'source-only',[],'鸣谢保留于原PDF，不扩写为技术课程。'),
 section('references','References [1]–[64]',[14,15,16],'source-only',[],'64条文献完整保留原PDF；未逐条翻译或复核被引论文。'),
]
export const sourceEquations=[
 {number:1,page:3,title:'自回归分解',formula:'P(x₁…xₙ) = ∏ᵢ P(xᵢ | x₁…xᵢ₋₁)',meaning:'每一步依赖先前token，因此输出必须逐步生成；已知prompt却可以并行。'},
 {number:2,page:3,title:'Q/K/V 投影',formula:'qᵢ=Wq xᵢ; kᵢ=Wk xᵢ; vᵢ=Wv xᵢ',meaning:'当前隐状态产生q/k/v。旧k/v可以缓存；分页不改变这些投影矩阵。'},
 {number:3,page:3,title:'因果注意力',formula:'aᵢⱼ=exp(qᵢᵀkⱼ/√d) / Σₜ≤ᵢ exp(qᵢᵀkₜ/√d); oᵢ=Σⱼ≤ᵢ aᵢⱼvⱼ',meaning:'所有有效历史位置共享一个softmax分母；输出是V的加权和。'},
 {number:4,page:5,title:'按块重写同一注意力',formula:'oᵢ = Σⱼ Vⱼ Aᵢⱼᵀ; Aᵢⱼ uses one global softmax over valid slots',meaning:'Kⱼ,Vⱼ概念形状d×B，Aᵢⱼ为1×B，oᵢ为d。只是将求和分组；无效尾槽被mask。此处是原式的等价教学写法。'},
]
export const baselineLabels=['Orca Max','Orca Pow2','Orca Oracle','vLLM']
export const batchEvidence={ShareGPT:[7,9.81,13.62,30.42],Alpaca:[7,43.24,72.75,132.44]}
export const sharingEvidence={widths:[2,4,6],sampling:[6.09,8.53,9.79],beam:[37.56,53.13,55.16]}
export const hardware=[
 {model:'13B',gpus:'1 × A100',totalGB:40,parameterGB:26,kvGB:12,slots:'15.7K'},
 {model:'66B',gpus:'4 × A100',totalGB:160,parameterGB:132,kvGB:21,slots:'9.7K'},
 {model:'175B',gpus:'8 × A100-80GB',totalGB:640,parameterGB:346,kvGB:264,slots:'60.1K'},
]
