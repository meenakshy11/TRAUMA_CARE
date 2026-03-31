/**
 * LoginPage.tsx
 *
 * The authentication entry point for the Integrated Trauma Care Platform.
 * Pre-fills dispatcher credentials in demo mode so reviewers can log in
 * immediately without memorising passwords.
 *
 * Features:
 *  • Pre-filled demo credentials with a one-click "Quick Login" shortcut
 *  • Animated expandable credentials reference card
 *  • react-hook-form + Zod validation
 *  • Full keyboard navigation (Tab → Enter submits)
 *  • Redirects to the page the user originally tried to visit if
 *    router state.from is present
 *  • Password visibility toggle
 *  • Loading spinner replaces the button label during login
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/App';
import styles from './LoginPage.module.css';

// ─── Validation Schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Demo Credential Slots ────────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  { role: 'DISPATCHER',     email: 'dispatcher@trauma.demo', password: 'Demo@1234',  color: '#3b82f6' },
  { role: 'ADMIN',          email: 'admin@trauma.demo',      password: 'Admin@1234', color: '#8b5cf6' },
  { role: 'HOSPITAL STAFF', email: 'hospital@trauma.demo',   password: 'Hosp@1234',  color: '#10b981' },
  { role: 'GOVERNMENT',     email: 'gov@trauma.demo',        password: 'Gov@1234',   color: '#f59e0b' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const login    = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  const [showPassword, setShowPassword]   = useState(false);
  const [showDemoCard, setShowDemoCard]   = useState(isDemo);
  const [formError, setFormError]         = useState<string | null>(null);

  // Destination to redirect to after login
  const from = (location.state as { from?: string })?.from ?? ROUTES.COMMAND_CENTER;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      // Pre-fill with dispatcher credentials in demo mode
      email:    isDemo ? 'dispatcher@trauma.demo' : '',
      password: isDemo ? 'Demo@1234' : '',
    },
  });

  // Keep form error in sync with auth store error
  useEffect(() => {
    if (authError) setFormError(authError);
  }, [authError]);

  // Clear errors when user starts typing
  const handleFieldChange = () => {
    if (formError) { setFormError(null); clearError(); }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(null);
    try {
      await login({ email: data.email, password: data.password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setFormError(msg);
    }
  };

  const handleQuickLogin = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    setFormError(null);
    clearError();
  };

  return (
    <div className={styles.page}>
      {/* ── Animated background ─────────────────────────────────── */}
      <div className={styles.bgGrid} aria-hidden="true" />
      <div className={styles.bgGlow1} aria-hidden="true" />
      <div className={styles.bgGlow2} aria-hidden="true" />

      {/* ── Left panel: branding ─────────────────────────────────── */}
      <aside className={styles.branding} aria-hidden="true">
        <div className={styles.brandingInner}>
          <div className={styles.brandLogo}>
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="url(#loginLogoGrad)" />
              <path d="M32 12v40M12 32h40" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
              <path d="M20 20l24 24M44 20L20 44" stroke="#fff" strokeWidth="2.5"
                strokeLinecap="round" opacity="0.35" />
              <defs>
                <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="64" y2="64"
                  gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ef4444" />
                  <stop offset="1" stopColor="#7f1d1d" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 className={styles.brandTitle}>
            Integrated<br />Trauma Care<br />
            <span className={styles.brandAccent}>Platform</span>
          </h1>

          <p className={styles.brandTagline}>
            Real-time emergency coordination for paramedics, dispatchers,
            and hospital networks across Kerala.
          </p>

          <div className={styles.brandStats}>
            {[
              { value: '< 8 min', label: 'Avg. Response' },
              { value: '73%',     label: 'Golden Hour' },
              { value: '24/7',    label: 'Live Coverage' },
            ].map((s) => (
              <div key={s.label} className={styles.brandStat}>
                <span className={styles.brandStatValue}>{s.value}</span>
                <span className={styles.brandStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right panel: login form ──────────────────────────────── */}
      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          {/* Header */}
          <div className={styles.formHeader}>
            <div className={styles.formLogoSmall} aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <rect width="64" height="64" rx="14" fill="url(#smLogoGrad)" />
                <path d="M32 12v40M12 32h40" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                <defs>
                  <linearGradient id="smLogoGrad" x1="0" y1="0" x2="64" y2="64"
                    gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#7f1d1d" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className={styles.formTitle}>Sign in</h2>
            <p className={styles.formSubtitle}>
              {isDemo
                ? 'Demo mode — credentials pre-filled below'
                : 'Enter your credentials to access the platform'}
            </p>
          </div>

          {/* Demo mode chip */}
          {isDemo && (
            <div className={styles.demoChip} role="status">
              <span className={styles.demoChipDot} aria-hidden="true" />
              DEMO MODE ACTIVE
            </div>
          )}

          {/* Form */}
          <form
            className={styles.form}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Sign in form"
          >
            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                Email address
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  {...register('email', { onChange: handleFieldChange })}
                />
              </div>
              {errors.email && (
                <p className={styles.fieldError} id="email-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label htmlFor="login-password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${styles.input} ${styles.inputPad} ${errors.password ? styles.inputError : ''}`}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  {...register('password', { onChange: handleFieldChange })}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className={styles.fieldError} id="password-error" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Global error */}
            {formError && (
              <div className={styles.alert} role="alert" aria-live="assertive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{formError.split('\n')[0]}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading || isSubmitting}
              aria-busy={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? (
                <>
                  <span className={styles.btnSpinner} aria-hidden="true" />
                  Authenticating…
                </>
              ) : (
                <>
                  Sign in
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* ── Demo credentials card ─────────────────────────────── */}
          {isDemo && (
            <div className={styles.demoCard}>
              <button
                className={styles.demoCardToggle}
                onClick={() => setShowDemoCard((v) => !v)}
                aria-expanded={showDemoCard}
                aria-controls="demo-credentials-panel"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Demo accounts
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    marginLeft: 'auto',
                    transform: showDemoCard ? 'rotate(180deg)' : 'none',
                    transition: 'transform 200ms ease',
                  }}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showDemoCard && (
                <div id="demo-credentials-panel" className={styles.demoAccounts}>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      className={styles.demoAccount}
                      onClick={() => handleQuickLogin(acc.email, acc.password)}
                      aria-label={`Log in as ${acc.role}`}
                    >
                      <span
                        className={styles.demoAccountBadge}
                        style={{ background: `${acc.color}22`, color: acc.color,
                          border: `1px solid ${acc.color}44` }}
                      >
                        {acc.role}
                      </span>
                      <span className={styles.demoAccountEmail}>{acc.email}</span>
                      <span className={styles.demoAccountPwd}>{acc.password}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <p className={styles.formFooter}>
            Integrated Trauma Care Platform · Quantumweave Intelligence Pvt. Ltd.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
