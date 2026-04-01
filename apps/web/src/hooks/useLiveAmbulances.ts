import { useEffect } from "react"
import { ambulancesApi } from "../api/index"
import { useAmbulanceStore } from "../store/ambulanceStore"

/**
 * Fetches all ambulances immediately and polls every `intervalMs` milliseconds.
 * This seeds positions (lat/lon/status) from REST data so the map and panel
 * are populated before the WebSocket delivers its first location update.
 */
export function useLiveAmbulances(intervalMs = 60_000) {
  const setAmbulances = useAmbulanceStore((s) => s.setAmbulances)

  useEffect(() => {
    let cancelled = false

    const fetch = () =>
      ambulancesApi
        .getAll()
        .then((r) => {
          if (!cancelled && Array.isArray(r.data)) setAmbulances(r.data)
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
