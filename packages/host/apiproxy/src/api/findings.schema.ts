/**
 * findings domain zod schemas (names derived from map keys). The severity and
 * status enumerations are duplicated here as literals because the wire schema
 * is the authority the client validates against; the contract's unions are the
 * compile-time twin of the same ladder.
 */

import { z } from 'zod'
import type { RequestPayload, ResponseValue } from './rpc-map.ts'
import type { Wire } from './rpc.schema.ts'
import type { FindingView } from './findings.ts'
import { sessionIdSchema } from './sessions.schema.ts'

/** One finding row of every findings.* response. */
export const findingViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  status: z.enum(['new', 'confirmed', 'false_positive', 'duplicate', 'fixed', 'wontfix']),
  target: z.string(),
  class: z.string().nullable(),
  createdBy: z.string().nullable(),
  lastActivity: z.string(),
  verified: z.boolean(),
}) satisfies z.ZodType<Wire<FindingView>>

/** findings.list request payload: the session whose ledger is read. */
export const findingsListRequestSchema = z.object({
  sessionId: sessionIdSchema,
}) satisfies z.ZodType<Wire<RequestPayload<'findings.list'>>>

/** findings.list response value: the folded ledger. */
export const findingsListValueSchema = z.object({
  findings: z.array(findingViewSchema),
}) satisfies z.ZodType<Wire<ResponseValue<'findings.list'>>>
