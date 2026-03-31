import { useState } from "react"
import { useNotificationStore } from "../../store/notificationStore"

export function TopBar() {
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const [open, setOpen] = useState(false)

  return (
    <div style={{ height: 52, background: "#1a3a6b", borderBottom: "1px solid #2d5086", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, background: "rgba(16,185,129,0.2)", color: "#6ee7b7", padding: "3px 8px", borderRadius: 10 }}>● SYSTEM ACTIVE</span>
        <span style={{ fontSize: 11, color: "#93c5fd" }}>{new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
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
          <div style={{ position: "absolute", top: 52, right: 20, width: 360, background: "#ffffff", border: "1px solid #c8d8f0", borderRadius: 8, zIndex: 1000, maxHeight: 320, overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8", fontSize: 12, fontWeight: 600, color: "#1a3a6b" }}>Notifications</div>
            {notifications.slice(0, 10).map((n: any) => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{ padding: "10px 14px", borderBottom: "1px solid #e8eef8", background: n.is_read ? "#ffffff" : "#f0f4ff", cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: n.severity === "HIGH" ? "#ef4444" : "#f59e0b" }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "#6b87b0", marginTop: 2 }}>{new Date(n.created_at).toLocaleTimeString()}</div>
              </div>
            ))}
            {notifications.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "#6b87b0", fontSize: 13 }}>No notifications</div>}
          </div>
        )}
      </div>
    </div>
  )
}
