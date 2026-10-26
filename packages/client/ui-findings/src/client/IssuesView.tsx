/**
 * Issues tab: the findings of the folder this task belongs to, rendered as the
 * triage dashboard — stat cards, filter bar, and one table of findings.
 *
 * The view owns no findings of its own — it asks the host for the folded
 * ledgers through the injected `load` callback (the browser never names a
 * path) and renders what the ledger writer recorded. The scope toggle picks
 * between the whole folder and this task alone; that is the one request
 * parameter, and the host decides which files each scope may read. Filters,
 * selection, grouping and paging are view state; nothing here mutates a
 * finding.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import type { PropsLocale, PropsRuntime } from '@pentest-harness/dsh-client-ui-slots'
import type { FindingsScope, FindingSeverity, FindingStatus, FindingView, SessionId } from '@pentest-harness/dsh-api-remotes/client'
import { NS } from './locales.ts'
import css from './IssuesView.module.css'

/** Which ledgers one read covers: the task's folder, or the task alone. */
export type IssuesScope = 'workspace' | 'session'

/** One read result: the folded findings and the scope the host resolved. */
export interface IssuesRead {
  readonly findings: readonly FindingView[]
  readonly scope: FindingsScope
}

/** Owner-injected face: the session address plus its ledger reader. */
export interface IssuesViewInjected {
  readonly sessionId: SessionId
  readonly load: (scope: IssuesScope, signal: AbortSignal) => Promise<IssuesRead>
}

type IssuesViewProps =
  PropsRuntime<'conversation.view'>
  & PropsLocale<typeof NS>
  & IssuesViewInjected

/**
 * Stable row identity. The finding id is derived from title and target, so the
 * same weakness found in two folders shares an id; the folder keeps the rows
 * distinct for React and for selection.
 * @param finding - row being rendered.
 * @returns the id when the row came from the scope root, else `<folder>/<id>`.
 */
const rowKey = (finding: FindingView): string =>
  finding.folder === '' ? finding.id : `${finding.folder}/${finding.id}`

/** Severity order the table sorts by. */
const SEVERITY_ORDER: readonly FindingSeverity[] = ['critical', 'high', 'medium', 'low', 'info']

/** Status filter choices; `all` is the neutral view. */
const STATUS_FILTERS: readonly (FindingStatus | 'all')[] = ['all', 'new', 'confirmed', 'false_positive', 'duplicate', 'fixed', 'wontfix']

/** Severity filter choices. */
const SEVERITY_FILTERS: readonly (FindingSeverity | 'all')[] = ['all', ...SEVERITY_ORDER]

/** Sort choices: the recorded severity ladder, or newest activity first. */
type SortMode = 'severity' | 'time'

/** Grouping choices: one flat table, or sections per asset. */
type GroupMode = 'all' | 'byAsset'

const PAGE_SIZES = [20, 50, 100] as const

interface LoadState {
  status: 'loading' | 'ready' | 'error'
  findings: readonly FindingView[]
  /** Scope the host resolved; undefined while loading and on error. */
  scope?: FindingsScope
  message?: string
}

