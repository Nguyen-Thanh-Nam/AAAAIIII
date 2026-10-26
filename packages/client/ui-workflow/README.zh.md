# @pentest-harness/dsh-client-ui-workflow

[English](README.md) | 中文

Web 端 workflow 视图：向 `conversation.view` 贡献 Workflow 标签页，把 agent 的一次运行渲染成实时流——轮次、步骤，以及处于运行中/完成/失败状态的工具调用——数据来自会话所消费的同一份 trajectory 节点流。

标签页反映的是会话的实时状态，而不是打开时的快照：步骤开始时出现，结束时落定，所以它回答的是「agent 现在在做什么」，与 Chat 的记录、Trajectory 的历史并列。渲染是只读的；这里不会写入会话、步骤或工具结果。

所有颜色都取自 `--dsw-*` 令牌，两种主题都能正常渲染；文案走本包自己的 `workflow` 语言命名空间。

## Model Experience

无。本包向人渲染已经写入日志的 trajectory 节点，不涉及任何提示词、消息、schema、流或工具结果。这里显示的工具调用就是模型自己产生的 `tool/call` 与 `tool/result` 事件。

#### KV Cache effect

无；本包从不组装或发送 provider 请求。

## Known Limitations and Deferred Work

- **按设计只读** — 标签页不能取消运行中的步骤、重试失败的步骤，也不能给运行添加标注；这些属于别处拥有的会话操作。
- **一次只看一个会话** — 它渲染当前打开的对话；没有跨会话的运行对比。
- **自身不持久化** — 视图在刷新后由会话日志重建，因此折叠的详情状态不会跨刷新保留。
