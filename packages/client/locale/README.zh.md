# @pentest-harness/dsh-client-locale

[English](README.md) | 中文

locale 插件：LocaleRuntime——GUI 只发布一种语言，即 `LOCALE_IDS` 声明的 `en`；`$DSH_HOME/settings.yaml` 中的 `locale.preference` 仅当它指向已发布语言时才被采纳，其他值会让运行时保持在该语言。Host 读取在插件激活后执行，因此 settings 服务不可用不会阻塞页面。远程浏览器只保留进程内选择，因为 settings API 仅限本机。`locale/change` 在切换时触发，插件在激活时和每次切换时把 `<html lang>` 指向当前语言（`en`）；只有发布多种语言时才会注册语言设置行。该服务同时拥有“命名空间×语言”的字典注册表（带类型的 `register(ns, {en})` 会按 `LocaleNamespaceMap` 校验，`bind(ns)`→`TranslateNS<ns>`；查找链为 命名空间 → common → en → key）；字典仍可按语言分别注册，这正是将来新增语言时会用到的能力。服务实现槽系统的 `LocaleFace`，并通过 `ctx.slots.installLocale` 安装自身，为框架注入的 `t` 标准席位提供支撑（`Translate`/`TranslateNS` 是 ui-slots 的类型，请从那里引入——本包只是为了方便字典所有者才重新导出）。

## 模型体验

无。locale 注册表为浏览器 UI 文案提供服务；这里没有任何内容进入模型请求。

#### KV Cache 影响

无；该包既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **部分界面仍保留内联文案**——设置行、侧边栏、问题作答器和模型选择使用 locale seat；其他包仍直接拥有静态文本。
- **注册表持有的文本只读取一次翻译**——在 slot 渲染路径之外于注册时捕获的文案（例如 command 注册表中的 `/model` 命令描述）在重新注册前保持注册时的语言；slot 渲染的文案随切换实时更新。
