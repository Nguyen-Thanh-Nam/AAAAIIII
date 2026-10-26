// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@pentest-harness/cordis'
import { stubSettingsScope, type StubSettingsScope } from '@pentest-harness/dsh-client-test-runtime'
import type { LocaleSettings, LocaleSnapshot } from '@pentest-harness/dsh-client-locale/client'
import { FALLBACK_LOCALE, LocaleRuntime } from '@pentest-harness/dsh-client-locale/client'
const make = (host?: StubSettingsScope<LocaleSettings>): {
  ctx: Context
  svc: LocaleRuntime
  events: LocaleSnapshot[]
} => {
  const ctx = new Context()
  const events: LocaleSnapshot[] = []
  ctx.on('locale/change', (snapshot) => { events.push(snapshot) })
  return { ctx, svc: new LocaleRuntime(ctx, host?.scope), events }
}

/**
 * Pin the browser environment a fresh service reads its initial locale from.
 * This package's own specs stub the globals directly instead of using
 * `usePinnedBrowserLanguages` (dsh-client-test-runtime): they need the shapes
 * that helper deliberately cannot express — a missing `languages` list, a
 * list decoupled from `language`, and a non-browser run with no `window`.
 */
const stubLanguages = (...tags: string[]): void => {
  vi.stubGlobal('navigator', { languages: tags, language: tags[0] ?? '' })
}