/** "3 hours ago" in the active locale, minute granularity. */
function relativeTime(iso: string, t: IssuesViewProps['t']): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 60) return t('issues.justNow')
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return t('issues.minutesAgo', { n: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t('issues.hoursAgo', { n: hours })
  return t('issues.daysAgo', { n: Math.round(hours / 24) })
}

/** Status label key of one finding status. */
function statusKey(status: FindingStatus): 'issues.status.new' | 'issues.status.confirmed' | 'issues.status.false_positive' | 'issues.status.duplicate' | 'issues.status.fixed' | 'issues.status.wontfix' {
  switch (status) {
    case 'new': return 'issues.status.new'
    case 'confirmed': return 'issues.status.confirmed'
    case 'false_positive': return 'issues.status.false_positive'
    case 'duplicate': return 'issues.status.duplicate'
    case 'fixed': return 'issues.status.fixed'
    case 'wontfix': return 'issues.status.wontfix'
  }
}

/** Status glyph: a shape (not color alone) so the column survives grayscale. */
function statusGlyph(status: FindingStatus): string {
  switch (status) {
    case 'new': return '◷'
    case 'confirmed': return '△'
    case 'false_positive': return '⌫'
    case 'duplicate': return '⧉'
    case 'fixed': return '✓'
    case 'wontfix': return '⊘'
  }
}

/** Severity label key of one severity. */
function severityKey(severity: FindingSeverity): 'issues.severity.critical' | 'issues.severity.high' | 'issues.severity.medium' | 'issues.severity.low' | 'issues.severity.info' {
  switch (severity) {
    case 'critical': return 'issues.severity.critical'
    case 'high': return 'issues.severity.high'
    case 'medium': return 'issues.severity.medium'
    case 'low': return 'issues.severity.low'
    case 'info': return 'issues.severity.info'
  }
}

/** CSV cell escaping: quote when the value carries a comma, quote or newline. */
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/** Severity glyph drawn in a stat card; the shape carries the meaning, not the hue alone. */
function SeverityGlyph(
  { severity }: { readonly severity: FindingSeverity | 'total' | 'pending' },
): React.JSX.Element {
  if (severity === 'total') {
    return (
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
        <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 8h6M5 5.5h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }
  if (severity === 'pending') {
    return (
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
        <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 4.6V8l2.6 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
      <path d="M8 1.7l6 11.6H2z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 6.2v3.1M8 11.4v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function IssuesView({ sessionId, load, t }: IssuesViewProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading', findings: [] })
  // A task belongs to a folder, so the folder is the default answer to "what
  // did we find here"; the task scope is the narrowing, not the other way round.
  const [scope, setScope] = useState<IssuesScope>('workspace')
  const [status, setStatus] = useState<FindingStatus | 'all'>('all')
  const [severity, setSeverity] = useState<FindingSeverity | 'all'>('all')
  const [klass, setKlass] = useState<string>('all')
  const [sort, setSort] = useState<SortMode>('severity')
  const [group, setGroup] = useState<GroupMode>('all')
  const [query, setQuery] = useState('')
  const [pageSize, setPageSize] = useState<number>(20)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // The owner re-creates the loader on every binding pass; the effect keys on
  // the session alone and reads the current loader through this ref.
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    const abort = new AbortController()
    setState({ status: 'loading', findings: [] })
    loadRef.current(scope, abort.signal).then(
      (read) => {
        if (abort.signal.aborted) return
        setState({ status: 'ready', findings: read.findings, scope: read.scope })
      },
      (error: unknown) => {
        if (abort.signal.aborted) return
        setState({
          status: 'error',
          findings: [],
          message: error instanceof Error ? error.message : String(error),
        })
      },
    )
    return () => { abort.abort() }
  }, [sessionId, scope])

  const counts = useMemo(() => {
    const map = new Map<FindingSeverity, number>()
    for (const finding of state.findings) map.set(finding.severity, (map.get(finding.severity) ?? 0) + 1)
    return map
  }, [state.findings])

  /** Distinct vulnerability families recorded in the ledger, for the type filter. */
  const classes = useMemo(() => {
    const seen = new Set<string>()
    for (const finding of state.findings) if (finding.class !== null && finding.class !== '') seen.add(finding.class)
    return [...seen].sort()
  }, [state.findings])

  const pendingCount = useMemo(
    () => state.findings.filter(finding => finding.status === 'new').length,
    [state.findings],
  )

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = state.findings.filter((finding) => {
      if (status !== 'all' && finding.status !== status) return false
      if (severity !== 'all' && finding.severity !== severity) return false
      if (klass !== 'all' && finding.class !== klass) return false
      if (needle === '') return true
      return finding.title.toLowerCase().includes(needle)
        || finding.target.toLowerCase().includes(needle)
        || (finding.createdBy ?? '').toLowerCase().includes(needle)
        || (finding.class ?? '').toLowerCase().includes(needle)
    })
    const rank = (value: FindingSeverity): number => SEVERITY_ORDER.indexOf(value)
    return [...filtered].sort((left, right) => {
      if (sort === 'time') return left.lastActivity < right.lastActivity ? 1 : -1
      const bySeverity = rank(left.severity) - rank(right.severity)
      if (bySeverity !== 0) return bySeverity
      return left.lastActivity < right.lastActivity ? 1 : -1
    })
  }, [state.findings, status, severity, klass, query, sort])

  // A filter that shortens the board must not strand the operator on page 4.
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstIndex = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastIndex = Math.min(currentPage * pageSize, rows.length)

  /**
   * Page rows folded into asset sections, preserving the active sort inside a
   * section and ordering sections by the severity of their worst finding.
   */
  const sections = useMemo(() => {
    if (group === 'all') return [{ asset: '', rows: pageRows }]
    const byAsset = new Map<string, FindingView[]>()
    for (const row of pageRows) {
      const key = row.target
      const bucket = byAsset.get(key)
      if (bucket === undefined) byAsset.set(key, [row])
      else bucket.push(row)
    }
    const rank = (value: FindingSeverity): number => SEVERITY_ORDER.indexOf(value)
    return [...byAsset.entries()]
      .map(([asset, bucket]) => ({ asset, rows: bucket }))
      .sort((left, right) => {
        const worst = (bucket: readonly FindingView[]): number =>
          Math.min(...bucket.map(row => rank(row.severity)))
        const delta = worst(left.rows) - worst(right.rows)
        if (delta !== 0) return delta
        return left.asset < right.asset ? -1 : 1
      })
  }, [group, pageRows])

  const allOnPageSelected = pageRows.length > 0 && pageRows.every(row => selected.has(rowKey(row)))
  const toggleRow = (id: string): void => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const togglePage = (): void => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (allOnPageSelected) for (const row of pageRows) next.delete(rowKey(row))
      else for (const row of pageRows) next.add(rowKey(row))
      return next
    })
  }

  /**
   * Copy one finding id to the clipboard; the row reports the copy briefly.
   * @param id - the finding id written to the clipboard.
   * @param key - the row being reported as copied.
   */
  const copyId = (id: string, key: string): void => {
    void navigator.clipboard.writeText(id).then(
      () => { setCopiedId(key) },
      () => { setCopiedId(null) },
    )
  }

  /** Download exactly what is on screen as CSV — the Export control's only behavior. */
  const download = (): void => {
    const header = ['id', 'folder', 'title', 'severity', 'status', 'target', 'class', 'created_by', 'last_activity', 'verified']
    const body = rows.map(finding => [
      finding.id, finding.folder, finding.title, finding.severity, finding.status, finding.target,
      finding.class ?? '', finding.createdBy ?? '', finding.lastActivity, String(finding.verified),
    ].map(csvCell).join(','))
    const blob = new Blob([`${[header.join(','), ...body].join('\n')}\n`], { type: 'text/csv;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'issues.csv'
    anchor.click()
    URL.revokeObjectURL(href)
  }

  /** One table row; shared by both groupings. */
  const renderRow = (finding: FindingView): React.JSX.Element => (
    <tr key={rowKey(finding)} data-selected={selected.has(rowKey(finding)) || undefined}>
      <td className={css.checkCell}>
        <input
          type="checkbox"
          checked={selected.has(rowKey(finding))}
          onChange={() => { toggleRow(rowKey(finding)) }}
          aria-label={finding.title}
        />
      </td>
      <td>
        <span className={css.severity} data-severity={finding.severity}>
          <span className={css.dot} aria-hidden />{t(severityKey(finding.severity))}
        </span>
      </td>
      <td className={css.cellTitle}>
        <span className={css.titleRow}>
          <span className={css.findingTitle} title={finding.title}>{finding.title}</span>
          {finding.status === 'new' && <span className={css.newBadge}>{t('issues.status.new')}</span>}
        </span>
        <span className={css.id}>{finding.id}{finding.class === null ? '' : ` · ${finding.class}`}{finding.verified ? ` · ${t('issues.verified')}` : ''}</span>
      </td>
      <td className={css.mono} title={finding.target}>{finding.target}</td>
      <td>
        <span className={css.status} data-status={finding.status}>
          <span className={css.glyph} aria-hidden>{statusGlyph(finding.status)}</span>
          {t(statusKey(finding.status))}
        </span>
      </td>
      <td className={css.muted}>{finding.createdBy ?? '—'}</td>
      <td className={`${css.muted} ${css.right}`}>{relativeTime(finding.lastActivity, t)}</td>
      <td className={css.right}>
        <button
          type="button"
          className={css.rowAction}
          onClick={() => { copyId(finding.id, rowKey(finding)) }}
          title={copiedId === rowKey(finding) ? t('issues.copied') : t('issues.copyId')}
        >
          {copiedId === rowKey(finding) ? t('issues.copied') : t('issues.copyId')}
        </button>
      </td>
    </tr>
  )

  const cards: readonly { key: 'total' | 'pending' | FindingSeverity; label: string; value: number; tone: string }[] = [
    { key: 'total', label: t('issues.total'), value: state.findings.length, tone: 'total' },
    { key: 'pending', label: t('issues.pending'), value: pendingCount, tone: 'pending' },
    { key: 'critical', label: t('issues.severity.critical'), value: counts.get('critical') ?? 0, tone: 'critical' },
    { key: 'high', label: t('issues.severity.high'), value: counts.get('high') ?? 0, tone: 'high' },
    { key: 'medium', label: t('issues.severity.medium'), value: counts.get('medium') ?? 0, tone: 'medium' },
    { key: 'low', label: t('issues.severity.low'), value: counts.get('low') ?? 0, tone: 'low' },
  ]

  return (
    <div className={css.wrap}>
      <div className={css.pageHead}>
        <div className={css.heading}>
          <h2 className={css.pageTitle}>{t('issues.title')}</h2>
          <p className={css.subtitle}>
            {state.scope === undefined
              ? t('issues.subtitle')
              : t(state.scope.kind === 'workspace' ? 'issues.subtitle.workspace' : 'issues.subtitle.session', { label: state.scope.label })}
          </p>
        </div>
        <div className={css.headerActions}>
          {selected.size > 0 && <span className={css.selected}>{t('issues.selected', { n: selected.size })}</span>}
          <div className={css.tabs} role="tablist" aria-label={t('issues.scope.label')}>
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'workspace'}
              className={css.tab}
              data-active={scope === 'workspace' || undefined}
              onClick={() => { setScope('workspace'); setPage(1) }}
            >
              {t('issues.scope.folder')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'session'}
              className={css.tab}
              data-active={scope === 'session' || undefined}
              onClick={() => { setScope('session'); setPage(1) }}
            >
              {t('issues.scope.task')}
            </button>
          </div>
          <div className={css.tabs} role="tablist" aria-label={t('issues.group.label')}>
            <button
              type="button"
              role="tab"
              aria-selected={group === 'all'}
              className={css.tab}
              data-active={group === 'all' || undefined}
              onClick={() => { setGroup('all'); setPage(1) }}
            >
              {t('issues.tab.all')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={group === 'byAsset'}
              className={css.tab}
              data-active={group === 'byAsset' || undefined}
              onClick={() => { setGroup('byAsset'); setPage(1) }}
            >
              {t('issues.tab.byAsset')}
            </button>
          </div>
          <button type="button" className={css.exportBtn} onClick={download}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
              <path d="M8 2v8m0 0L5 7m3 3l3-3M3 13h10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('issues.download')}
          </button>
        </div>
      </div>

      <div className={css.statRow}>
        {cards.map(card => (
          <div key={card.key} className={css.statCard} data-tone={card.tone}>
            <span className={css.statLabel}>{card.label}</span>
            <span className={css.statValue}>
              <span className={css.statIcon}><SeverityGlyph severity={card.key} /></span>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      <div className={css.toolbar}>
        <div className={css.searchWrap}>
          <svg className={css.searchIcon} viewBox="0 0 16 16" width="13" height="13" aria-hidden>
            <circle cx="7" cy="7" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.2 10.2L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            className={css.search}
            value={query}
            placeholder={t('issues.search')}
            onChange={(event) => { setQuery(event.target.value); setPage(1) }}
          />
        </div>

        <div className={css.pills}>
          {SEVERITY_FILTERS.map(choice => (
            <button
              key={choice}
              type="button"
              className={css.pill}
              data-active={severity === choice || undefined}
              aria-pressed={severity === choice}
              onClick={() => { setSeverity(choice); setPage(1) }}
            >
              {choice === 'all' ? t('issues.filter.all') : t(severityKey(choice))}
            </button>
          ))}
        </div>

        <select className={css.select} value={status} onChange={(event) => { setStatus(event.target.value as FindingStatus | 'all'); setPage(1) }} aria-label={t('issues.status')}>
          <option value="all">{t('issues.status')}</option>
          {STATUS_FILTERS.filter(choice => choice !== 'all').map(choice => (
            <option key={choice} value={choice}>{t(statusKey(choice))}</option>
          ))}
        </select>

        <select className={css.select} value={klass} onChange={(event) => { setKlass(event.target.value); setPage(1) }} aria-label={t('issues.type')}>
          <option value="all">{t('issues.type')}</option>
          {classes.map(name => <option key={name} value={name}>{name}</option>)}
        </select>

        <select className={css.select} value={sort} onChange={(event) => { setSort(event.target.value as SortMode) }} aria-label={t('issues.sort')}>
          <option value="severity">{t('issues.sort.severity')}</option>
          <option value="time">{t('issues.sort.time')}</option>
        </select>
      </div>

      {state.status === 'loading' && <div className={css.note}>{t('issues.loading')}</div>}
      {state.status === 'error' && (
        <div className={css.error}>{t('issues.error', { message: state.message ?? '' })}</div>
      )}
      {state.status === 'ready' && state.findings.length === 0 && <div className={css.note}>{t('issues.empty')}</div>}

      {state.status === 'ready' && state.findings.length > 0 && (
        <>
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th className={css.checkCell}>
                    <input type="checkbox" checked={allOnPageSelected} onChange={togglePage} aria-label={t('issues.selectAll')} />
                  </th>
                  <th>{t('issues.severity')}</th>
                  <th>{t('issues.vulnName')}</th>
                  <th>{t('issues.assets')}</th>
                  <th>{t('issues.status')}</th>
                  <th>{t('issues.createdBy')}</th>
                  <th className={css.right}>{t('issues.lastActivity')}</th>
                  <th className={css.right}>{t('issues.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(section => (
                  group === 'all'
                    ? section.rows.map(renderRow)
                    : [
                      <tr key={`asset-${section.asset}`} className={css.groupRow}>
                        <td colSpan={8}>
                          <span className={css.groupName}>{section.asset}</span>
                          <span className={css.groupCount}>{section.rows.length}</span>
                        </td>
                      </tr>,
                      ...section.rows.map(renderRow),
                    ]
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className={css.note}>{t('issues.noMatch')}</div>}
          </div>

          <div className={css.footer}>
            <div className={css.footerLeft}>
              <span className={css.muted}>{t('issues.perPage')}</span>
              <select
                className={css.selectSmall}
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}
              >
                {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
              </select>
              <span className={css.muted}>{t('issues.range', { from: firstIndex, to: lastIndex, total: rows.length })}</span>
            </div>
            <div className={css.pager}>
              <button type="button" className={css.pageBtn} disabled={currentPage <= 1} onClick={() => { setPage(currentPage - 1) }}>
                {t('issues.previous')}
              </button>
              <span className={css.pageNow}>{currentPage}</span>
              <button type="button" className={css.pageBtn} disabled={currentPage >= pageCount} onClick={() => { setPage(currentPage + 1) }}>
                {t('issues.next')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
