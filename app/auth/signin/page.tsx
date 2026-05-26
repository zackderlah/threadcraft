'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Mode = 'signin' | 'signup'

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.62-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function SignInPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSocial = (provider: 'twitter' | 'google') => {
    signIn(provider, { callbackUrl: '/generate' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Sign up failed')
          return
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(
          mode === 'signin'
            ? 'Invalid email or password'
            : 'Account created but sign in failed — try signing in manually'
        )
      } else {
        router.push('/generate')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setError('')
  }

  return (
    <div className="signin-root">
      <nav className="lp-nav">
        <Link href="/" className="lp-logo" style={{ textDecoration: 'none' }}>
          <div className="logo-dot" />
          ThreadCraft
        </Link>
      </nav>

      <div className="signin-body">
        <div className="signin-card">
          <div className="signin-eyebrow">// authentication</div>
          <h1 className="signin-title">
            {mode === 'signin' ? 'Sign in to ThreadCraft' : 'Create your account'}
          </h1>
          <p className="signin-sub">
            {mode === 'signin'
              ? '5 free threads per month. No credit card.'
              : 'Start generating threads for free. No credit card needed.'}
          </p>

          {/* Social buttons */}
          <div className="signin-social-row">
            <button
              className="signin-social-btn signin-x-btn"
              onClick={() => handleSocial('twitter')}
              type="button"
            >
              <XLogo />
              Continue with X
            </button>
            <button
              className="signin-social-btn signin-google-btn"
              onClick={() => handleSocial('google')}
              type="button"
            >
              <GoogleLogo />
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="signin-divider">
            <span>or continue with email</span>
          </div>

          {/* Email/password form */}
          <form className="signin-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="signin-field">
                <label className="signin-label" htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  className="signin-input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="signin-field">
              <label className="signin-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="signin-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="signin-field">
              <label className="signin-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="signin-input"
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 8 : 1}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && <div className="signin-error">{error}</div>}

            <button
              type="submit"
              className="signin-submit-btn"
              disabled={loading}
            >
              {loading
                ? '...'
                : mode === 'signin'
                ? 'Sign in →'
                : 'Create account →'}
            </button>
          </form>

          {/* Mode switch */}
          <p className="signin-switch">
            {mode === 'signin' ? (
              <>Don&apos;t have an account?{' '}
                <button className="signin-switch-link" onClick={switchMode} type="button">
                  Create one →
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button className="signin-switch-link" onClick={switchMode} type="button">
                  Sign in →
                </button>
              </>
            )}
          </p>

          <p className="signin-note">
            // We only access your public profile. We never post on your behalf.
          </p>
        </div>
      </div>
    </div>
  )
}
