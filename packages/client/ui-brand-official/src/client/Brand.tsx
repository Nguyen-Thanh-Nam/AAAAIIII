import type { HeroBrandMarkOwnerProps } from '@pentest-harness/dsh-client-ui-conversation/client'
import type { SidebarBrandMarkOwnerProps } from '@pentest-harness/dsh-client-ui-sidebar/client'

type OfficialBrandMarkProps = HeroBrandMarkOwnerProps & SidebarBrandMarkOwnerProps

/**
 * Occupy the official mark slot without drawing artwork.
 * The slots stay occupied so hosts keep their layout and never fall back to the
 * generic whale; both brand surfaces render no logo.
 * @param _props - Host-supplied mark presentation, accepted for slot conformance.
 * @returns nothing.
 */
export function OfficialBrandMark(_props: OfficialBrandMarkProps) {
  return null
}

/**
 * Occupy the official name slot without drawing artwork.
 * No wordmark image is shipped, so the sidebar brand row stays empty instead of
 * showing the placeholder artwork or the text fallback.
 * @returns nothing.
 */
export function OfficialBrandName() {
  return null
}
