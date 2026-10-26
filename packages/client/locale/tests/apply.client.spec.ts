/** locale apply wiring: the service + English dictionaries are provisioned and
 * the Language row stays out of the settings surface — one shipped locale
 * leaves nothing to choose, so the guard registers no row in any lifecycle
 * order. */
import { Context } from '@pentest-harness/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@pentest-harness/dsh-client-runtime/client'
import { apply as settingsApply, inject as settingsInject } from '@pentest-harness/dsh-client-ui-settings/client'
import { TestRemote } from '@pentest-harness/dsh-client-test-runtime'
import {
  apply, COMMON_NS, inject, SETTINGS_NS,
} from '@pentest-harness/dsh-client-locale/client'
import type { LocaleRuntime } from '@pentest-harness/dsh-client-locale/client'
import { LOCALE_SETTINGS_NAMESPACE, LocaleSettingsSchema } from '../src/locale-settings.ts'

const SLOT = 'settings.general.item'

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  let preference: string | undefined
  let revision = 0
  const namespace = () => ({
    ns: LOCALE_SETTINGS_NAMESPACE,
    schema: LocaleSettingsSchema.toJSON(),
    value: preference === undefined ? {} : { preference },
    applies: 'live' as const,
    secrets: [],
    revision,
  })
  const describe = vi.fn(async () => ({
    rpcId: 'locale-describe' as never,
    result: {
      ok: true as const,
      value: { writable: true, hasDocument: true, namespaces: [namespace()] },
    },
  }))
  const mutate = vi.fn(async (request: { ops: { value: string }[] }) => {
    preference = request.ops[0]!.value
    revision += 1
    return {
      rpcId: 'locale-mutate' as never,
      result: { ok: true as const, value: namespace() },
    }
  })
  ctx.provide('connection', { api: { settings: { describe, mutate } }, isLoopback: true } as never)
  // The settings transport and the forwarded-event port the plugin injects.
  new TestRemote(ctx)
  await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
  return {
    ctx, slots: ctx.get('slots') as SlotRegistry, describe, mutate,
    setHostPreference: (next: string | undefined) => { preference = next; revision += 1 },
  }
}

/** Stand in for the settings shell: declare the General item slot from root. */
function declareItems(slots: SlotRegistry): () => void {
  return slots.register(
    { name: 'root', children: { [SLOT]: { kind: 'list', scope: 'root' } } } as never,
    () => null,
  )
}

describe('locale apply', () => {
  // These are wiring specs, not default-language specs. A fresh LocaleRuntime
  // with no jsdom `window` skips browser detection and opens on FALLBACK_LOCALE
  // (en); the specs below therefore assert the shipped English copy directly.

  it('declares the slot service', () => {
    expect(inject).toEqual(['slots', 'connection', 'remote', 'settingsScope'])
  })

  it('provides the service seeded with the English dictionaries', async () => {
    const b = await bench()
    declareItems(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const locale = b.ctx.get('locale') as LocaleRuntime
    // Both base namespaces are occupied for the shipped locale.
    expect(() => locale.register(COMMON_NS, 'en', {})).toThrow('already has locale')
    expect(() => locale.register(SETTINGS_NS, 'en', {})).toThrow('already has locale')
    // The seat of a locale this build does not ship stays free.
    expect(() => { locale.register(COMMON_NS, 'zh', {})() }).not.toThrow()
    // The seeded dictionaries are the shipped English ones.
    expect(locale.bind(COMMON_NS)('ok')).toBe('OK')
    expect(locale.bind(SETTINGS_NS)('language.title')).toBe('Language')
  })

  it('registers no Language row although the General item slot is declared', async () => {
    // Declaration before apply: the guard is evaluated with the slot already
    // standing, so an absent row is a decision rather than a missed cascade.
    const before = await bench()
    declareItems(before.slots)
    await before.ctx.plugin({ inject: [...inject], apply }).await()
    expect(before.slots.entries(SLOT)).toEqual([])

    // Declaration after apply must not resurrect it through the recovery path.
    const after = await bench()
    await after.ctx.plugin({ inject: [...inject], apply }).await()
    expect(after.slots.entries(SLOT)).toEqual([])
    declareItems(after.slots)
    await Promise.resolve()
    expect(after.slots.entries(SLOT)).toEqual([])
  })

  it('loads and re-reads the explicit Host preference; the shipped locale stands either way', async () => {
    const b = await bench()
    // The shared mirror read once at bench time; a Host-side change reaches it
    // through the document invalidation, exactly as production announces one.
    b.setHostPreference('en')
    b.ctx.remote.$dispatch('settings/document-updated', [LOCALE_SETTINGS_NAMESPACE, 0])
    declareItems(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const locale = b.ctx.get('locale') as LocaleRuntime
    await vi.waitFor(() => { expect(locale.getLocale().active).toBe('en') })
    // Clearing the preference falls back to the browser-derived locale, which
    // resolves to the same shipped locale.
    b.setHostPreference(undefined)
    b.ctx.remote.$dispatch('settings/document-updated', [LOCALE_SETTINGS_NAMESPACE, 0])
    await vi.waitFor(() => { expect(locale.getLocale().active).toBe('en') })
    // Re-selecting the shipped locale is an explicit pick and must be written.
    locale.setLocale('en')
    await vi.waitFor(() => { expect(b.mutate).toHaveBeenCalledTimes(1) })
    expect(locale.getLocale().active).toBe('en')
    // One read per announcement the sitting scope can see: activation and the
    // two invalidations above (the bench-time dispatch preceded the scope).
    await vi.waitFor(() => { expect(b.describe).toHaveBeenCalledTimes(3) })
  })

  it('keeps the row out across a declaration collapse and redeclaration', async () => {
    const b = await bench()
    const host = declareItems(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    expect(b.slots.entries(SLOT)).toEqual([])

    // Collapse: the declarer dies and the cascade removes every contribution
    // into the slot. A guard that had registered instead would re-run here.
    host()
    expect(b.slots.entries(SLOT)).toEqual([])

    declareItems(b.slots)
    await Promise.resolve()
    expect(b.slots.entries(SLOT)).toEqual([])
  })

  it('teardown leaves the slot ledger empty; teardown without a declaration is quiet', async () => {
    const b = await bench()
    declareItems(b.slots)
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.slots.entries(SLOT)).toEqual([])
    await fiber.dispose()
    expect(b.slots.entries(SLOT)).toEqual([])

    // Never-declared bench: the plugin disposes before any declaration exists.
    const quiet = await bench()
    const f2 = quiet.ctx.plugin({ inject: [...inject], apply })
    await f2.await()
    await f2.dispose()
    expect(quiet.slots.entries(SLOT)).toEqual([])
  })
})
