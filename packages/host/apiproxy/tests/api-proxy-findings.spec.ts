/**
 * The findings domain reads ledgers the session can see: by default every
 * `.findings/ledger.jsonl` at or below the folder its workspace owns, and with
 * `scope: 'session'` only its own cwd. Opening one folder must never show a
 * sibling folder's findings, so a session that belongs to no workspace
 * degrades to the session scope instead of reading a shared file.
 */

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@pentest-harness/cordis'
import AgentRegistry from '@pentest-harness/dsh-agent'
import type { Agent } from '@pentest-harness/dsh-agent'
import SessionStore from '@pentest-harness/dsh-session'
import UserQuestionService from '@pentest-harness/dsh-user-questions'
import type { Session } from '@pentest-harness/dsh-session'
import type { ApiProxy, RpcRequest } from '@pentest-harness/dsh-host-apiproxy/api'
import { RpcId } from '@pentest-harness/dsh-host-apiproxy/api/rpc'
import { createApiProxy } from '@pentest-harness/dsh-host-apiproxy'

let nextRpc = 1
function request<P>(payload: P): RpcRequest<P> {
  return { rpcId: RpcId(`findings-${String(nextRpc++)}`), payload }
}

/** One ledger line in the shape the engagement toolset writes. */
function ledgerLine(id: string, title: string, severity: string): string {
  return JSON.stringify({
    v: 1,
    op: 'add',
    id,
    fp: id.slice(2),
    ts: '2026-10-26T00:00:00.000Z',
    title,
    severity,
    status: 'confirmed',
    createdBy: 'worker',
    target: 'https://example.test/',
    host: 'example.test',
    class: 'headers',
    evidence: 'http 200',
    impact: 'none proven',
    remediation: 'set headers',
    verified: true,
  })
}

interface Harness {
  ctx: Context
  api: ApiProxy
  root: string
  /** Create a session whose header cwd is the given folder. */
  session: (cwd: string) => Session
  /** Point the workspace registry at one folder owned by `sessionId`. */
  workspace: (path: string, title: string, sessionIds: readonly string[]) => void
}

async function harness(): Promise<Harness> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(UserQuestionService)
  await ctx.plugin(AgentRegistry)
  const root = await mkdtemp(join(tmpdir(), 'dsh-findings-'))
  let workspaces: unknown[] = []
  ctx.provide('workspaceRegistry', { list: () => workspaces } as never)
  return {
    ctx,
    api: createApiProxy(ctx, { defaultModelSelection: () => ({ provider: 'p', model: 'm' }), cwd: root }),
    root,
    session: (cwd) => {
      const session = ctx.sessions.create(undefined, { meta: { cwd } })
      ctx.agents.register({ id: session.id, session, status: 'idle', ctx } as Agent)
      return session
    },
    workspace: (path, title, sessionIds) => {
      workspaces = [{
        workspaceId: 'w-findings' as never,
        path,
        title,
        sessionIds: sessionIds as never,
        createdAt: '0',
        updatedAt: '0',
      }]
    },
  }
}

/** Write one ledger with the given lines below `folder`. */
async function ledger(folder: string, lines: readonly string[]): Promise<void> {
  const dir = join(folder, '.findings')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'ledger.jsonl'), `${lines.join('\n')}\n`, 'utf8')
}

const roots: Harness[] = []
afterEach(async () => {
  for (const open of roots.splice(0)) await rm(open.root, { recursive: true, force: true })
})

describe('findings.list scope', () => {
  it('reads the whole folder by default, tagging each row with its folder', async () => {
    const open = await harness()
    roots.push(open)
    const session = open.session(open.root)
    open.workspace(open.root, 'demo', [session.id])
    await ledger(open.root, [ledgerLine('F-root', 'Root finding', 'low')])
    await ledger(join(open.root, 'engagements', 'main'), [ledgerLine('F-nested', 'Nested finding', 'high')])

    const response = await open.api.findings.list(request({ sessionId: session.id }))
    if (!response.result.ok) throw new Error(response.result.error.message)

    expect(response.result.value.scope).toEqual({
      kind: 'workspace',
      label: 'demo',
      folders: ['', 'engagements/main'],
    })
    expect(response.result.value.findings.map(row => [row.id, row.folder]))
      .toEqual([['F-root', ''], ['F-nested', 'engagements/main']])
  })

  it('narrows to the task cwd when the scope is session', async () => {
    const open = await harness()
    roots.push(open)
    const session = open.session(open.root)
    open.workspace(open.root, 'demo', [session.id])
    await ledger(open.root, [ledgerLine('F-root', 'Root finding', 'low')])
    await ledger(join(open.root, 'engagements', 'main'), [ledgerLine('F-nested', 'Nested finding', 'high')])

    const response = await open.api.findings.list(request({ sessionId: session.id, scope: 'session' }))
    if (!response.result.ok) throw new Error(response.result.error.message)

    expect(response.result.value.scope).toEqual({
      kind: 'session',
      label: basename(open.root),
      folders: [''],
    })
    expect(response.result.value.findings.map(row => row.id)).toEqual(['F-root'])
  })

  it('falls back to the session scope when the session belongs to no workspace', async () => {
    const open = await harness()
    roots.push(open)
    const session = open.session(open.root)
    open.workspace(join(open.root, 'other'), 'other', [])
    await ledger(open.root, [ledgerLine('F-root', 'Root finding', 'low')])
    await ledger(join(open.root, 'engagements', 'main'), [ledgerLine('F-nested', 'Nested finding', 'high')])

    const response = await open.api.findings.list(request({ sessionId: session.id }))
    if (!response.result.ok) throw new Error(response.result.error.message)

    expect(response.result.value.scope.kind).toBe('session')
    expect(response.result.value.findings.map(row => row.id)).toEqual(['F-root'])
  })

  it('refuses a session that is not attached', async () => {
    const open = await harness()
    roots.push(open)
    const response = await open.api.findings.list(request({ sessionId: 'missing' as never }))
    expect(response.result.ok).toBe(false)
    if (response.result.ok) throw new Error('expected a refusal')
    expect(response.result.error.code).toBe('session-not-found')
  })
})
