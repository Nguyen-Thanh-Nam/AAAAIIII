// @vitest-environment jsdom
/**
 * The tab ring asks each view once per session how much it holds. These cases
 * pin the parts a header depends on: a count is read once and cached, a
 * changing count republishes a new snapshot, a view that reports nothing shows
 * no badge, a failing read stays silent, and a disposed provider stops being
 * asked.
 */
import { describe, expect, it, vi } from 'vitest'
import type { SessionId } from '@pentest-harness/dsh-api-remotes/client'
import { ViewBadgeRegistry } from '../src/client/view-badges.ts'

const S1 = 's1' as SessionId
const S2 = 's2' as SessionId

describe('ViewBadgeRegistry', () => {
  it('reads each view once per session and reuses the cached count', () => {
    const registry = new ViewBadgeRegistry()
    const provider = vi.fn(async () => 4)
    registry.register('issues', provider)

    registry.request(S1, ['issues'])
    registry.request(S1, ['issues'])
    registry.request(S2, ['issues'])

    expect(provider).toHaveBeenCalledTimes(2)
    expect(provider).toHaveBeenCalledWith(S1, expect.any(AbortSignal))
    expect(provider).toHaveBeenCalledWith(S2, expect.any(AbortSignal))
  })

  it('publishes the count to subscribers with a new snapshot identity', async () => {
    const registry = new ViewBadgeRegistry()
    const listener = vi.fn()
    registry.subscribe(listener)
    const empty = registry.snapshot(S1)
    registry.register('issues', async () => 2)

    registry.request(S1, ['issues'])
    await vi.waitFor(() => { expect(listener).toHaveBeenCalled() })

    expect(registry.snapshot(S1).get('issues')).toBe(2)
    expect(registry.snapshot(S1)).not.toBe(empty)
  })

  it('keeps one snapshot identity while the count does not move', async () => {
    const registry = new ViewBadgeRegistry()
    const listener = vi.fn()
    registry.register('issues', async () => 0)
    registry.request(S1, ['issues'])
    await vi.waitFor(() => { expect(registry.snapshot(S1).get('issues')).toBe(0) })
    const settled = registry.snapshot(S1)
    registry.subscribe(listener)

    // A second view that reports nothing must not republish the snapshot.
    registry.register('other', async () => undefined)
    registry.request(S1, ['other'])
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(registry.snapshot(S1)).toBe(settled)
    expect(listener).not.toHaveBeenCalled()
  })

  it('shows no badge when the view reports undefined, and none while a read fails', async () => {
    const registry = new ViewBadgeRegistry()
    registry.register('issues', async () => undefined)
    registry.register('broken', async () => { throw new Error('ledger unreadable') })

    registry.request(S1, ['issues', 'broken'])
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(registry.snapshot(S1).size).toBe(0)
    // A later session retries instead of caching the failure.
    registry.request(S2, ['issues', 'broken'])
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(registry.snapshot(S2).size).toBe(0)
  })

  it('stops asking a view that disposed its registration', async () => {
    const registry = new ViewBadgeRegistry()
    const provider = vi.fn(async () => 1)
    const dispose = registry.register('issues', provider)
    dispose()

    registry.request(S1, ['issues'])
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(provider).not.toHaveBeenCalled()
    expect(registry.snapshot(S1).size).toBe(0)
  })
})
