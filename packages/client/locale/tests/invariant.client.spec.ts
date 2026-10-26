// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Context } from '@pentest-harness/cordis'
import { apply as nodeApply } from '@pentest-harness/dsh-client-locale'
import {
  apply as clientApply, COMMON_NS, LocaleRuntime, inject, SETTINGS_NS,
} from '@pentest-harness/dsh-client-locale/client'
import type { CommonKey } from '@pentest-harness/dsh-client-locale/client'
import * as LocaleInvariant from '@pentest-harness/dsh-client-locale/invariant'
import { SlotRegistry } from '@pentest-harness/dsh-client-runtime/client'
import InvariantRegistry from '@pentest-harness/dsh-invariants'
import { stubSettingsScope } from '@pentest-harness/dsh-client-test-runtime'
import { en } from '../src/locales/index.ts'
import { en as settingsEn } from '../src/locales/settings.ts'

describe('invariant companion', () => {
  it('registers under the package name with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(LocaleInvariant).await()).resolves.toBeDefined()
  })

  it('node-half apply tolerates a Host without settings', () => {
    nodeApply(new Context())
  })

  it('client apply provides ctx.locale seeded with the English common namespace', async () => {
    // The feature keeps its settings-namespace dictionary, hence the slots edge.
    expect(inject).toEqual(['slots', 'connection', 'remote', 'settingsScope'])
    const ctx = new Context()
    new SlotRegistry(ctx)
    ctx.provide('connection', { api: { settings: {} }, isLoopback: false } as never)
    // The settings row's transport and the forwarded-event port.
    ctx.provide('remote', { $on: () => () => {} } as never)
    ctx.provide('settingsScope', { bind: () => stubSettingsScope().scope } as never)
    await ctx.plugin({ inject, apply: clientApply }).await()
    const locale = ctx.get('locale')
    expect(locale).toBeInstanceOf(LocaleRuntime)
    // The (ns, locale) seats are occupied for the one shipped locale.
    expect(() => (locale as LocaleRuntime).register(COMMON_NS, 'en', {})).toThrow('already has locale')
    expect(() => (locale as LocaleRuntime).register(SETTINGS_NS, 'en', {})).toThrow('already has locale')
    // Seeded dictionaries ARE the shipped English ones: every key of the key
    // union resolves to its English copy.
    const t = (locale as LocaleRuntime).bind(COMMON_NS)
    for (const key of Object.keys(en) as CommonKey[]) {
      expect(t(key)).toBe(en[key])
    }
    expect((locale as LocaleRuntime).bind(SETTINGS_NS)('language.title')).toBe(settingsEn['language.title'])
  })
})
