/** `reference` namespace dictionaries for the unified `@` source. */

import type {} from '@pentest-harness/dsh-client-ui-slots'

/** Dictionary namespace owned by this plugin. */
export const NS = 'reference'

/** The reference namespace key union. */
export type ReferenceKey = keyof typeof en

declare module '@pentest-harness/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The unified `@` reference menu's copy. */
    reference: ReferenceKey
  }
}

/** English dictionary — the key set's source of truth. */
export const en = {
  'section.files': 'Files & folders',
  'section.sessions': 'Session conversations',
  'candidate.file': 'File',
  'candidate.folder': 'Folder',
  'candidate.session': 'Session',
  'candidate.noCwd': '(no cwd)',
} satisfies Record<string, string>
