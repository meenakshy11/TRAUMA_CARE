import { useEffect } from "react"
import { incidentsApi } from "../api/index"
import { useIncidentStore } from "../store/incidentStore"

/**
 * Fetches active incidents immediately and polls every `intervalMs` milliseconds.
 * WebSocket updates (addIncident / updateStatus) layer on top of this baseline.
 */
export function useLiveIncidents(intervalMs = 30_000) {
  const setIncidents = useIncidentStore((s) => s.setIncidents)

  useEffect(() => {
    let cancelled = false

    const fetch = () =>
      incidentsApi
        .getActive()
        .then((r) => {
          if (!cancelled && Array.isArray(r.data)) setIncidents(r.data)
        })
        .catch(() => {
          /* silently retry on next cycle */
        })

    fetch()
    const id = setInterval(fetch, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs]) // eslint-disable-line react-hooks/exhaustive-deps
}
