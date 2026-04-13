import { create } from "zustand"

const KERALA_DISTRICTS = [
  "All Districts",
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
]

interface DistrictStore {
  selectedDistrict: string | null
  districts: string[]
  setDistrict: (d: string | null) => void
}

export const useDistrictStore = create<DistrictStore>((set) => ({
  selectedDistrict: null,
  districts: KERALA_DISTRICTS,
  setDistrict: (d) => set({ selectedDistrict: d === "All Districts" ? null : d }),
}))
