# @pentest-harness/dsh-client-ui-workflow

English | [中文](README.zh.md)

Web workflow view: contributes the Workflow tab to `conversation.view`, rendering the agent's run as a live stream — turns, steps, and tool calls with running/done/failed status — derived from the same trajectory node stream the conversation consumes.

The tab reflects the session in real time rather than a snapshot taken when it opened: a step appears as it starts and settles as it finishes, so the tab answers "what is the agent doing now" beside Chat's transcript and Trajectory's history. Rendering is read-only; nothing here writes to a session, a step, or a tool result.

All color comes from `--dsw-*` tokens so the view renders in both themes; copy goes through the package's own `workflow` locale namespace.

## Model Experience

None, as this package renders already-logged trajectory nodes for a human and touches no prompt, message, schema, stream, or tool result. Tool calls shown here are the same `tool/call` and `tool/result` events the model produced.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **Read-only by design** — the tab cannot cancel a running step, retry a failed one, or annotate a run; those are session actions owned elsewhere.
- **One session per view** — it renders the conversation whose tab is open; there is no run comparison across sessions.
- **No persistence of its own** — the view is rebuilt from the session log on reload, so a collapsed detail state does not survive a refresh.
