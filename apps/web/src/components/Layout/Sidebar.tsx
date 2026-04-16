import { NavLink } from "react-router-dom"
import { useState } from "react"
import { useAuthStore } from "../../store/authStore"
import { canAccess, ROLE_LABELS, type Role } from "../../config/rbac"
import { useTheme } from "../../hooks/useTheme"
import styles from "./Sidebar.module.css"

const ALL_LINKS = [
  { group: "OPERATIONS", to: "/command-center", label: "Command Center", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
    </svg>
  )},
  { group: "OPERATIONS", to: "/incidents", label: "Incidents", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
  )},
  { group: "RESOURCES", to: "/hospitals", label: "Hospitals", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
    </svg>
  )},
  { group: "RESOURCES", to: "/hospital-staff", label: "My Hospital Portal", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
    </svg>
  )},
  { group: "RESOURCES", to: "/hospital-dashboard", label: "Hospital Dashboard", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>
  )},
  { group: "RESOURCES", to: "/blackspots", label: "Black Spots", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
    </svg>
  )},
  { group: "RESOURCES", to: "/ambulance-bases", label: "Base Stations", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a1 1 0 001-1v-1h2.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-4a1 1 0 00-.293-.707l-3-3A1 1 0 0016 5h-3V4a1 1 0 00-1-1H3zm11 5h-2V6h1.586L15 8.586V9z"/>
    </svg>
  )},
  { group: "INTELLIGENCE", to: "/analytics", label: "Analytics", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
    </svg>
  )},
  { group: "INTELLIGENCE", to: "/simulation", label: "Simulation", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/>
    </svg>
  )},
  { group: "SYSTEM", to: "/admin", label: "Administration", icon: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
    </svg>
  )},
]

const GROUPS = ["OPERATIONS", "RESOURCES", "INTELLIGENCE", "SYSTEM"]

// SVG Icons for UI controls
const SunIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
  </svg>
)

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const role = user?.role as Role | undefined
  const roleConfig = ROLE_LABELS[role || "DISPATCHER"]
  const { theme, toggleTheme } = useTheme()

  const visibleLinks = ALL_LINKS.filter(l => canAccess(role, l.to))

  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.collapsed : "",
  ].filter(Boolean).join(" ")

  return (
    <div className={sidebarClass}>

      {/* Logo Area */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          {/* Red Cross SVG */}
          <svg viewBox="0 0 28 28" fill="none" width="28" height="28">
            <rect width="28" height="28" rx="6" fill="rgba(239,68,68,0.15)"/>
            <rect x="11" y="5" width="6" height="18" rx="2" fill="#ef4444"/>
            <rect x="5" y="11" width="18" height="6" rx="2" fill="#ef4444"/>
          </svg>
        </div>
        <div className={styles.logoText}>
          <div className={styles.logoName}>Kerala Trauma</div>
          <div className={styles.logoSub}>Emergency Response</div>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button className={styles.collapseToggle} onClick={onToggle} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>

      {/* Navigation */}
      <nav className={styles.nav}>
        {GROUPS.map(group => {
          const groupLinks = visibleLinks.filter(l => l.group === group)
          if (groupLinks.length === 0) return null
          return (
            <div key={group} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{group}</div>
              {groupLinks.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  data-label={l.label}
                  className={({ isActive }) =>
                    [styles.navItem, isActive ? styles.active : ""].filter(Boolean).join(" ")
                  }
                >
                  <span className={styles.navIcon}>{l.icon}</span>
                  <span className={styles.navLabel}>{l.label}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* Emergency Report */}
      <div style={{ padding: "6px" }}>
        <a href="/public-report" className={styles.emergencyBtn}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span className={styles.emergencyBtnText}>Emergency Report</span>
        </a>
      </div>

      {/* User Footer */}
      <div className={styles.userFooter}>
        <div className={styles.userInfo}>
          <div className={styles.avatar} style={{ background: roleConfig?.color || "var(--color-accent-blue)" }}>
            {user?.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className={styles.userMeta}>
            <div className={styles.userName}>{user?.full_name || "Demo User"}</div>
            <span className={styles.userRoleBadge} style={{ background: roleConfig?.bg || "rgba(59,130,246,0.15)", color: roleConfig?.color || "var(--color-accent-blue)" }}>
              {roleConfig?.label || role}
            </span>
          </div>
        </div>
        <div className={styles.footerActions}>
          <button className={styles.themeToggle} onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className={styles.signOutBtn} onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
