import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { ROLE_HOME, type Role } from "../../config/rbac"
import { authApi } from "../../api/index"
import toast from "react-hot-toast"
import styles from "./LoginPage.module.css"

const DEMO_ROLES = [
  { label: "Dispatcher", email: "dispatcher@trauma.demo", password: "Demo@1234", role: "DISPATCHER" },
  { label: "Admin", email: "admin@trauma.demo", password: "Admin@1234", role: "ADMIN" },
  { label: "Hospital Staff", email: "hospital@trauma.demo", password: "Hosp@1234", role: "HOSPITAL_STAFF" },
  { label: "Government", email: "gov@trauma.demo", password: "Gov@1234", role: "GOVERNMENT" },
]

export function LoginPage() {
  const [email, setEmail] = useState("dispatcher@trauma.demo")
  const [password, setPassword] = useState("Demo@1234")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      const user = res.data.user
      const token = res.data.access_token
      login(user, token)
      toast.success(`Welcome, ${user.full_name}`)
      // Redirect based on role
      const home = ROLE_HOME[user.role as Role] || "/command-center"
      navigate(home)
    } catch {
      toast.error("Invalid credentials. Please check your email and password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.particleBg} />
        <div className={styles.leftContent}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <svg viewBox="0 0 28 28" fill="none" width="28" height="28">
                <rect width="28" height="28" rx="6" fill="rgba(6,182,212,0.15)"/>
                <rect x="11" y="5" width="6" height="18" rx="2" fill="#06b6d4"/>
                <rect x="5" y="11" width="18" height="6" rx="2" fill="#06b6d4"/>
              </svg>
            </div>
            <div>
              <div className={styles.deptTitle}>GOVERNMENT OF KERALA</div>
              <div className={styles.deptSub}>Health & Family Welfare</div>
            </div>
          </div>
          <h1 className={styles.title}>Integrated Trauma Care Platform</h1>
          <p className={styles.tagline}>
            Coordinating emergency response across ambulances, hospitals, and command centers for faster trauma care across Kerala.
          </p>
          <div className={styles.features}>
            {[
              { icon: "🗺", text: "Real-time geospatial command center" },
              { icon: "⚡", text: "Automated ambulance dispatch algorithms" },
              { icon: "🏥", text: "Hospital resource visibility & alerts" },
              { icon: "📊", text: "Golden Hour compliance analytics" },
            ].map((f, i) => (
              <div key={i} className={styles.featureItem}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <span className={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.footerText}>Quantumweave Intelligence Pvt. Ltd.</div>
          <div className={styles.footerSub}>Platform v1.0 · KSUM Initiative · 2026</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.mobileBrand}>Integrated Trauma Care Platform</h1>
            <h2 className={styles.formTitle}>Sign in to your account</h2>
            <p className={styles.formDesc}>Access is restricted to authorized personnel</p>
          </div>

          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                type="email" 
                required 
                className={styles.input}
                placeholder="user@kerala.gov.in"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <input 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className={styles.input}
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  className={styles.pwdToggle} 
                  onClick={() => setShowPassword(p => !p)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    {showPassword ? (
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z M10 2C5 2 1.73 6.11 1 7c.73.89 4 5 9 5s8.27-4.11 9-5c-.73-.89-4-5-9-5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                    ) : (
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z M10 2C5 2 1.73 6.11 1 7c.73.89 4 5 9 5s8.27-4.11 9-5c-.73-.89-4-5-9-5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/> // Note: Need a proper hide icon path, simplified for now
                    )}
                  </svg>
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? (
                <span className="spinner" style={{ marginRight: 8, borderColor: "rgba(255,255,255,0.4)" }} />
              ) : null}
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          {/* Demo Accounts Wrapper */}
          <div className={styles.demoSection}>
            <div className={styles.demoLabel}>Demo Accounts</div>
            <div className={styles.demoGrid}>
              {DEMO_ROLES.map((r) => (
                <button 
                  key={r.label} 
                  onClick={() => { setEmail(r.email); setPassword(r.password) }}
                  className={`${styles.demoBtn} ${email === r.email ? styles.active : ""}`}
                >
                  <div className={styles.demoRole}>{r.label}</div>
                  <div className={styles.demoEmail}>{r.email}</div>
                  <div className={styles.demoDest}>
                    → {r.role === "HOSPITAL_STAFF" ? "Hospital Dashboard" : r.role === "GOVERNMENT" ? "Analytics" : "Command Center"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <a href="/public-report" className={styles.reportLink}>
            🆘 Report Emergency Without Login
          </a>
        </div>
      </div>
    </div>
  )
}
