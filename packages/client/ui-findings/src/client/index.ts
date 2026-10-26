/**
 * Issues plugin: registers the `conversation.view` tab that renders findings
 * beside Chat / Trajectory / Bounty / Workflow.
 *
 * The ledgers are host state, so the view never names a path: registration
 * injects a `load` callback that addresses the session and calls
 * `findings.list`, letting the host resolve the folder that session's
 * workspace owns. The view passes the scope it wants, so the same session can
 * show its folder's findings or only its own.
 */
import type { Context } from '@pentest-harness/cordis'
import type {} from '@pentest-harness/dsh-client-ui-conversation/client'
import type { ConnectionHandle, FindingsScope, FindingView, SessionId } from '@pentest-harness/dsh-api-remotes/client'
import type {} from '@pentest-harness/dsh-client-locale/client'
import type {} from '@pentest-harness/dsh-client-ui-conversation/client'
import { IssuesView, type IssuesViewInjected } from './IssuesView.tsx'
import { en, NS } from './locales.ts'

/** Required services: the tab ring, conversation face, session bindings, dictionaries, wire client. */
export const inject = ['slots', 'conversation', 'sessions', 'locale', 'connection']

/**
 * Client plugin body: register the findings tab into the conversation view.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { en }), 'ui-findings: dictionaries')
  const t = ctx.locale.bind(NS)

  /** Read the folded ledgers one session can see, in the requested scope. */
  const loadFindings = async (
    sessionId: SessionId,
    scope: 'workspace' | 'session',
    signal: AbortSignal,
  ): Promise<{ findings: readonly FindingView[]; scope: FindingsScope }> => {
    const client = ctx.get('connection') as ConnectionHandle
    const { result } = await client.api.findings.list({ sessionId, scope }, signal)
    if (!result.ok) throw new Error(result.error.message)
    return { findings: result.value.findings, scope: result.value.scope }
  }

  // The tab shows how many findings it holds. The count comes from the same
  // reader the view uses, so a badge and the table can never disagree.
  ctx.effect(() => ctx.conversation.viewBadges.register(
    'issues',
    async (sessionId, signal) => (await loadFindings(sessionId, 'workspace', signal)).findings.length,
  ), 'ui-findings: tab count')

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'issues',
    // Right beside Chat (0) and before Trajectory (10): Task | Issues | …
    order: 5,
    locale: NS,
    label: () => t('view.issues'),
    inject: (sessionId: SessionId): IssuesViewInjected => ({
      sessionId,
      load: (scope, signal) => loadFindings(sessionId, scope, signal),
    }),
  }, IssuesView))
}
