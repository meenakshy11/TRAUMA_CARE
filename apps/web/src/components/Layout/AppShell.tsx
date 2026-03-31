import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { useWebSocket } from "../../hooks/useWebSocket"

export function AppShell() {
  useWebSocket()
  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f4ff", fontFamily: "Arial, sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflow: "auto", background: "#f0f4ff" }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