describe('LocaleRuntime', () => {
  beforeEach(() => {
    // A browser asking for the shipped language in a regional variant.
    stubLanguages('en-US')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('translates through the active dictionary and echoes a key it does not hold', () => {
    const { svc } = make()
    svc.register('ns', 'en', { hello: 'Hello' })
    const t = svc.bind('ns')
    expect(svc.getLocale().active).toBe('en')
    expect(t('hello')).toBe('Hello')
    expect(t('missing.key')).toBe('missing.key')
  })

  it('falls through to the common vocabulary after the namespace misses (production keys)', () => {
    const { svc } = make()
    // The shipped common dictionary is registered by apply; the bench
    // registers it directly to pin the production chain: ns -> common -> key.
    svc.register('common', 'en', { retry: 'Retry' })
    svc.register('ns', 'en', { own: 'Own' })
    const t = svc.bind('ns')
    expect(t('retry')).toBe('Retry')
    expect(t('own')).toBe('Own')
    // A key neither namespace holds echoes itself (fail loud, never blank).
    expect(t('cancel')).toBe('cancel')
    // common itself must not recurse: a miss inside common echoes the key.
    // (Wide-string ns hits the untyped bind overload — the typed one rejects
    // unknown keys at compile time, which is the point of the typed registry contract.)
    expect(svc.bind('common' as string)('nope')).toBe('nope')
  })

  it('never serves copy registered only for a locale this build no longer ships', () => {
    const { svc } = make()
    // The registry stays keyed by locale so a second shipped locale can fill
    // its own seat; until then another locale's dictionary is inert and the
    // key surfaces (fail loud) instead of rendering the unshipped language.
    svc.register('ns', 'zh', { onlyZh: 'unshipped copy' })
    const t = svc.bind('ns')
    expect(t('onlyZh')).toBe('onlyZh')
  })

  it('interpolates {name} params and leaves unknown placeholders intact', () => {
    const { svc } = make()
    svc.register('ns', 'en', { greet: 'Hello, {name}! attempt {n}', partial: '{known} and {unknown}' })
    const t = svc.bind('ns')
    expect(t('greet', { name: 'world', n: 2 })).toBe('Hello, world! attempt 2')
    expect(t('partial', { known: 'A' })).toBe('A and {unknown}')
  })

  it('bind returns a stable per-namespace function identity', () => {
    const { svc } = make()
    expect(svc.bind('a')).toBe(svc.bind('a'))
    expect(svc.bind('a')).not.toBe(svc.bind('b'))
  })

  it('rejects duplicate (ns, locale) and disposer only removes its own dict', () => {
    const { svc } = make()
    const dispose = svc.register('ns', 'en', { k: 'v1' })
    expect(() => svc.register('ns', 'en', { k: 'v2' })).toThrow('already has locale')
    dispose()
    const t = svc.bind('ns')
    expect(t('k')).toBe('k')
    svc.register('ns', 'en', { k: 'v2' })
    expect(t('k')).toBe('v2')
    // A stale disposer run must not remove the replacement dictionary.
    dispose()
    expect(t('k')).toBe('v2')
  })

  it('serves the LocaleFace: registration moves the revision and notifies subscribers, unsubscribe stops them', () => {
    const { svc } = make()
    const seen: number[] = []
    const off = svc.subscribe(() => { seen.push(svc.getSnapshot().revision) })
    expect(svc.getSnapshot()).toBe(svc.getLocale())
    const r0 = svc.getSnapshot().revision
    svc.register('ns', 'en', { k: 'v' })
    expect(svc.getSnapshot().revision).toBe(r0 + 1)
    expect(seen).toEqual([r0 + 1])
    // Re-picking the only shipped locale republishes nothing: the snapshot it
    // would announce is the one already on screen.
    svc.setLocale('en')
    expect(svc.getSnapshot().revision).toBe(r0 + 1)
    expect(seen).toEqual([r0 + 1])
    off()
    svc.register('ns2', 'en', { k: 'v' })
    expect(seen).toEqual([r0 + 1])
  })

  it('isolates a throwing subscriber: the rest still see the new revision', () => {
    const { svc } = make()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const seen: number[] = []
      svc.subscribe(() => { throw new Error('boom') })
      svc.subscribe(() => { seen.push(svc.getSnapshot().revision) })
      svc.register('ns', 'en', { k: 'v' })
      expect(seen).toEqual([1])
      expect(spy).toHaveBeenCalledOnce()
    } finally {
      spy.mockRestore()
    }
  })

  it('register disposer republishes (mounted outlets drop the dead dictionary)', () => {
    const { svc } = make()
    const dispose = svc.register('ns', 'en', { k: 'v' })
    const before = svc.getSnapshot().revision
    dispose()
    expect(svc.getSnapshot().revision).toBe(before + 1)
    // Second run hits the idempotent arm: nothing removed, no republish.
    dispose()
    expect(svc.getSnapshot().revision).toBe(before + 1)
  })

  it('setLocale writes the explicit pick through the scope and announces no switch', () => {
    const host = stubSettingsScope<LocaleSettings>()
    const { svc, events } = make(host)
    svc.setLocale('en')
    expect(svc.getLocale().active).toBe('en')
    expect(host.set).toHaveBeenCalledWith('preference', 'en')
    expect(events).toEqual([])
    // Re-selecting writes again: the active value may be a provisional
    // browser-derived resolution nothing has stored, and picking it is an
    // explicit choice that must outlive this browser.
    svc.setLocale('en')
    expect(host.set).toHaveBeenCalledTimes(2)
    expect(host.set).toHaveBeenLastCalledWith('preference', 'en')
  })

  it('persists an explicit pick of the provisional locale, so a shared DSH home agrees', () => {
    // A browser naming no shipped language opens at FALLBACK_LOCALE with
    // nothing stored. Choosing that language is still an explicit choice and
    // must become durable for a browser that shares the same DSH home.
    stubLanguages('fr-FR')
    const host = stubSettingsScope<LocaleSettings>()
    const { svc } = make(host)
    expect(svc.getLocale().active).toBe('en')
    expect(host.set).not.toHaveBeenCalled()
    svc.setLocale('en')
    expect(host.set).toHaveBeenCalledWith('preference', 'en')
  })

  it('setLocale without a host scope stays process-local', () => {
    const { svc, events } = make()
    svc.setLocale('en')
    expect(svc.getLocale().active).toBe('en')
    expect(events).toEqual([])
  })

  it('rejects unknown locale ids, including the locale this build no longer ships', () => {
    const { svc } = make()
    expect(() => { svc.setLocale('fr') }).toThrow('locale "fr" is not registered')
    expect(() => { svc.setLocale('zh') }).toThrow('locale "zh" is not registered')
    // The rejection leaves the runtime on its shipped locale.
    expect(svc.getLocale().active).toBe('en')
    svc.setLocale('en')
    expect(svc.getLocale().active).toBe('en')
  })

  it('adopts a Host preference naming the shipped locale without writing it back', () => {
    const host = stubSettingsScope<LocaleSettings>()
    const { svc, events } = make(host)
    host.publish({ status: 'ready', value: { preference: 'en' }, revision: 1, writable: true })
    expect(svc.getLocale().active).toBe('en')
    expect(events).toEqual([])
    expect(host.set).not.toHaveBeenCalled()
    host.publish({ value: { preference: 'en' }, revision: 2 })
    expect(svc.getLocale().active).toBe('en')
    expect(host.set).not.toHaveBeenCalled()
  })

  it('a stored preference for a locale this build no longer ships falls back to the browser', () => {
    const host = stubSettingsScope<LocaleSettings>()
    const { svc, events } = make(host)
    // The durable document was written before the shipped set narrowed, so it
    // still names the removed locale; the wire type admits today's ids only,
    // which is why the stale value is modelled through a cast.
    const stale = { preference: 'zh' } as unknown as LocaleSettings
    host.publish({ status: 'ready', value: stale, revision: 1, writable: true })
    // Unadopted: an unshipped id would otherwise have become the active
    // locale and stranded every lookup on the fallback dictionary.
    expect(svc.getLocale().active).toBe('en')
    expect(events).toEqual([])
    host.publish({ value: {}, revision: 2 })
    expect(svc.getLocale().active).toBe('en')
    expect(host.set).not.toHaveBeenCalled()
  })

  it('adopts a section already standing at construction and releases its subscription on dispose', async () => {
    const host = stubSettingsScope<LocaleSettings>()
    host.publish({ status: 'ready', value: { preference: 'en' }, revision: 1, writable: true })
    const { ctx, svc } = make(host)
    expect(svc.getLocale().active).toBe('en')
    expect(host.listenerCount()).toBe(1)
    await ctx.fiber.dispose()
    expect(host.listenerCount()).toBe(0)
  })

  it('resolves to the shipped locale whatever language the browser asks for', () => {
    stubLanguages('en-GB', 'fr-FR')
    expect(make().svc.getLocale().active).toBe('en')
    // An unshipped language walks the list to the first one this app ships.
    stubLanguages('fr-FR', 'en-US')
    expect(make().svc.getLocale().active).toBe('en')
    // Only `language` populated: an empty ordered list.
    vi.stubGlobal('navigator', { languages: [], language: 'en-US' })
    expect(make().svc.getLocale().active).toBe('en')
    // A host that exposes no `languages` property at all.
    vi.stubGlobal('navigator', { language: 'en-US' })
    expect(make().svc.getLocale().active).toBe('en')
    // No shipped language anywhere in the browser's preferences: en is the
    // product default rather than an arbitrary near-match.
    stubLanguages('fr-FR', 'de')
    expect(make().svc.getLocale().active).toBe('en')
    stubLanguages('zh-Hant-TW')
    expect(make().svc.getLocale().active).toBe('en')
  })

  it('runs outside a browser (node boots): the default decides and the machine language does not', () => {
    vi.stubGlobal('window', undefined)
    // Node exposes its own global navigator; without a window it must not
    // reach the resolution at all.
    stubLanguages('zh-CN')
    expect(make().svc.getLocale().active).toBe('en')
  })

  it('serves English as both the opening locale and the dictionary fallback', () => {
    // One constant covers both jobs: the locale the UI opens in with no usable
    // browser signal, and the dictionary consulted after an active-locale miss.
    expect(FALLBACK_LOCALE).toBe('en')
    vi.stubGlobal('window', undefined)
    const { svc } = make()
    expect(svc.getLocale().active).toBe(FALLBACK_LOCALE)
    svc.register('ns', 'en', { onlyEn: 'English only' })
    expect(svc.bind('ns')('onlyEn')).toBe('English only')
  })

  it('exposes exactly one shipped locale, self-described', () => {
    const { svc } = make()
    expect(svc.getLocale().locales).toEqual([{ id: 'en', label: 'English' }])
  })
})
