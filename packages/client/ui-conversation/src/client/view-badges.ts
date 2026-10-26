/**
 * Live per-view counts beside a view's tab label.
 *
 * A view knows how much it holds; the tab ring knows where to put the number.
 * Neither can import the other, so a view registers a {@link ViewBadgeProvider}
 * and the ring asks for every registered view's count when the session it is
 * showing changes. The provider is asked once per (session, view) pair and the
 * answer is cached until the session changes again, because a tab badge is a
 * claim about what is stored, not a polling channel.
 */
import type { SessionId } from '@pentest-harness/dsh-api-remotes/client'

/**
 * Reports how many records a view holds for one session.
 *
 * The provider does its own I/O through the same loader its view uses, so the
 * badge and the view can never disagree about the ledger they read. An
 * `undefined` result means "this session has nothing to count" and renders no
 * badge at all, which is different from a real `0`.
 * @param sessionId - the session whose view is being tabulated.
 * @param signal - aborts the read when the session or view set changes.
 * @returns the count to show, or `undefined` for no badge.
 */
export type ViewBadgeProvider = (sessionId: SessionId, signal: AbortSignal) => Promise<number | undefined>

/** What the tab ring consumes: registration, the read, and the snapshot. */
export interface ViewBadges {
  /**
   * Contribute a count for one view id.
   * @param viewId - the `conversation.view` entry id the count belongs to.
   * @param provider - reads the count for one session.
   * @returns the disposer; registering the same id twice keeps the later one.
   */
  register(viewId: string, provider: ViewBadgeProvider): () => void
  /**
   * Ask every registered provider for the requested views of one session.
   * @param sessionId - session being shown.
   * @param viewIds - view ids the ring currently renders.
   */
  request(sessionId: SessionId, viewIds: readonly string[]): void
  /**
   * The counts known for one session, keyed by view id.
   * @param sessionId - session being shown.
   * @returns a stable map, replaced only when a count actually changes.
   */
  snapshot(sessionId: SessionId): ReadonlyMap<string, number>
  /**
   * Subscribe to count changes.
   * @param listener - called after a snapshot changes.
   * @returns the unsubscribe disposer.
   */
  subscribe(listener: () => void): () => void
}

/** Shared empty snapshot: identity-stable for sessions with nothing to count. */
const EMPTY: ReadonlyMap<string, number> = new Map()

/** One view's request state for one session. */
interface PendingRead {
  readonly abort: AbortController
}

/**
 * Per-session view-badge registry. Plugin-owned: the tab ring reads it through
 * the conversation service, and a view registers into the same instance.
 */
export class ViewBadgeRegistry implements ViewBadges {
  private readonly providers = new Map<string, ViewBadgeProvider>()
  private readonly counts = new Map<SessionId, Map<string, number>>()
  private readonly snapshots = new Map<SessionId, ReadonlyMap<string, number>>()
  private readonly pending = new Map<string, PendingRead>()
  private readonly listeners = new Set<() => void>()

  /** @param viewId - the `conversation.view` entry id. @param provider - reads one session's count. @returns the disposer. */
  register(viewId: string, provider: ViewBadgeProvider): () => void {
    this.providers.set(viewId, provider)
    return () => {
      if (this.providers.get(viewId) === provider) this.providers.delete(viewId)
    }
  }

  /** @param sessionId - session being shown. @param viewIds - views the ring renders. */
  request(sessionId: SessionId, viewIds: readonly string[]): void {
    for (const viewId of viewIds) {
      const provider = this.providers.get(viewId)
      if (provider === undefined) continue
      const key = `${sessionId}\u0000${viewId}`
      if (this.pending.has(key) || this.counts.get(sessionId)?.has(viewId) === true) continue
      const abort = new AbortController()
      this.pending.set(key, { abort })
      void provider(sessionId, abort.signal).then(
        (count) => {
          this.pending.delete(key)
          if (abort.signal.aborted) return
          if (count !== undefined) this.write(sessionId, viewId, count)
        },
        () => {
          // A count is decoration: a failed read leaves the badge off rather
          // than breaking the header, and the next session change retries.
          this.pending.delete(key)
        },
      )
    }
  }

  /** @param sessionId - session being shown. @returns this session's counts, keyed by view id. */
  snapshot(sessionId: SessionId): ReadonlyMap<string, number> {
    return this.snapshots.get(sessionId) ?? EMPTY
  }

  /** @param listener - called after a count changes. @returns the unsubscribe disposer. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Store one count and publish a fresh snapshot when the value actually moved. */
  private write(sessionId: SessionId, viewId: string, count: number): void {
    let held = this.counts.get(sessionId)
    if (held === undefined) {
      held = new Map()
      this.counts.set(sessionId, held)
    }
    if (held.get(viewId) === count) return
    held.set(viewId, count)
    this.snapshots.set(sessionId, new Map(held))
    for (const listener of this.listeners) listener()
  }
}
