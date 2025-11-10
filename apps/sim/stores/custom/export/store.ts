// /stores/custom/export/store.ts
import { create } from 'zustand'

type CustomExportState = {
    data: Record<string, any>
    setData: (data: Record<string, any>) => void
    reset: () => void
}

export const useCustomExportStore = create<CustomExportState>((set) => ({
    data: {},
    setData: (data) => set({ data }),
    reset: () => set({ data: {} }),
}))
