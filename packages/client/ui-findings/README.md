# @pentest-harness/dsh-client-ui-findings

English | [中文](README.zh.md)

Web findings view: contributes the Issues tab to `conversation.view`, rendering the session's findings ledger as a dashboard — stat cards, severity filter pills, a search box, status/class/sort selects, one triage table that can group by asset, and CSV export.

The data arrives through the Host `findings.list` domain, which folds `.findings/ledger.jsonl` under the session's working directory and returns one `FindingView` per finding id ([`dsh-host-apiproxy`](../../host/apiproxy/README.md)). This package therefore holds no ledger of its own and never touches the filesystem: a finding appears when the host sees it, and the tab renders absence as an empty state rather than an error.

Rows are selected per page and per page-size, and every selection-scoped action (export, copy id) works off that selection so a filtered view exports what the operator is actually looking at. Grouping by asset inserts a header row carrying the asset string and its finding count; the same rows render identically under both groupings because the row renderer is shared.

All color comes from `--dsw-alias-*` and `--dsw-static-*` tokens, so the view renders in both the light and dark themes; copy goes through the package's own `issues` locale namespace.

## Model Experience

None, as this package renders host-folded ledger data for a human and touches no prompt, message, schema, stream, or tool result. The model's own path to the same records is [`dsh-tool-engagement`](../../pentest/tool-engagement/README.md), which owns reporting.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **One session per view** — the tab shows the ledger of the session whose conversation is open; there is no cross-session or engagement-wide findings page, because the shell composes pages from slots and owns no router for one.
- **No finding detail pane** — a row shows identity, severity, status, asset, creator and last activity; evidence, impact and remediation stay in the ledger file until a detail view exists.
- **Status and class are read-only** — the tab filters and exports, it does not transition a finding; a status change is a ledger write the reporting path owns.
- **Export is CSV only** — no JSON or Markdown report rendering, and no retest history.
