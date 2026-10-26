// @vitest-environment jsdom
/** AppearanceRow behavior: Light/Dark/System cubes, selection from the stored
 * preference, and a click writing the preference through the injected setTheme. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSnapshotStore, type SessionListState, type WorkspaceListState } from '@pentest-harness/dsh-client-runtime/client'
import { bindSnapshotSelector } from '@pentest-harness/dsh-client-test-runtime'
import { AppearanceRow } from '../src/client/AppearanceRow.tsx'
import type { AppearanceRowComponentProps } from '../src/client/AppearanceRow.tsx'
import { createAppearanceRowStore } from '../src/client/settings-store.ts'
import type { ThemePreference } from '../src/client/index.ts'

afterEach(cleanup)

const COPY: Record<string, string> = {
  'appearance.title': 'Appearance',
  'appearance.light': 'Light',
  'appearance.dark': 'Dark',
  'appearance.system': 'System',
}

/** Empty global standard-kit hooks (the row reads neither). */
function emptySessions() {
  const store = createSnapshotStore<SessionListState>(
    { ids: [], byId: {}, current: undefined, phase: 'ready', subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined })
  return bindSnapshotSelector(store)
}
function emptyWorkspaces() {
  const store = createSnapshotStore<WorkspaceListState>({
    items: [], archivedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    baselinesReady: true, recentWorkspaceId: undefined,
  })
  return bindSnapshotSelector(store)
}

function mount(preference: ThemePreference = 'system') {
  // Real store instance — the sanctioned zero-machinery path for tests.
  const store = createAppearanceRowStore().create()
  store.actions.sync(preference, 0)
  const setTheme = vi.fn()
  const props: AppearanceRowComponentProps = {
    useSessions: emptySessions(),
    useWorkspaces: emptyWorkspaces(),
    useStore: bindSnapshotSelector(store),
    actions: store.actions,
    t: (key: string) => COPY[key] ?? key,
    setTheme,
  }
  render(<AppearanceRow {...props} />)
  return { store, setTheme }
}

describe('AppearanceRow', () => {
  it('renders the title and all three cubes, marking the stored preference selected', () => {
    mount('dark')
    expect(screen.getByText('Appearance')).toBeDefined()
    expect(screen.getByRole('button', { name: /Light/ }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: /Dark/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: /System/ }).getAttribute('aria-pressed')).toBe('false')
  })

  it('writes the clicked preference through setTheme', () => {
    const { setTheme } = mount('dark')
    fireEvent.click(screen.getByRole('button', { name: /Light/ }))
    expect(setTheme).toHaveBeenCalledWith('light')
    fireEvent.click(screen.getByRole('button', { name: /System/ }))
    expect(setTheme).toHaveBeenCalledWith('system')
  })
})
