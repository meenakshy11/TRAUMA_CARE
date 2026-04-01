import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { useWebSocket } from "../../hooks/useWebSocket"

// Pages that need full-height / no padding (map-centric)
const FULL_BLEED_ROUTES = ["/command-center"]

export function AppShell() {
  useWebSocket()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isFullBleed = FULL_BLEED_ROUTES.some(r => location.pathname.startsWith(r))

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev)
  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      backgroundColor: "var(--color-bg-primary)",
      color: "var(--color-text-primary)",
      overflow: "hidden",
    }}>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 400 }}
        />
      )}

      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar onMenuClick={toggleMobileMenu} />

        <main
          className={isFullBleed ? "" : "page-content"}
          style={{
            flex: 1,
            overflow: isFullBleed ? "hidden" : "auto",
            position: "relative",
            // Full-bleed map pages: no padding. Regular pages: responsive padded container
            ...(isFullBleed
              ? {}
              : { padding: "24px", overflowY: "auto" }
            ),
          }}
        >
          {isFullBleed ? (
            // Map pages get the raw outlet — no wrapper
            <Outlet />
          ) : (
            // Regular pages get max-width container
            <div style={{ maxWidth: 1440, margin: "0 auto", height: "100%" }}>
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
