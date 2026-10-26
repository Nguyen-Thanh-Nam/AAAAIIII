# @pentest-harness/dsh-client-locale

English | [中文](README.zh.md)

Locale plugin: LocaleRuntime — the GUI ships one locale, `en`, declared by `LOCALE_IDS`; a stored `locale.preference` in `$DSH_HOME/settings.yaml` is adopted only when it names a shipped locale, and any other value leaves the runtime on that one locale. The Host read runs after plugin activation so an unavailable settings service cannot block the page. Remote browsers retain only a process-local selection because the settings API is loopback-only. `locale/change` fires on switches, and the plugin points `<html lang>` at the active locale (`en`) on activation and on every switch; the Language settings row is registered only when more than one locale ships. The service also owns the ns×locale dictionary registry (typed `register(ns, {en})` checked against `LocaleNamespaceMap`, `bind(ns)`→`TranslateNS<ns>`; lookup chain ns → common → en → key); a namespace dictionary may still be registered per locale, which is what an additional shipped locale would use. The service implements the slot system's `LocaleFace` and installs itself through `ctx.slots.installLocale`, backing the framework-injected `t` standard seat (`Translate`/`TranslateNS` are ui-slots types; import them from there — this package only re-exports for dictionary owners' convenience). The [Host-backed preferences decision](../../../.agents/notes/implemented/bug-fix/2026-08-06-host-backed-web-preferences.md) owns the persistence boundary.

## Model Experience

None, as the locale registry serves browser UI copy; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Some surfaces keep inline copy** — Settings rows, the sidebar, question composer, and model select use locale seats; other packages still own static text directly.
- **Registry-held text reads its translation once** — copy captured at registration time outside the slot render path (e.g. the `/model` command description in the command registry) keeps the language it was registered under until re-registration; slot-rendered copy follows switches live.
