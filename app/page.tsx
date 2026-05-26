import Link from 'next/link'
import { auth } from '@/auth'

const DEMO_TWEETS = [
  {
    num: '1/',
    text: "Most startup advice is given by people who got lucky once.\n\nHere's what actually builds companies:",
    isHook: true,
    isCta: false,
    replies: '14',
    rt: '52',
    likes: '318',
  },
  {
    num: '2/',
    text: "Talk to users before writing a single line of code.\n\nNot surveys. Not forms.\n\nReal 20-min calls where you say nothing and listen.",
    isHook: false,
    isCta: false,
    replies: '6',
    rt: '31',
    likes: '201',
  },
  {
    num: '3/',
    text: 'The one question that changes everything:\n\n"When does this problem hurt most?"\n\nThat moment is your product.\n\nFollow for more. →',
    isHook: false,
    isCta: true,
    replies: '22',
    rt: '89',
    likes: '614',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Paste anything',
    body: 'Blog posts, newsletters, raw notes, or a single sentence idea. Up to 8,000 characters of input.',
  },
  {
    n: '02',
    title: 'Pick your tone',
    body: 'Authoritative insight, spicy hot-take, or emotional narrative — each uses a distinct writing persona.',
  },
  {
    n: '03',
    title: 'Generate & edit',
    body: 'Watch tweets stream in real-time. Edit any card inline, track character counts, copy with one click.',
  },
]

const FEATURES = [
  {
    icon: '📡',
    title: '3 writing personas',
    body: 'Informative authority, spicy contrarian, or emotional narrative. Match your brand voice exactly.',
  },
  {
    icon: '⚡',
    title: 'Streams in real-time',
    body: 'Tweets appear word-by-word as they generate. No spinners, no waiting rooms, instant feedback.',
  },
  {
    icon: '✍️',
    title: 'Inline editing',
    body: 'Every tweet is a live editor. Refine the hook, punch up the CTA, fix a typo — before you copy.',
  },
  {
    icon: '📏',
    title: '280-char tracking',
    body: 'Live character count on every card with color-coded warnings. You\'ll never accidentally go over.',
  },
]

