import { useNotificationStore } from "../../../store/notificationStore"

/**
 * AlertBanner — shows the most recent unread HIGH-severity notification
 * received from the backend via WebSocket or the /notifications REST API.
 * Falls back to nothing if there are no active alerts.
 */
export function AlertBanner() {
  const notifications = useNotificationStore((s) => s.notifications)
  const markRead      = useNotificationStore((s) => s.markRead)

  // Pick the first unread HIGH severity alert
  const alert = notifications.find(
    (n) => !n.is_read && (n.severity === "HIGH" || n.severity === "CRITICAL")
  )

  if (!alert) return null

  const isCritical = alert.severity === "CRITICAL"
  const accentColor = isCritical ? "var(--color-danger)" : "var(--color-warning)"
  const bgColor     = isCritical ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.10)"
  const borderColor = isCritical ? "rgba(239, 68, 68, 0.35)" : "rgba(245, 158, 11, 0.30)"

  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      background: bgColor,
      borderBottom: `1px solid ${borderColor}`,
      borderLeft: `4px solid ${accentColor}`,
      animation: "pulse-ring 2s ease-in-out infinite",
      color: "var(--color-text-primary)",
      position: "relative",
      zIndex: 100,
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "22px", height: "22px", borderRadius: "50%",
          background: accentColor, color: "#fff", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: "bold", flexShrink: 0,
        }}>!</div>
        <div>
          <span style={{ fontWeight: 700, color: accentColor, marginRight: "8px", fontSize: "12px" }}>
            {isCritical ? "CRITICAL ALERT:" : "HIGH ALERT:"}
          </span>
          <span style={{ fontSize: "12px" }}>{alert.message}</span>
        </div>
      </div>
      <button
        onClick={() => markRead(alert.id)}
        style={{
          color: "var(--color-text-secondary)", background: "transparent",
          border: "none", cursor: "pointer", padding: "4px",
          display: "flex", alignItems: "center", flexShrink: 0,
        }}
        title="Dismiss Alert"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </button>
    </div>
  )
}
