# Pentest Harness

**Heaven for Hackers** — a professional security testing workspace built on a serious agent platform.

Pentest Harness is an open-source agent harness for authorized penetration tests,
bug bounty research, security labs, and CTF engagements. Everything is a plugin —
model adapters, tools, sessions, settings, and credentials are all replaceable
from configuration.

## Features

- **Multi-provider LLM engine** — OpenAI-compatible Chat Completions & Responses, Anthropic Messages, and any custom gateway with one-click model auto-discovery
- **Full agent toolset** — shell, filesystem, web research, skills, goals, subagents, background jobs, and workflow control
- **Pentest Mode** — a professional offensive-security operating standard for authorized engagements
- **Provider cards** — live connection testing, enabled/disabled toggles, per-model context badges
- **Durable sessions** — JSONL/SQLite persistence with replay; resume exactly where you left off
- **Context that never dies** — token metering, automatic compaction, and tool-result pruning
- **Secure by default** — API keys live in an owner-only credential store as references; never in settings files or logs
- **Everything is a plugin** — built on Cordis; no closed core to fight

## Requirements

- **Node.js 20+** (Node 22 recommended)
- **pnpm** (`npm i -g pnpm`)

## Run from npm

```sh
npx pentest-harness web
```

The Web UI starts at `http://127.0.0.1:2323` by default and opens in your browser.
Pass `--no-open` to run without opening a browser, or `--port <port>` for a different port:

```sh
npx pentest-harness web --port 3000
```

## Run from source (GitHub)

```sh
git clone https://github.com/your-user/pentest-harness.git
cd pentest-harness
pnpm install
pnpm build
pnpm dsh web
```

The server starts at `http://127.0.0.1:2323` and opens your browser.

> If `pnpm dsh` is not on your PATH, run it via the workspace binary:
> `pnpm exec dsh web` or `node apps/cli/lib/index.js web`.

## First run

1. Open **Settings → Models**.
2. Click **Add a custom provider** (or **Edit** an existing one).
3. Paste your base URL — the provider ID and display name auto-fill.
4. Enter your API key (stored in your local credential store, never in settings).
5. Click **Fetch available models** — or let auto-discovery list them, then click one to add it.
6. Pick a model in the composer and start your engagement.

## Defaults

- Web UI: `http://127.0.0.1:2323`
- Settings file: `$DSH_HOME/settings.yaml` (default `~/.dsh/settings.yaml`)
- Credentials: `$DSH_HOME/.credentials.yaml` (owner-only permissions)

## License

MIT
