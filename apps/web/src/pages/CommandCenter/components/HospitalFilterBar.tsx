/**
 * HospitalFilterBar.tsx
 * Place at: apps/web/src/pages/CommandCenter/components/HospitalFilterBar.tsx
 *
 * Usage in CommandCenterPage.tsx (or wherever MapLayerControl lives):
 *   import { HospitalFilterBar } from "./components/HospitalFilterBar"
 *   <HospitalFilterBar />
 */
import { useHospitalStore, useFilteredHospitals, useAvailableDistricts } from "../../../store/hospitalStore"

const TRAUMA_LEVELS = ["LEVEL_1", "LEVEL_2", "LEVEL_3"] as const

export function HospitalFilterBar() {
  const filters    = useHospitalStore((s) => s.filters)
  const setFilter  = useHospitalStore((s) => s.setFilter)
  const resetFilters = useHospitalStore((s) => s.resetFilters)

  // These hooks subscribe to the right slices — no stale-closure issues
  const districts     = useAvailableDistricts()
  const filteredCount = useFilteredHospitals().length
  const hasActiveFilters =
    filters.district !== null ||
    filters.is_government !== null ||
    filters.blood_bank !== null ||
    filters.trauma_level !== null

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center",
      padding: "8px 12px",
      background: "var(--color-bg-secondary)",
      borderBottom: "1px solid var(--color-border)",
      fontSize: "12px",
    }}>
      {/* ── District ── */}
      <select
        value={filters.district ?? ""}
        onChange={(e) => setFilter("district", e.target.value || null)}
        style={selectStyle}
      >
        <option value="">All Districts</option>
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* ── Trauma Level ── */}
      <select
        value={filters.trauma_level ?? ""}
        onChange={(e) => setFilter("trauma_level", e.target.value || null)}
        style={selectStyle}
      >
        <option value="">All Levels</option>
        {TRAUMA_LEVELS.map((l) => (
          <option key={l} value={l}>{l.replace("_", " ")}</option>
        ))}
      </select>

      {/* ── Govt / Private ── */}
      <select
        value={filters.is_government === null ? "" : String(filters.is_government)}
        onChange={(e) => {
          const v = e.target.value
          setFilter("is_government", v === "" ? null : v === "true")
        }}
        style={selectStyle}
      >
        <option value="">Govt + Private</option>
        <option value="true">Government only</option>
        <option value="false">Private only</option>
      </select>

      {/* ── Blood Bank ── */}
      <select
        value={filters.blood_bank === null ? "" : String(filters.blood_bank)}
        onChange={(e) => {
          const v = e.target.value
          setFilter("blood_bank", v === "" ? null : v === "true")
        }}
        style={selectStyle}
      >
        <option value="">Blood Bank: Any</option>
        <option value="true">🩸 Has Blood Bank</option>
        <option value="false">No Blood Bank</option>
      </select>

      {/* ── Active count + reset ── */}
      <span style={{ color: "var(--color-text-muted)", marginLeft: "auto" }}>
        {filteredCount} hospital{filteredCount !== 1 ? "s" : ""}
      </span>

      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          style={{
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            padding: "3px 8px",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          ✕ Reset
        </button>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: "var(--color-bg-primary)",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  color: "var(--color-text-primary)",
  padding: "4px 8px",
  fontSize: "12px",
  cursor: "pointer",
  outline: "none",
}