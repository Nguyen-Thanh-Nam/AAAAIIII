/** UI strings for the findings (issues) view. */
export const NS = 'ui-findings'

/** Locale keys typed for the issues view. */
export type IssuesKey =
  | 'view.issues'
  | 'issues.title'
  | 'issues.count'
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

export const zh: Record<IssuesKey, string> = {
  'view.issues': '问题',
  'issues.title': '问题',
  'issues.count': '{n} 个问题',
  'issues.loading': '正在读取问题清单…',
  'issues.empty': '本次会话还没有记录问题。运行一次检查后，问题会出现在这里。',
  'issues.error': '读取问题清单失败：{message}',
  'issues.search': '搜索标题、目标…',
  'issues.filter.all': '全部',
  'issues.severity': '严重程度',
  'issues.status': '状态',
  'issues.target': '目标',
  'issues.createdBy': '创建者',
  'issues.lastActivity': '最近活动',
  'issues.verified': '已复现',
  'issues.status.new': '新建',
  'issues.status.confirmed': '已确认',
  'issues.status.false_positive': '误报',
  'issues.status.duplicate': '重复',
  'issues.status.fixed': '已修复',
  'issues.status.wontfix': '不修复',
  'issues.severity.critical': '严重',
  'issues.severity.high': '高',
  'issues.severity.medium': '中',
  'issues.severity.low': '低',
  'issues.severity.info': '信息',
  'issues.justNow': '刚刚',
  'issues.minutesAgo': '{n} 分钟前',
  'issues.hoursAgo': '{n} 小时前',
  'issues.daysAgo': '{n} 天前',
  'issues.download': '导出为 CSV',
  'issues.selected': '已选 {n} 项',
  'issues.selectAll': '选择本页全部',
  'issues.perPage': '每页',
  'issues.range': '{from}–{to}，共 {total} 项',
  'issues.previous': '上一页',
  'issues.next': '下一页',
  'issues.noMatch': '没有符合筛选条件的问题。',
  'issues.subtitle': '跨任务汇总的漏洞',
  'issues.total': '问题总数',
  'issues.pending': '待处理',
  'issues.assets': '资产',
  'issues.type': '全部类型',
  'issues.sort': '排序',
  'issues.sort.severity': '按严重程度',
  'issues.sort.time': '最新优先',
  'issues.actions': '操作',
  'issues.copyId': '复制编号',
  'issues.copied': '已复制',
  'issues.tab.all': '全部',
  'issues.tab.byAsset': '按资产',
  'issues.vulnName': '漏洞名称',
}

export const en: Record<IssuesKey, string> = {
  'view.issues': 'Issues',
  'issues.title': 'Findings',
  'issues.count': '{n} issues',
  'issues.loading': 'Loading findings…',
  'issues.empty': 'No findings recorded for this session yet. Run a check and they appear here.',
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
