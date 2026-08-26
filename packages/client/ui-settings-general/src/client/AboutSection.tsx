/** The About section: Pentest Harness identity, capabilities, and credit. */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './AboutSection.module.css'

/** Full component props: section owner share. */
export type AboutSectionComponentProps = PropsRuntime<'settings.section'>

/** The creator's public portfolio. */
const PORTFOLIO_URL = 'https://portfolio.hackwithsingh.com/'

/** The creator's avatar served from the app public root. */
const CREATOR_IMAGE = '/brand/creator.jpg'

/** Core platform capabilities this harness ships with. */
const CORE_FEATURES = [
  {
    icon: '⚡',
    title: 'Multi-provider LLM engine',
    body: 'OpenAI-compatible Chat Completions & Responses, Anthropic Messages, direct DeepSeek — plus any custom gateway with one-click model auto-discovery.',
  },
  {
    icon: '🛠',
    title: 'Full agent toolset',
    body: 'Shell, filesystem, web research, skills, goals, subagents, background jobs, and workflow control — every schema exposed to the model natively.',
  },
  {
    icon: '💾',
    title: 'Durable sessions',
    body: 'JSONL/SQLite persistence with replay, checkpointing, and request headers. Close the app, resume exactly where you left off.',
  },
  {
    icon: '🧠',
    title: 'Context that never dies',
    body: 'Token metering, automatic compaction, and tool-result pruning keep long engagements inside the model window without losing the thread.',
  },
  {
    icon: '🔒',
    title: 'Sandbox + approval control',
    body: 'Per-session permission modes from full access to sandboxed, with an approval pipeline you control.',
  },
  {
    icon: '🧩',
    title: 'Everything is a plugin',
    body: 'Built on Cordis — model adapters, tools, sessions, settings, credentials all replaceable from configuration. No closed core to fight.',
  },
  {
    icon: '🛡',
    title: 'Secure by default',
    body: 'API keys live in an owner-only credential store as references — never in settings, never in logs, never returned by the API.',
  },
  {
    icon: '🚀',
    title: 'Headless + Web profiles',
    body: 'Run the same agent as a web workspace or a one-shot headless runner from declarative profiles and patches.',
  },
]

/** Pentest-specific capabilities layered on top of the platform. */
const PENTEST_FEATURES = [
  'Pentest Mode preset — a professional offensive-security operating standard',
  'Provider cards with live connection testing and status indicators',
  'Custom endpoints with protocol labels and automatic model listing',
  '200K context default for new providers with per-model overrides',
  'Evidence-based reporting: verify findings, never fabricate impact',
]

/** Numeric highlights shown as a stat strip under the hero. */
const STATS = [
  { value: '200K', label: 'Context default' },
  { value: '100%', label: 'Plugin architecture' },
  { value: '24/7', label: 'Recon ready' },
  { value: '0', label: 'Fabricated findings' },
]

/**
 * Render the About section content column.
 * @returns the section element tree.
 */
export function AboutSection(_props: AboutSectionComponentProps) {
  return (
    <div className={css.section}>
      <div className={css.hero}>
        <img className={css.avatar} src={CREATOR_IMAGE} alt="HackWithSingh" />
        <span className={css.badge}>⚡ Pentest Harness</span>
        <h2 className={css.tagline}>Heaven for Hackers</h2>
        <p className={css.intro}>
          A professional security testing workspace built on a serious agent platform —
          for authorized penetration tests, bug bounty research, security labs, and CTFs.
        </p>
        <div className={css.stats}>
          {STATS.map(stat => (
            <div key={stat.label} className={css.stat}>
              <span className={css.statValue}>{stat.value}</span>
              <span className={css.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={css.block}>
        <h3 className={css.heading}>Capabilities</h3>
        <div className={css.grid}>
          {CORE_FEATURES.map(feature => (
            <div key={feature.title} className={css.gridItem}>
              <span className={css.gridIcon} aria-hidden>{feature.icon}</span>
              <span className={css.gridTitle}>{feature.title}</span>
              <span className={css.gridBody}>{feature.body}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={css.block}>
        <h3 className={css.heading}>Built for security work</h3>
        <ul className={css.features}>
          {PENTEST_FEATURES.map(feature => <li key={feature}>{feature}</li>)}
        </ul>
      </div>
      <div className={css.block}>
        <h3 className={css.heading}>Created by</h3>
        <p className={css.credit}>HackWithSingh | Harinder Singh</p>
        <a className={css.link} href={PORTFOLIO_URL} target="_blank" rel="noreferrer">
          {PORTFOLIO_URL}
        </a>
      </div>
    </div>
  )
}
