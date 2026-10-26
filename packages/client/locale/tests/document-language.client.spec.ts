// @vitest-environment jsdom
/**
 * `<html lang>` states the active locale.
 *
 * The served markup declares a language of its own choosing, and the resolved
 * locale may differ from it (a stored Host preference adopted after
 * activation). Assistive technology and browser features read this attribute,
 * so a stale value misreports the document language rather than merely looking
 * untidy. One locale ships, so the attribute is stated once at activation.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@pentest-harness/cordis'
import { SlotRegistry } from '@pentest-harness/dsh-client-runtime/client'
import { apply as settingsApply, inject as settingsInject } from '@pentest-harness/dsh-client-ui-settings/client'
import { TestRemote } from '@pentest-harness/dsh-client-test-runtime'
import { apply, inject } from '@pentest-harness/dsh-client-locale/client'
import type { LocaleRuntime } from '@pentest-harness/dsh-client-locale/client'
import { LOCALE_SETTINGS_NAMESPACE, LocaleSettingsSchema } from '../src/locale-settings.ts'

/** Boot the plugin over a stub Host settings document. */
async function bench(preference?: string) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  let stored = preference
  let revision = 0
  const namespace = () => ({
    ns: LOCALE_SETTINGS_NAMESPACE,
    schema: LocaleSettingsSchema.toJSON(),
    value: stored === undefined ? {} : { preference: stored },
    applies: 'live' as const,
    secrets: [],
    revision,
  })
  const describeRpc = vi.fn(async () => ({
    rpcId: 'locale-describe' as never,
    result: { ok: true as const, value: { writable: true, hasDocument: true, namespaces: [namespace()] } },
  }))
  const mutate = vi.fn(async (request: { ops: { value: string }[] }) => {
    stored = request.ops[0]!.value
    revision += 1
    return { rpcId: 'locale-mutate' as never, result: { ok: true as const, value: namespace() } }
  })
  ctx.provide('connection', { api: { settings: { describe: describeRpc, mutate } }, isLoopback: true } as never)
  // The settings transport and the forwarded-event port the plugin injects.
  new TestRemote(ctx)
  await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
  await ctx.plugin({ inject: [...inject], apply }).await()
  return { ctx, locale: ctx.get('locale') as LocaleRuntime }
}

const langOf = (): string => document.documentElement.lang

describe('document language', () => {
  beforeEach(() => {
    // A stale tag from the two-locale era: the plugin must not depend on the
    // served markup already saying the right thing.
    document.documentElement.lang = 'zh-CN'
    Object.defineProperty(navigator, 'languages', { value: ['zh-CN'], configurable: true })
    Object.defineProperty(navigator, 'language', { value: 'zh-CN', configurable: true })
  })

  afterEach(() => {
    // navigator properties are installed with defineProperty above, so they
    // are removed the same way; nothing here goes through vi.stubGlobal.
    const own = navigator as unknown as Record<string, unknown>
    delete own.languages
    delete own.language
  })

  it('states the shipped locale at activation, not the value the markup shipped', async () => {
    // The browser asks for a language this build no longer ships; the document
    // must still describe the copy it actually renders.
    const { locale } = await bench()
    expect(locale.getLocale().active).toBe('en')
    expect(langOf()).toBe('en')
  })

  it('states an adopted Host preference at activation', async () => {
    const { locale } = await bench('en')
    await vi.waitFor(() => { expect(locale.getLocale().active).toBe('en') })
    expect(langOf()).toBe('en')
  })

  // The no-document arm is pinned where the client tree boots without a DOM:
  // apply.client.spec.ts runs in the node environment.
})
