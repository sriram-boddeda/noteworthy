import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // The media query is the external store: subscribe to it and read
  // mql.matches as the snapshot. useSyncExternalStore re-subscribes only when
  // the subscribe function changes and re-reads the snapshot outside render,
  // so there is no setState-in-effect cascade and no drift between the
  // initial value and the change events.
  return React.useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      mql.addEventListener("change", onStoreChange)
      return () => mql.removeEventListener("change", onStoreChange)
    },
    () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches,
    () => false,
  )
}
