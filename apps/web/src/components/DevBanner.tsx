export function DevBanner({ feature, description, progress, eta }: any) {
  return (
    <div style={{
      background: "var(--color-bg-tertiary)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)",
      padding: "16px 20px",
      marginBottom: "24px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      boxShadow: "var(--shadow-card)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative background glow */}
      <div style={{ position: "absolute", right: "-10%", top: "-50%", width: "200px", height: "200px", background: "radial-gradient(circle, var(--color-accent-cyan-glow) 0%, transparent 60%)", pointerEvents: "none" }} />
      
      <div style={{
        background: "rgba(245, 158, 11, 0.15)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        borderRadius: "var(--radius-sm)",
        padding: "6px 10px",
        fontSize: "11px",
        color: "var(--color-warning)",
        fontWeight: 700,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        IN DEVELOPMENT
      </div>

      <div style={{ flex: 1, zIndex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
          {feature}
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          {description}
        </div>
        
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, background: "var(--color-bg-hover)", borderRadius: "99px", height: "6px", overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, var(--color-warning), var(--color-success))",
              borderRadius: "99px"
            }} />
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            {progress}%{eta ? ` · ETA ${eta}` : ""}
          </div>
        </div>
      </div>
    </div>
  )
}
