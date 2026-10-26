/**
 * Issues plugin: registers the `conversation.view` tab that renders the
 * session's findings ledger beside Chat / Trajectory / Bounty / Workflow.
 *
 * The ledger is host state, so the view never names a path: registration
 * injects a `load` callback that address the session and calls
 * `findings.list`, letting the host resolve exactly one bounded file.
 */
import type { Context } from '@pentest-harness/cordis'
import type { ConnectionHandle, FindingView, SessionId } from '@pentest-harness/dsh-api-remotes/client'
import type {} from '@pentest-harness/dsh-client-locale/client'
import type {} from '@pentest-harness/dsh-client-ui-conversation/client'
import { IssuesView, type IssuesViewInjected } from './IssuesView.tsx'
import { en, NS, zh } from './locales.ts'

/** Required services: the tab ring, session bindings, dictionaries, wire client. */
export const inject = ['slots', 'sessions', 'locale', 'connection']

/**
 * Client plugin body: register the findings tab into the conversation view.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-findings: dictionaries')
  const t = ctx.locale.bind(NS)

  /** Read the folded ledger of one session through the host findings domain. */
  const loadFindings = async (sessionId: SessionId, signal: AbortSignal): Promise<readonly FindingView[]> => {
    const client = ctx.get('connection') as ConnectionHandle
    const { result } = await client.api.findings.list({ sessionId }, signal)
    if (!result.ok) throw new Error(result.error.message)
    return result.value.findings
  }

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'issues',
    // Right beside Chat (0) and before Trajectory (10): Task | Issues | …
    order: 5,
    locale: NS,
    label: () => t('view.issues'),
    inject: (sessionId: SessionId): IssuesViewInjected => ({
      sessionId,
      load: (signal: AbortSignal) => loadFindings(sessionId, signal),
    }),
  }, IssuesView))
}
