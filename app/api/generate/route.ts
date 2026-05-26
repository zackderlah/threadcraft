import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { db } from '@/lib/supabase'

const AI_WRITING_RULES = `
Never do any of the following — they make writing sound like AI:
- Never use em dashes (—). Use a period or line break instead.
- Never use: "delve", "dive in", "unpack", "explore", "leverage", "game-changer", "transformative", "crucial", "vital", "straightforward", "it's worth noting", "in conclusion", "furthermore", "moreover", "nevertheless"
- Never use filler openers like "Absolutely", "Certainly", "Of course", "Great question"
- Never write in perfect parallel structure for every tweet. Vary sentence rhythm and length
- Never start multiple tweets the same way
- Never over-punctuate. Real people don't write: "Here's the thing:" then "Here's why:" then "Here's how:"
- Avoid colons used to introduce a list in every tweet. Mix it up
- Write like a smart person texting, not a consultant writing a report`

const SYSTEM_PROMPTS: Record<string, string> = {
  informative: `You are an expert Twitter/X ghostwriter who specialises in educational, authoritative threads. You write threads that teach something real and get saved and reshared.

Rules:
- Tweet 1: A powerful hook. Bold claim, counterintuitive insight, or surprising fact. Never start with "I" or "In this thread". Under 200 chars.
- Middle tweets: Each delivers ONE crisp insight. Short sentences. Use line breaks for rhythm. Facts, examples, frameworks.
- Last tweet: A strong close. Key takeaway + invite to follow/save.
- Every tweet MUST be under 280 characters including the number prefix like "1/"
- No filler phrases. No "Let's dive in". No "Thread 🧵".
- Numbering: 1/ 2/ 3/ etc. on the first line of each tweet.
- Return ONLY the tweets separated by the delimiter: ===TWEET===
${AI_WRITING_RULES}`,

  spicy: `You are a provocateur on Twitter/X who writes threads that spark debate and go viral through controversy and strong opinions.

Rules:
- Tweet 1: A spicy, contrarian opening take. Something that makes people stop and react. Bold, confident, slightly edgy.
- Middle tweets: Build the argument. Challenge conventional wisdom. Use "actually", "nobody talks about", "hot take:".
- Last tweet: Land the bigger point. Invite pushback.
- Every tweet MUST be under 280 characters including the number prefix like "1/"
- Confident tone throughout. No hedging.
- Numbering: 1/ 2/ 3/ etc. on the first line of each tweet.
- Return ONLY the tweets separated by the delimiter: ===TWEET===
${AI_WRITING_RULES}`,

  storytelling: `You are a master storyteller on Twitter/X who writes narrative threads that pull readers in with emotional hooks and personal arcs.

Rules:
- Tweet 1: Open in the middle of the action. A scene, a moment, a specific detail. Not a summary.
- Middle tweets: Unfold the story beat by beat. Build tension. Show, don't tell.
- Last tweet: The payoff. The lesson. The turn.
- Every tweet MUST be under 280 characters including the number prefix like "1/"
- Use specific sensory details. Short punchy sentences. Incomplete sentences are fine for effect.
- Numbering: 1/ 2/ 3/ etc. on the first line of each tweet.
- Return ONLY the tweets separated by the delimiter: ===TWEET===
${AI_WRITING_RULES}`,
}

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short: 'Write a SHORT thread of exactly 4-6 tweets total.',
  medium: 'Write a MEDIUM thread of exactly 7-10 tweets total.',
  long: 'Write a LONG thread of exactly 11-15 tweets total.',
}

const FREE_MONTHLY_CAP = 5
const PRO_MONTHLY_CAP = 300
const HOURLY_RATE_LIMIT = 20

// Sentinel written into the stream on error so the client gets a real response
// instead of ERR_EMPTY_RESPONSE from a dropped connection.
const ERROR_MARKER = '\x00ERROR:'

export async function POST(req: Request) {
  // ── 1. Authenticate ────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }
  const userId = session.user.id

  // ── 2. Resolve pro status + pick model ────────────────────────────────────
  const { data: userRow } = await db()
    .from('users')
    .select('is_pro')
    .eq('id', userId)
    .single()

  const isPro: boolean = userRow?.is_pro ?? false
  const monthlyCap = isPro ? PRO_MONTHLY_CAP : FREE_MONTHLY_CAP
  const model = isPro ? 'claude-sonnet-4-6' : 'claude-haiku-4-5'

  // ── 3. Hourly rate limit (all users) ──────────────────────────────────────
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: hourlyCount } = await db()
    .from('threads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo)

  if ((hourlyCount ?? 0) >= HOURLY_RATE_LIMIT) {
    return new Response(
      `Rate limit: you can generate up to ${HOURLY_RATE_LIMIT} threads per hour. Please wait a moment and try again.`,
      { status: 429 },
    )
  }

  // ── 4. Monthly cap ────────────────────────────────────────────────────────
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: monthlyCount } = await db()
    .from('threads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  if ((monthlyCount ?? 0) >= monthlyCap) {
    return new Response(
      isPro
        ? `Monthly limit reached (${PRO_MONTHLY_CAP} threads). Your quota resets on the 1st.`
        : `Free limit reached (${FREE_MONTHLY_CAP} threads/month). Upgrade to Pro for up to ${PRO_MONTHLY_CAP} threads.`,
      { status: 429 },
    )
  }

  // ── 5. Validate API key ───────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY is not set in .env.local', { status: 500 })
  }

  // ── 6. Parse body ─────────────────────────────────────────────────────────
  const { content, tone, length } = await req.json()
  if (!content?.trim()) {
    return new Response('Content is required', { status: 400 })
  }

  // ── 7. Stream generation ──────────────────────────────────────────────────
  const client = new Anthropic({ apiKey })

  const systemPrompt = SYSTEM_PROMPTS[tone] ?? SYSTEM_PROMPTS.informative
  const userPrompt = `${LENGTH_INSTRUCTIONS[length] ?? LENGTH_INSTRUCTIONS.medium}

Convert the following content into a Twitter/X thread:

${content}`

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        })

        stream.on('text', (text: string) => {
          controller.enqueue(encoder.encode(text))
        })

        await stream.finalMessage()
      } catch (err) {
        // Write the error into the stream instead of calling controller.error(),
        // which would cause ERR_EMPTY_RESPONSE on the client.
        const msg = err instanceof Error ? err.message : String(err)
        controller.enqueue(encoder.encode(ERROR_MARKER + msg))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
