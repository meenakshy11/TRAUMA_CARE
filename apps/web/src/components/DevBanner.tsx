interface DevBannerProps {
  feature: string
  description: string
  progress: number
  eta?: string
}

export function DevBanner({ feature, description, progress, eta }: DevBannerProps) {
  return (
    <div style={{ background: "#1c1500", border: "1px solid #f59e0b44", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ background: "#f59e0b22", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#f59e0b", fontWeight: 600, whiteSpace: "nowrap" }}>IN DEVELOPMENT</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#fbbf24", marginBottom: 4 }}>{feature}</div>
        <div style={{ fontSize: 12, color: "#92400e" }}>{description}</div>
        <div style={{ marginTop: 6, background: "#1e293b", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #10b981)", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "#78350f", marginTop: 3 }}>{progress}% complete{eta ? ` · ETA: ${eta}` : ""}</div>
      </div>
    </div>
  )
}

export function FeatureStatusBadge({ status }: { status: "live" | "development" | "planned" }) {
  const config = {
    live: { label: "LIVE", color: "#10b981" },
    development: { label: "IN DEVELOPMENT", color: "#f59e0b" },
    planned: { label: "PLANNED", color: "#6366f1" },
  }
  const c = config[status]
  return (
    <span style={{ color: c.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, border: `1px solid ${c.color}44`, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, display: "inline-block" }} />
      {c.label}
    </span>
  )
}
