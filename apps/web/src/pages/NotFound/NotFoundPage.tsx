import { useNavigate } from "react-router-dom"

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0f1e", color: "#f1f5f9", fontFamily: "Arial" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>404</div>
      <h2 style={{ margin: "0 0 8px" }}>Page not found</h2>
      <p style={{ color: "#64748b", marginBottom: 24 }}>The page you are looking for does not exist.</p>
      <button onClick={() => navigate("/command-center")} style={{ padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
        Back to Command Center
      </button>
    </div>
  )
}
