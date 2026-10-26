/**
 * findings domain contract. The browser reads the session's durable findings
 * ledger (`.findings/ledger.jsonl` under the session cwd) through this face so
 * the Issues view renders the same records the host wrote, without granting
 * the client arbitrary filesystem access: the request names a session, and the
 * host resolves exactly one bounded path from that session's header.
 */

import type { SessionId } from '@pentest-harness/dsh-session/types'
import type { RpcRequest, RpcResponse } from './rpc.ts'

/** Severity ladder of one recorded finding. */
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

/** Lifecycle status of one recorded finding. */
export type FindingStatus = 'new' | 'confirmed' | 'false_positive' | 'duplicate' | 'fixed' | 'wontfix'

/** One folded ledger record as the Issues view renders it. */
export interface FindingView {
  /** Stable fingerprint-derived id (`F-xxxxxx`). */
  id: string
  title: string
  severity: FindingSeverity
  status: FindingStatus
  /** Affected URL or host:port. */
  target: string
  /** Vulnerability family token (`cors`, `xss`, …), null when the record omits it. */
  class: string | null
  /** Operator or agent that recorded the finding. */
  createdBy: string | null
  /** ISO-8601 timestamp of the newest record for this id. */
  lastActivity: string
  /** Whether an operator reproduced the finding by hand. */
  verified: boolean
}

/** Findings-domain unary methods (the map keys findings.* of RpcMethodMap). */
export interface FindingsApi {
  /**
   * Lists the folded findings ledger of one session.
   *
   * Replay is last-write-wins per id, mirroring the ledger writer, so a status
   * change appears as the current record rather than a duplicate row. A session
   * whose cwd has no ledger yields an empty list — absence is not an error.
   */
  list(request: RpcRequest<{ sessionId: SessionId }>): Promise<RpcResponse<{ findings: FindingView[] }>>
}
