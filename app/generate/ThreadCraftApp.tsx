'use client'

import { useState, useRef } from 'react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'

type Tone = 'informative' | 'spicy' | 'storytelling'
type Length = 'short' | 'medium' | 'long'
type View = 'output' | 'history'

interface SavedThread {
  id: string
  tone: Tone
  length: Length
  tweet_count: number
  tweets: string[]
  input_preview: string | null
  created_at: string
}

const MAX_FREE = 5
const MAX_PRO = 300

const TONE_ICONS: Record<Tone, string> = {
  informative: '📡',
  spicy: '🌶',
  storytelling: '🎭',
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

const TONE_OPTIONS = [
  { id: 'informative' as Tone, icon: '📡', name: 'Informative', desc: 'Authority & insight' },
  { id: 'spicy' as Tone, icon: '🌶', name: 'Spicy', desc: 'Hot take & debate' },
  { id: 'storytelling' as Tone, icon: '🎭', name: 'Story', desc: 'Narrative arc' },
]

const LENGTH_OPTIONS = [
  { id: 'short' as Length, label: 'Short', range: '4–6' },
  { id: 'medium' as Length, label: 'Medium', range: '7–10' },
  { id: 'long' as Length, label: 'Long', range: '11–15' },
]

const FREE_FEATURES = [
  '5 threads per month',
  'All three tones',
  'Inline tweet editing',
  'One-click copy',
]

const PRO_FEATURES = [
  '300 threads per month',
  'Faster Sonnet model',
  'Thread history + search',
  'URL input (fetch any article)',
  'Priority generation speed',
  'Early access to new features',
]

const STRIPE_PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? '#'

function UpgradeModal({ onClose, isPro, stripeUrl }: { onClose: () => void; isPro: boolean; stripeUrl: string }) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-eyebrow">// upgrade</div>
        <div className="modal-title">More threads. No limits.</div>
        <div className="modal-sub">
          {isPro
            ? `You've hit your ${MAX_PRO}-thread Pro limit this month. It resets on the 1st.`
            : `You've used all ${MAX_FREE} free threads this month.`}
        </div>

        <div className="price-grid">
          <div className="price-tile">
            <div className="tile-plan">Free</div>
            <div className="tile-price">$0</div>
            <div className="tile-period">// forever</div>
            <ul className="tile-features">
              {FREE_FEATURES.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <button className="tile-cta tile-cta-outline" onClick={onClose}>
              Stay free
            </button>
          </div>

          <div className="price-tile pro">
            <div className="tile-plan">
              Pro
              <span className="tile-popular">most popular</span>
            </div>
            <div className="tile-price">$9</div>
            <div className="tile-period">// per month</div>
            <ul className="tile-features">
              {PRO_FEATURES.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <a
              className="tile-cta tile-cta-solid"
              href={stripeUrl}
              onClick={stripeUrl === '#' ? (e) => e.preventDefault() : undefined}
            >
              Go Pro →
            </a>
          </div>
        </div>

        <p className="modal-note">// 7-day refund policy · no questions asked</p>
      </div>
    </div>
  )
}

interface TweetCardProps {
  displayText: string
  index: number
  total: number
  isStreaming?: boolean
  onCopySuccess: () => void
}

function TweetCard({ displayText, index, total, isStreaming, onCopySuccess }: TweetCardProps) {
  const [value, setValue] = useState(displayText)
  const charCount = isStreaming ? displayText.length : value.length
  const pct = Math.min(100, (charCount / 280) * 100)
  const countClass =
    charCount > 280 ? 'char-count char-over' : charCount > 240 ? 'char-count char-warn' : 'char-count char-ok'
  const fillClass =
    charCount > 280 ? 'char-fill char-fill-over' : charCount > 240 ? 'char-fill char-fill-warn' : 'char-fill char-fill-ok'

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(onCopySuccess)
  }

  return (
    <div
      className={`tweet-card${index === 0 ? ' hook-card' : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="tweet-top">
        <span className="tweet-num-badge">
          {index + 1} / {total}
        </span>
        <div className="tweet-actions-row">
          {index === 0 && <span className="hook-badge">hook</span>}
          {index === total - 1 && total > 1 && (
            <span
              className="hook-badge"
              style={{
                color: 'var(--aurora3)',
                borderColor: 'var(--aurora3)',
                background: 'rgba(163,190,140,0.08)',
              }}
            >
              cta
            </span>
          )}
          {!isStreaming && (
            <button className="tweet-copy-btn" onClick={handleCopy}>
              copy
            </button>
          )}
        </div>
      </div>

      <div className="tweet-body">
        {isStreaming ? (
          <div className="tweet-text" style={{ opacity: 0.8 }}>
            {displayText}
          </div>
        ) : (
          <textarea
            className="tweet-text"
            value={value}
            onChange={handleChange}
            ref={(el) => {
              if (el) {
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }
            }}
          />
        )}
      </div>

      <div className="tweet-footer">
        <div className="char-bar">
          <div className={fillClass} style={{ width: `${pct}%` }} />
        </div>
        <span className={countClass}>
          {charCount} / 280{charCount > 280 ? ' (over!)' : ''}
        </span>
      </div>
    </div>
  )
}

function Skeletons() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i}>
          {i > 0 && <div className="thread-connector" />}
          <div className="skeleton" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="skel-line short" />
            <div className="skel-line long" style={{ marginTop: '12px' }} />
            <div className="skel-line med" />
            <div className="skel-line" style={{ width: '55%' }} />
          </div>
        </div>
      ))}
    </>
  )
}

interface Props {
  initialUsage: number
  isPro: boolean
  userName: string | null
  userImage: string | null
  userEmail: string | null
}

export default function ThreadCraftApp({ initialUsage, isPro, userName, userImage, userEmail }: Props) {
  const [content, setContent] = useState('')
  const [tone, setTone] = useState<Tone>('informative')
  const [length, setLength] = useState<Length>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [previewParts, setPreviewParts] = useState<string[]>([])
  const [finalTweets, setFinalTweets] = useState<string[]>([])
  const [outputMeta, setOutputMeta] = useState('// ready to generate')
  const [showActions, setShowActions] = useState(false)
  const [usageCount, setUsageCount] = useState(initialUsage)
  const monthlyLimit = isPro ? MAX_PRO : MAX_FREE

  // Build Stripe URL with pre-filled email so customers don't have to type it
  const stripeUrl = STRIPE_PAYMENT_LINK !== '#' && userEmail
    ? `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(userEmail)}`
    : STRIPE_PAYMENT_LINK
  const [contentShake, setContentShake] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [view, setView] = useState<View>('output')
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500)
  }

  const generateThread = async () => {
    if (!content.trim()) {
      setContentShake(true)
      setTimeout(() => setContentShake(false), 1200)
      return
    }
    if (usageCount >= monthlyLimit) {
      setShowUpgrade(true)
      return
    }

    setIsLoading(true)
    setFinalTweets([])
    setPreviewParts([])
    setShowActions(false)
    setOutputMeta('// generating...')

    let buffer = ''

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), tone, length }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `HTTP ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        if (buffer.includes('\x00ERROR:')) {
          const msg = buffer.split('\x00ERROR:')[1] ?? 'Unknown error'
          throw new Error(msg)
        }
        const parts = buffer.split('===TWEET===').map((t) => t.trim()).filter(Boolean)
        setPreviewParts(parts)
      }

      const final = buffer.split('===TWEET===').map((t) => t.trim()).filter(Boolean)
      if (final.length === 0) throw new Error('No tweets generated')

      setFinalTweets(final)
      setPreviewParts([])
      setUsageCount((c) => c + 1)
      setOutputMeta(`// ${final.length} tweets · ${tone} · ${length}`)
      setShowActions(true)

      // Persist thread to database (fire-and-forget)
      fetch('/api/threads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweets: final,
          tone,
          length,
          inputPreview: content.slice(0, 150),
        }),
      }).catch(console.error)
    } catch (err) {
      setPreviewParts([])
      setOutputMeta('// generation failed')
      showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearOutput = () => {
    setFinalTweets([])
    setPreviewParts([])
    setShowActions(false)
    setOutputMeta('// ready to generate')
  }

  const openHistory = async () => {
    setView('history')
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/threads/list')
      if (!res.ok) throw new Error('Failed to load history')
      const data = await res.json()
      setSavedThreads(data.threads ?? [])
    } catch (err) {
      showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setView('output')
    } finally {
      setHistoryLoading(false)
    }
  }

  const openSavedThread = (thread: SavedThread) => {
    setFinalTweets(thread.tweets)
    setPreviewParts([])
    setShowActions(true)
    setOutputMeta(`// ${thread.tweet_count} tweets · ${thread.tone} · ${thread.length} · ${timeAgo(thread.created_at)}`)
    setView('output')
  }

  const copyAll = () => {
    const els = document.querySelectorAll<HTMLTextAreaElement>('textarea.tweet-text')
    const text = Array.from(els)
      .map((el, i) => `${i + 1}/\n${el.value}`)
      .join('\n\n')
    navigator.clipboard.writeText(text).then(() => showToast('✓ Full thread copied to clipboard'))
  }

  const isFinalMode = !isLoading && finalTweets.length > 0
  const activeTweets = isLoading ? previewParts : finalTweets
  const usagePct = (usageCount / monthlyLimit) * 100
  const usageFull = usageCount >= monthlyLimit

  return (
    <>
      <nav>
        <a href="/" className="logo" style={{ textDecoration: 'none' }}>
          <div className="logo-dot" />
          ThreadCraft
        </a>
        <div className="nav-right">
          {userImage && (
            <Image
              src={userImage}
              alt={userName ?? 'User'}
              width={28}
              height={28}
              className="nav-avatar"
            />
          )}
          <span className="nav-pill">
            {usageCount} / {monthlyLimit} threads
          </span>
          {isPro ? (
            <>
              <span className="nav-pill nav-pill-pro">PRO</span>
              <a className="nav-btn nav-btn-ghost" href="/api/stripe/portal">Manage plan</a>
            </>
          ) : (
            <a className="nav-btn" href={stripeUrl} onClick={stripeUrl === '#' ? (e) => e.preventDefault() : undefined}>Go Pro ↗</a>
          )}
          <button
            className="nav-btn nav-btn-ghost"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="app-shell">
        <div className="left-panel">
          <div className="panel-header">
            <div className="panel-title">New thread</div>
            <div className="panel-sub">// paste content, pick tone, generate</div>
          </div>

          <div className="panel-body">
            <div>
              <div className="field-label">Content</div>
              <div className="textarea-wrap">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Paste your article, blog post, newsletter, or raw notes here.\n\nOr just type an idea — like 'the best way to learn a new skill is to teach it immediately'...`}
                  maxLength={8000}
                  style={contentShake ? { borderColor: 'var(--red)' } : undefined}
                />
                <span className="char-hint">{content.length.toLocaleString()} / 8,000</span>
              </div>
            </div>

            <div>
              <div className="field-label">Tone</div>
              <div className="tone-grid">
                {TONE_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`tone-btn${tone === opt.id ? ' active' : ''}`}
                    onClick={() => setTone(opt.id)}
                  >
                    <div className="tone-icon">{opt.icon}</div>
                    <span className="tone-name">{opt.name}</span>
                    <span className="tone-desc">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="field-label">Thread length</div>
              <div className="length-btns">
                {LENGTH_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`len-btn${length === opt.id ? ' active' : ''}`}
                    onClick={() => setLength(opt.id)}
                  >
                    {opt.label}
                    <br />
                    <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{opt.range}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="generate-btn" onClick={generateThread} disabled={isLoading}>
              <div className="btn-inner">
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate thread ↗</span>
                )}
              </div>
            </button>
          </div>

          <div className="usage-section">
            <div className="usage-row">
              <span className="usage-label">
                {isPro ? 'pro threads used' : 'free threads used'}
              </span>
              <span className="usage-count">
                {usageCount} / {monthlyLimit}
              </span>
            </div>
            <div className="usage-bar">
              <div
                className="usage-fill"
                style={{
                  width: `${usagePct}%`,
                  background: usageFull ? 'var(--red)' : isPro ? 'var(--aurora3)' : undefined,
                }}
              />
            </div>
            {usageFull && !isPro && (
              <div className="upgrade-nudge">
                You&apos;ve used all free threads.{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setShowUpgrade(true) }}>Upgrade to Pro →</a>
              </div>
            )}
            {usageFull && isPro && (
              <div className="upgrade-nudge" style={{ color: 'var(--text3)' }}>
                Monthly limit reached. Resets on the 1st.
              </div>
            )}
          </div>
        </div>

        <div className="right-panel">
          <div className="output-header">
            <div>
              <div className="output-title">
                {view === 'history' ? 'Recent threads' : 'Thread output'}
              </div>
              <div className="output-meta">
                {view === 'history'
                  ? historyLoading
                    ? '// loading...'
                    : `// ${savedThreads.length} saved`
                  : outputMeta}
              </div>
            </div>
            <div className="output-actions">
              {view === 'history' ? (
                <button className="action-btn" onClick={() => setView('output')}>
                  ← Back
                </button>
              ) : (
                <>
                  <button className="action-btn" onClick={openHistory}>
                    ⏱ History
                  </button>
                  {showActions && (
                    <>
                      <button className="action-btn" onClick={clearOutput}>
                        Clear
                      </button>
                      <button className="action-btn copy-all" onClick={copyAll}>
                        ⌘ Copy all
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="thread-output">
            {view === 'history' ? (
              historyLoading ? (
                <div className="history-empty">// loading your threads...</div>
              ) : savedThreads.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📜</div>
                  <div className="empty-title">No threads yet</div>
                  <div className="empty-sub">
                    Threads you generate will appear here. Go back and create your first one.
                  </div>
                </div>
              ) : (
                <div className="history-list">
                  {savedThreads.map((t) => (
                    <button
                      key={t.id}
                      className="history-card"
                      onClick={() => openSavedThread(t)}
                    >
                      <div className="history-preview">
                        {t.input_preview ?? t.tweets[0]?.replace(/^\d+\/\n?/, '').slice(0, 120) ?? 'Untitled thread'}
                      </div>
                      <div className="history-meta">
                        <span className="history-meta-tone">
                          {TONE_ICONS[t.tone]} {t.tone}
                        </span>
                        <span className="history-dot">·</span>
                        <span>{t.tweet_count} tweets</span>
                        <span className="history-dot">·</span>
                        <span>{t.length}</span>
                        <span className="history-time">{timeAgo(t.created_at)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : activeTweets.length === 0 && !isLoading ? (
              <div className="empty-state">
                <div className="empty-icon">✦</div>
                <div className="empty-title">Your thread appears here</div>
                <div className="empty-sub">
                  Paste any content on the left, pick a tone, and generate. Each tweet is editable before you copy.
                </div>
                <div className="empty-hint">
                  <span className="hint-pill">blog posts</span>
                  <span className="hint-pill">newsletters</span>
                  <span className="hint-pill">raw notes</span>
                  <span className="hint-pill">ideas</span>
                  <span className="hint-pill">URLs (pro)</span>
                </div>
              </div>
            ) : activeTweets.length === 0 && isLoading ? (
              <Skeletons />
            ) : (
              activeTweets.map((tweet, i) => (
                <div key={isFinalMode ? `final-${i}` : `preview-${i}`}>
                  {i > 0 && <div className="thread-connector" />}
                  <TweetCard
                    displayText={tweet.replace(/^\d+\/\n?/, '').trim()}
                    index={i}
                    total={activeTweets.length}
                    isStreaming={!isFinalMode}
                    onCopySuccess={() => showToast('✓ Copied to clipboard')}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} isPro={isPro} stripeUrl={stripeUrl} />}
    </>
  )
}
