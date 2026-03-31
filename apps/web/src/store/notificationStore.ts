import { create } from "zustand"

interface NotificationStore {
  notifications: any[]
  unreadCount: number
  add: (n: any) => void
  markRead: (id: string) => void
  setAll: (notifications: any[]) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  add: (n) => set((s) => ({ notifications: [n, ...s.notifications], unreadCount: s.unreadCount + 1 })),
  markRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, s.unreadCount - 1),
  })),
  setAll: (notifications) => set(() => ({
    notifications,
    unreadCount: notifications.filter((n: any) => !n.is_read).length,
  })),
}))
