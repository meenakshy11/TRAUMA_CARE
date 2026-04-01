import { useNavigate } from "react-router-dom"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg-primary)",
      color: "var(--color-text-primary)",
      fontFamily: "var(--font-sans)",
      padding: 24,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle at 30% 40%, rgba(59,130,246,0.06) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(6,182,212,0.06) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Grid lines */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", animation: "fade-up 400ms ease both" }}>
        {/* 404 number */}
        <div className="mono" style={{
          fontSize: "160px",
          fontWeight: 800,
          lineHeight: 1,
          background: "linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-cyan))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: 16,
          userSelect: "none",
        }}>
          404
        </div>

        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 24, opacity: 0.6 }}>🚨</div>

        {/* Message */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", maxWidth: 420, margin: "0 auto 40px", lineHeight: 1.6 }}>
          The resource you're looking for doesn't exist or you don't have permission to access it.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
          <button
            onClick={() => navigate("/command-center")}
            className="btn btn-primary"
            style={{ padding: "12px 28px", fontSize: 14 }}
          >
            ← Return to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ padding: "12px 28px", fontSize: 14 }}
          >
            Go Back
          </button>
        </div>

        {/* Status strip */}
        <div style={{
          marginTop: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 12,
          color: "var(--color-text-muted)",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)", display: "inline-block", animation: "blink 2s ease-in-out infinite" }} />
          Kerala Trauma Response Platform · All Systems Operational
        </div>
      </div>
    </div>
  )
}
