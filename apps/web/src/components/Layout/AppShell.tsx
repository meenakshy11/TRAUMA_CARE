import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { useWebSocket } from "../../hooks/useWebSocket"

export function AppShell() {
  useWebSocket()
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1e", fontFamily: "Arial, sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
