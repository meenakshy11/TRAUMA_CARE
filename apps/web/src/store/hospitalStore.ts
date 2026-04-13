import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useShallow } from "zustand/react/shallow"

// ── Filter shape ─────────────────────────────────────────────────────────────
export interface HospitalFilters {
  district:      string | null   // null = all
  is_government: boolean | null  // null = both
  blood_bank:    boolean | null  // null = both
  trauma_level:  string | null   // null = all  e.g. "LEVEL_1"
}

export const DEFAULT_FILTERS: HospitalFilters = {
  district:      null,
  is_government: null,
  blood_bank:    null,
  trauma_level:  null,
}

// ── Pure filter utility (importable anywhere, no store dependency) ────────────
export function applyHospitalFilters(
  hospitals: Record<string, any>,
  filters: HospitalFilters,
): any[] {
  return Object.values(hospitals).filter((h: any) => {
    if (
      filters.district &&
      h.district?.toLowerCase() !== filters.district.toLowerCase()
    ) return false

    if (
      filters.is_government !== null &&
      h.is_government !== filters.is_government
    ) return false

    if (filters.blood_bank !== null) {
      const hasBB = h.resources?.blood_bank_available ?? false
      if (hasBB !== filters.blood_bank) return false
    }

    if (
      filters.trauma_level &&
      h.trauma_level !== filters.trauma_level
    ) return false

    return true
  })
}

// ── Store ────────────────────────────────────────────────────────────────────
interface HospitalStore {
  hospitals: Record<string, any>
  filters:   HospitalFilters

  setHospitals:    (hospitals: any[]) => void
  updateResources: (id: string, resources: any) => void
  setFilter:       <K extends keyof HospitalFilters>(key: K, value: HospitalFilters[K]) => void
  resetFilters:    () => void
}

export const useHospitalStore = create<HospitalStore>()(
  persist(
    (set) => ({
      hospitals: {},
      filters:   { ...DEFAULT_FILTERS },

      setHospitals: (hospitals) =>
        set({ hospitals: Object.fromEntries(hospitals.map((h: any) => [h.id, h])) }),

      updateResources: (id, resources) =>
        set((s) => ({
          hospitals: {
            ...s.hospitals,
            [id]: s.hospitals[id]
              ? { ...s.hospitals[id], resources: { ...s.hospitals[id].resources, ...resources } }
              : { id, resources },
          },
        })),

      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),

      resetFilters: () =>
        set({ filters: { ...DEFAULT_FILTERS } }),
    }),
    {
      name: "hospital-storage",
      partialize: (state) => ({ hospitals: state.hospitals }),
    }
  )
)

// ── Reactive selector hooks (use these in components) ────────────────────────
// These subscribe to BOTH hospitals and filters so they re-render correctly.

/** Returns the filtered hospital list — reactive to both data and filter changes. */
export function useFilteredHospitals(): any[] {
  return useHospitalStore(useShallow((s) => applyHospitalFilters(s.hospitals, s.filters)))
}

/** Returns sorted unique district list — reactive to hospital data changes. */
export function useAvailableDistricts(): string[] {
  return useHospitalStore(useShallow((s) => {
    const districts = new Set<string>()
    Object.values(s.hospitals).forEach((h: any) => {
      if (h.district) districts.add(h.district)
    })
    return Array.from(districts).sort()
  }))
}

/**
 * Merges any localStorage-persisted resource overrides into a hospitals array.
 * Call this after fetching hospitals from the API to apply any staff updates.
 */
export function mergePersistedResources(hospitals: any[]): any[] {
  try {
    const raw = localStorage.getItem("hospital-storage")
    if (!raw) return hospitals
    const stored = JSON.parse(raw)
    const overrides: Record<string, any> = stored?.state?.hospitals ?? {}
    if (Object.keys(overrides).length === 0) return hospitals
    return hospitals.map((h) =>
      overrides[h.id]?.resources
        ? { ...h, resources: { ...h.resources, ...overrides[h.id].resources } }
        : h
    )
  } catch {
    return hospitals
  }
}