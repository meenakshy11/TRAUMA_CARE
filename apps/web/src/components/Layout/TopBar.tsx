import { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { useNotificationStore } from "../../store/notificationStore"
import { useAuthStore } from "../../store/authStore"
import { useDistrictStore } from "../../store/districtStore"
import styles from "./TopBar.module.css"

const PAGE_TITLES: Record<string, string> = {
  "/command-center":    "Command Center",
  "/incidents":         "Incident Registry",
  "/hospitals":         "Hospitals",
  "/hospital-dashboard": "Hospital Dashboard",
  "/analytics":         "Analytics",
  "/blackspots":        "Black Spot Management",
  "/simulation":        "Simulation & Coverage",
  "/admin":             "Administration",
}

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (/^\/incidents\/[^/]+$/.test(pathname)) return "Incident Detail"
  if (/^\/hospitals\/[^/]+$/.test(pathname))  return "Hospital Detail"
  return "Dashboard"
}

function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })
  )
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }))
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

const BellIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
  </svg>
)

const MenuIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
  </svg>
)

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const user = useAuthStore((s) => s.user)
  const { selectedDistrict, districts, setDistrict } = useDistrictStore()
  const [open, setOpen] = useState(false)
  const [wsStatus] = useState<"live" | "reconnecting">("live")
  const time = useClock()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isGovt = user?.role === "GOVERNMENT"
  const pageTitle = resolveTitle(location.pathname)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className={styles.topBar}>
      <div className={styles.leftSection}>
        <button className={styles.hamburger} onClick={onMenuClick} title="Toggle menu">
          <MenuIcon />
        </button>
        <span className={styles.pageTitle}>{pageTitle}</span>
        {isGovt && (
          <select
            value={selectedDistrict || "All Districts"}
            onChange={(e) => setDistrict(e.target.value)}
            style={{
              marginLeft: 16,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid var(--color-border-strong)",
              background: "var(--color-bg-secondary)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {districts.map((d: string) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
      </div>
      <div className={styles.rightSection}>
        <div className={`${styles.wsPill} ${wsStatus === "live" ? styles.wsPillLive : styles.wsPillReconnecting}`}>
          <span className={`${styles.wsDot} ${wsStatus === "live" ? styles.wsDotLive : ""}`} />
          {wsStatus === "live" ? "LIVE" : "RECONNECTING..."}
        </div>
        <div className={styles.clock}>{time} IST</div>
        <div className={styles.notifWrapper} ref={dropdownRef}>
          <button className={styles.notifBtn} onClick={() => setOpen(o => !o)} title="Notifications" id="topbar-notifications">
            <BellIcon />
            {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {open && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>Notifications {unreadCount > 0 && ` ${unreadCount} unread`}</div>
              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div className={styles.notifEmpty}>No notifications</div>
                ) : (
                  notifications.slice(0, 12).map((n: any) => (
                    <div key={n.id} className={`${styles.notifItem} ${!n.is_read ? styles.unread : ""}`} onClick={() => { markRead(n.id) }}>
                      <div className={`${styles.notifMsg} ${n.severity === "HIGH" ? styles.high : n.severity === "MEDIUM" ? styles.medium : ""}`}>{n.message}</div>
                      <div className={styles.notifTime}>{new Date(n.created_at).toLocaleTimeString("en-IN", { hour12: false })}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
