/** UI strings for the findings (issues) view. */
export const NS = 'ui-findings'

/** Locale keys typed for the issues view. */
export type IssuesKey =
  | 'view.issues'
  | 'issues.title'
  | 'issues.count'
  | 'issues.scope.label'
  | 'issues.scope.folder'
  | 'issues.scope.task'
  | 'issues.group.label'
  | 'issues.subtitle.session'
  | 'issues.loading'
  | 'issues.empty'
  | 'issues.error'
  | 'issues.search'
  | 'issues.filter.all'
  | 'issues.severity'
  | 'issues.status'
  | 'issues.target'
  | 'issues.createdBy'
  | 'issues.lastActivity'
  | 'issues.verified'
  | 'issues.status.new'
  | 'issues.status.confirmed'
  | 'issues.status.false_positive'
  | 'issues.status.duplicate'
  | 'issues.status.fixed'
  | 'issues.status.wontfix'
  | 'issues.severity.critical'
  | 'issues.severity.high'
  | 'issues.severity.medium'
  | 'issues.severity.low'
  | 'issues.severity.info'
  | 'issues.justNow'
  | 'issues.minutesAgo'
  | 'issues.hoursAgo'
  | 'issues.daysAgo'
  | 'issues.download'
  | 'issues.selected'
  | 'issues.selectAll'
  | 'issues.perPage'
  | 'issues.range'
  | 'issues.previous'
  | 'issues.next'
  | 'issues.noMatch'
  | 'issues.subtitle'
  | 'issues.total'
  | 'issues.pending'
  | 'issues.assets'
  | 'issues.type'
  | 'issues.sort'
  | 'issues.sort.severity'
  | 'issues.sort.time'
  | 'issues.actions'
  | 'issues.copyId'
  | 'issues.copied'
  | 'issues.tab.all'
  | 'issues.tab.byAsset'
  | 'issues.vulnName'

declare module '@pentest-harness/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The findings tab strings. */
    'ui-findings': IssuesKey
  }
}

export const en = {
  'view.issues': 'Issues',
  'issues.title': 'Issues',
  'issues.count': '{n} issues',
  'issues.scope.label': 'Scope',
  'issues.scope.folder': 'Folder',
  'issues.scope.task': 'Task',
  'issues.group.label': 'Group',
  'issues.subtitle.session': 'Vulnerabilities in this task',
  'issues.loading': 'Loading findings…',
  'issues.empty': 'No findings recorded here yet. Run a check and they appear here.',
  'issues.error': 'Could not read the findings ledger: {message}',
  'issues.search': 'Search title, target…',
  'issues.filter.all': 'All issues',
  'issues.severity': 'Severity',
  'issues.status': 'Status',
  'issues.target': 'Target',
  'issues.createdBy': 'Created by',
  'issues.lastActivity': 'Last activity',
  'issues.verified': 'verified',
  'issues.status.new': 'New',
  'issues.status.confirmed': 'Confirmed',
  'issues.status.false_positive': 'False positive',
  'issues.status.duplicate': 'Duplicate',
  'issues.status.fixed': 'Fixed',
  'issues.status.wontfix': "Won't fix",
  'issues.severity.critical': 'Critical',
  'issues.severity.high': 'High',
  'issues.severity.medium': 'Medium',
  'issues.severity.low': 'Low',
  'issues.severity.info': 'Info',
  'issues.justNow': 'just now',
  'issues.minutesAgo': '{n} minutes ago',
  'issues.hoursAgo': '{n} hours ago',
  'issues.daysAgo': '{n} days ago',
  'issues.download': 'Export CSV',
  'issues.selected': '{n} selected',
  'issues.selectAll': 'Select all on this page',
  'issues.perPage': 'Items per page',
  'issues.range': '{from}–{to} of {total} items',
  'issues.previous': 'Previous',
  'issues.next': 'Next',
  'issues.noMatch': 'No issues match the current filters.',
  'issues.subtitle': 'Vulnerabilities across tasks',
  'issues.total': 'Total findings',
  'issues.pending': 'Pending',
  'issues.assets': 'Assets',
  'issues.type': 'All types',
  'issues.sort': 'Sort',
  'issues.sort.severity': 'By severity',
  'issues.sort.time': 'Newest first',
  'issues.actions': 'Actions',
  'issues.copyId': 'Copy id',
  'issues.copied': 'Copied',
  'issues.tab.all': 'All findings',
  'issues.tab.byAsset': 'By asset',
  'issues.vulnName': 'Vulnerability name',
}
