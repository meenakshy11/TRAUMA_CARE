import { useState } from "react"
import { useNotificationStore } from "../../store/notificationStore"

export function TopBar() {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const [open, setOpen] = useState(false)

  return (
    <div style={{ height: 52, background: "#060d1a", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, background: "#10b98120", color: "#10b981", padding: "3px 8px", borderRadius: 10 }}>● SYSTEM ACTIVE</span>
        <span style={{ fontSize: 11, color: "#475569" }}>{new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
          <span style={{ fontSize: 18 }}>🔔</span>
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 9, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {unreadCount}
            </span>
          )}
        </div>
        {open && (
          <div style={{ position: "absolute", top: 52, right: 20, width: 340, background: "#111827", border: "1px solid #1f2937", borderRadius: 8, zIndex: 1000, maxHeight: 300, overflowY: "auto" }}>
            {notifications.slice(0, 10).map((n: any) => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{ padding: "10px 14px", borderBottom: "1px solid #1f2937", background: n.is_read ? "transparent" : "#1e293b", cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: n.severity === "HIGH" ? "#ef4444" : "#f59e0b" }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{new Date(n.created_at).toLocaleTimeString()}</div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: "#64748b", fontSize: 13 }}>No notifications</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
