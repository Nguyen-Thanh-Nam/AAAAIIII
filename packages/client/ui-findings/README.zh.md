# @pentest-harness/dsh-client-ui-findings

[English](README.md) | 中文

Web 端 findings 视图：向 `conversation.view` 贡献 Issues 标签页，把当前任务所属文件夹的 findings 渲染成看板——统计卡片、文件夹/任务范围切换、严重级别筛选胶囊、搜索框、状态/类型/排序下拉、一张可按资产分组的处置表格，以及 CSV 导出。

数据来自 Host 的 `findings.list` 域：它折叠会话所属工作目录下、以及该目录之下任意层级的每个 `.findings/ledger.jsonl`——因此打开一个文件夹只会看到该文件夹的 findings，绝不会看到同级文件夹的——再按 finding id 为每条结果返回一个 `FindingView`，并附带它解析出的范围。文件夹/任务开关请求的是文件夹范围或任务自身的 cwd；不属于任何工作区的任务降级为任务范围，页头以“文件夹图标 + 文件夹路径”的形式标出当前范围。因为 finding id 由标题与目标推导，同一弱点出现在两个文件夹中就是两行，靠所在文件夹区分。因此本包不持有自己的 ledger，也从不直接访问文件系统：host 看到什么，这里就渲染什么，缺失被渲染为空状态而不是错误。

行选择按页与每页条数维护、以「文件夹 + id」为键，所有与选择相关的操作（导出、复制 id）都基于该选择，因此筛选后的视图导出的正是操作者当前看到的内容；CSV 同样带有文件夹列。按资产分组会插入一行表头，携带资产字符串与其 finding 数量；两种分组下同一行由同一个渲染函数产出，因此内容一致。

所有颜色都取自 `--dsw-alias-*` 与 `--dsw-static-*` 令牌，浅色与深色主题都能正常渲染；文案走本包自己的 `issues` 语言命名空间。

## Model Experience

无。本包向人渲染 host 折叠后的 ledger 数据，不涉及任何提示词、消息、schema、流或工具结果。模型通往同一批记录的另一条路径是 [`dsh-tool-engagement`](../../pentest/tool-engagement/README.zh.md)，由它负责归档。

#### KV Cache effect

无；本包从不组装或发送 provider 请求。

## Known Limitations and Deferred Work

- **一次只看一个会话** — 标签页显示当前对话所属会话的 ledger；没有跨会话或按 engagement 汇总的 findings 页面，因为外壳用 slot 组装页面，并不为这类页面持有路由。
- **没有 finding 详情面板** — 一行显示身份、严重级别、状态、资产、创建者与最近活动；证据、影响与修复建议仍留在 ledger 文件中，直到详情视图出现。
- **状态与类型只读** — 标签页负责筛选与导出，不推进 finding 状态；状态变更属于归档路径负责的 ledger 写入。
- **导出只有 CSV** — 没有 JSON 或 Markdown 报告渲染，也没有复测历史。