export default async function LandingPage() {
  const session = await auth()
  const isSignedIn = !!session?.user

  return (
    <div className="lp-root">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-logo">
          <div className="logo-dot" />
          ThreadCraft
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSignedIn ? (
            <>
              <span style={{ fontSize: '13px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                {session.user?.name ?? session.user?.email}
              </span>
              <Link href="/generate" className="lp-nav-cta">
                Open app →
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin" style={{ fontSize: '13px', color: 'var(--text2)', textDecoration: 'none' }}>
                Sign in
              </Link>
              <Link href="/generate" className="lp-nav-cta">
                Try free →
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-glow lp-glow-a" />
        <div className="lp-hero-glow lp-glow-b" />

        <div className="lp-hero-inner">
          {/* Copy */}
          <div className="lp-copy">
            <div className="lp-eyebrow">// ai-powered thread generation</div>
            <h1 className="lp-h1">
              Turn any content into a viral{' '}
              <span className="lp-h1-accent">X thread.</span>
            </h1>
            <p className="lp-sub">
              Paste a blog post, newsletter, or raw idea. ThreadCraft transforms it into a
              crafted Twitter/X thread in seconds — powered by Claude AI.
            </p>
            <div className="lp-ctas">
              <Link href="/generate" className="lp-cta-primary">
                Generate your first thread →
              </Link>
              <a href="#how-it-works" className="lp-cta-secondary">
                See how it works ↓
              </a>
            </div>
            <div className="lp-trust">
              <span>✓ Free to start</span>
              <span>✓ No signup required</span>
              <span>✓ 5 threads / month</span>
            </div>
          </div>

          {/* Demo thread */}
          <div className="lp-demo">
            <div className="lp-demo-label">// sample output</div>
            <div className="lp-demo-thread">
              {DEMO_TWEETS.map((tweet, i) => (
                <div
                  key={i}
                  className="lp-tweet-row"
                  style={{ animationDelay: `${i * 0.18}s` }}
                >
                  <div className="lp-avatar-col">
                    <div className="lp-avatar">TC</div>
                    {i < DEMO_TWEETS.length - 1 && <div className="lp-thread-line" />}
                  </div>
                  <div className="lp-tweet-content">
                    <div className="lp-tweet-header">
                      <span className="lp-tweet-name">ThreadCraft AI</span>
                      <span className="lp-tweet-handle">@threadcraft</span>
                      {tweet.isHook && (
                        <span className="lp-tweet-badge lp-badge-hook">hook</span>
                      )}
                      {tweet.isCta && (
                        <span className="lp-tweet-badge lp-badge-cta">cta</span>
                      )}
                    </div>
                    <p className="lp-tweet-body">{tweet.text}</p>
                    <div className="lp-tweet-stats">
                      <span className="lp-tweet-stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {tweet.replies}
                      </span>
                      <span className="lp-tweet-stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        {tweet.rt}
                      </span>
                      <span className="lp-tweet-stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        {tweet.likes}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/generate" className="lp-demo-cta">
              Generate your thread →
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────── */}
      <div className="lp-stats-strip">
        <div className="lp-stat-item">
          <span className="lp-stat-num">3</span>
          <span className="lp-stat-label">tone modes</span>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat-item">
          <span className="lp-stat-num">15</span>
          <span className="lp-stat-label">tweets max</span>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat-item">
          <span className="lp-stat-num">~10s</span>
          <span className="lp-stat-label">to generate</span>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat-item">
          <span className="lp-stat-num">$0</span>
          <span className="lp-stat-label">to start</span>
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">// how it works</div>
          <h2 className="lp-section-title">Three steps to a ready-to-post thread</h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.n} className="lp-step">
                <div className="lp-step-num">{s.n}</div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-body">{s.body}</div>
                {i < STEPS.length - 1 && <div className="lp-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">// features</div>
          <h2 className="lp-section-title">Built for writers who want reach</h2>
          <div className="lp-features">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature">
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-body">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MID CTA ─────────────────────────────────────────── */}
      <div className="lp-mid-cta">
        <p className="lp-mid-cta-text">
          5 free threads every month. No credit card.<br />No account. Just open the app and generate.
        </p>
        <Link href="/generate" className="lp-cta-primary">
          Open ThreadCraft →
        </Link>
      </div>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">// pricing</div>
          <h2 className="lp-section-title">Start free. Upgrade when you&apos;re ready.</h2>
          <div className="lp-pricing">
            <div className="lp-price-card">
              <div className="lp-price-plan">Free</div>
              <div className="lp-price-row">
                <span className="lp-price-amount">$0</span>
                <span className="lp-price-period">/ forever</span>
              </div>
              <ul className="lp-price-features">
                <li>5 threads per month</li>
                <li>All 3 tone modes</li>
                <li>Inline tweet editing</li>
                <li>One-click copy</li>
              </ul>
              <Link href="/generate" className="lp-price-cta lp-price-cta-outline">
                Start free →
              </Link>
            </div>

            <div className="lp-price-card lp-price-card-pro">
              <div className="lp-price-plan">
                Pro
                <span className="lp-price-badge">most popular</span>
              </div>
              <div className="lp-price-row">
                <span className="lp-price-amount">$9</span>
                <span className="lp-price-period">/ month</span>
              </div>
              <ul className="lp-price-features">
                <li>Unlimited threads</li>
                <li>Thread history + search</li>
                <li>URL input — fetch any article</li>
                <li>Priority generation speed</li>
                <li>No watermark</li>
                <li>Early access to new features</li>
              </ul>
              <a href="#" className="lp-price-cta lp-price-cta-solid">
                Go Pro →
              </a>
            </div>
          </div>
          <p className="lp-pricing-note">// 7-day refund policy · no questions asked</p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="lp-final-cta">
        <div className="lp-final-glow" />
        <div className="lp-final-inner">
          <div className="lp-final-eyebrow">// ready to start?</div>
          <h2 className="lp-final-title">Your ideas deserve more reach.</h2>
          <p className="lp-final-sub">
            Turn your expertise into threads that get saved, shared, and followed.
            Start generating in under 10 seconds.
          </p>
          <Link href="/generate" className="lp-final-btn">
            Generate your first thread — free →
          </Link>
          <p className="lp-final-note">// no signup · no credit card · 5 free threads per month</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo">
            <div className="logo-dot" />
            ThreadCraft
          </div>
          <div className="lp-footer-links">
            <Link href="/generate">App</Link>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="lp-footer-copy">// built with Claude AI · 2025</div>
        </div>
      </footer>
    </div>
  )
}
