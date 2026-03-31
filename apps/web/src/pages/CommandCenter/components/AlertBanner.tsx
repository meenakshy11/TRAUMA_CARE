import { useNotificationStore } from "../../../store/notificationStore"

export function AlertBanner() {
  const notifications = useNotificationStore((s) => s.notifications)
  const unread = notifications.filter((n: any) => !n.is_read && n.severity === "HIGH")
  if (unread.length === 0) return null
  return (
    <div style={{ background: "#7f1d1d", borderBottom: "1px solid #ef4444", padding: "6px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14 }}>⚠️</span>
      <span style={{ fontSize: 12, color: "#fca5a5" }}>{unread[0].message}</span>
      {unread.length > 1 && <span style={{ fontSize: 11, color: "#ef4444", marginLeft: "auto" }}>+{unread.length - 1} more alerts</span>}
    </div>
  )
}
