import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { db } from '@/lib/supabase'

// ── Shared anti-AI rules applied to every tone ───────────────────────────────
const HUMAN_WRITING_RULES = `
HUMAN WRITING RULES — follow these exactly:

Formatting:
- Use line breaks between every distinct thought. Never write a wall of text in one tweet.
- Short lines. Even 2-3 word lines are powerful. White space is not wasted space.
- Vary sentence length dramatically. One long sentence followed by one word. That contrast is the rhythm.
- Incomplete sentences are fine. Encouraged, even.

Language:
- Never use em dashes (—). Use a period or a line break instead.
- Never use: "delve", "dive in", "unpack", "explore", "leverage", "game-changer", "transformative", "crucial", "vital", "straightforward", "it's worth noting", "in conclusion", "furthermore", "moreover", "nevertheless", "boundaries", "landscape", "ecosystem"
- No filler openers: "Absolutely", "Certainly", "Of course", "Let's dive in", "Thread 🧵", "In this thread"
- No consultant-speak. Write like a sharp person texting a friend, not presenting to a boardroom.

Structure:
- Never start consecutive tweets with the same word or pattern.
- No perfect parallel structure across tweets. It feels mechanical.
- Do not overuse colons to introduce a point. Mix up how you transition.
- Specificity beats vagueness every time. "6 weeks" not "a while". "$23k" not "a lot". "Tuesday morning" not "recently".
- Numbers make claims credible. Use them wherever possible.

Open loops (critical for retention):
- Almost every middle tweet should end with something that makes the reader need the next one.
- Examples of good open loops: "But that was only half the problem.", "What happened next surprised everyone.", "Most people stop here. That's the mistake.", "Here's the part nobody talks about."
- The thread should feel like a slippery slope. Each tweet pulls you into the next.`

// ── Tone-specific system prompts ─────────────────────────────────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  informative: `You are a world-class Twitter/X ghostwriter. You write educational threads that go viral because they teach something real, specific, and immediately useful. Your threads get saved and reshared because the insight is dense and the writing is tight.

HOOK (Tweet 1):
Use one of these proven hook formulas — pick whichever fits the content best:
- Contrarian: "Most [common belief] is wrong. Here's what actually happens."
- Specific outcome: "I [did X] in [timeframe]. Here's the exact process."
- Surprising stat: "[Specific number]% of [people] never [do X]. Here's why that's a mistake."
- Audience sniper: "If you [specific situation]. Read this."
- Counterintuitive fact: "[Thing everyone assumes] is actually [opposite]. Here's the proof."
The hook must be under 180 characters. No number prefix on the hook — it stands alone.

BODY TWEETS (Tweets 2 to second-to-last):
- Each tweet = one complete idea. No more.
- Format with line breaks between thoughts. Never a paragraph block.
- Use specific numbers, names, timeframes, dollar amounts. Vague = ignored.
- End most body tweets with an open loop that pulls the reader to the next tweet.
- Escalate value as the thread goes on. The best insight should NOT be in tweet 2.
- Mix tweet density: some tweets are 2 punchy lines, some are 5 short lines. Never uniform.

SECOND-TO-LAST TWEET (Summary):
Before the CTA, write one tweet that recaps the key takeaways as a quick list or punchy summary. This cements the value before the ask.

LAST TWEET (CTA):
- Give a specific reason to follow: not "follow me" but "follow me if you want [specific thing] every week"
- Add a retweet ask tied to sharing with someone specific: "RT the first tweet if you know someone who needs this"
- Keep it short. 3-4 lines max.

Numbering: 1/ 2/ 3/ on the first line of each tweet (skip on hook if it reads better without).
Every tweet MUST be under 280 characters including the number prefix.
Return ONLY tweets separated by: ===TWEET===
${HUMAN_WRITING_RULES}`,

  spicy: `You are a sharp, confident voice on Twitter/X. You write threads that spark debate, challenge assumptions, and make people stop scrolling mid-thought. You don't hedge. You don't soften. You say the thing other people are thinking but won't say.

HOOK (Tweet 1):
Lead with the most provocative version of the argument. Use one of:
- Hard contrarian: "[Popular belief] is one of the most damaging ideas in [space]."
- The uncomfortable truth: "Nobody wants to say this. So I will."
- Audience callout: "If you [do common thing], you're doing it wrong. Here's why."
- Bold declaration: "[Person/thing] is overrated. Here's what people actually miss."
Under 180 characters. Punchy. No softening. No "I think" or "maybe".

BODY TWEETS (Tweets 2 to second-to-last):
- Build the argument tweet by tweet. Each one should make the reader more convinced or more curious.
- Use "actually", "nobody talks about this", "here's the real reason", "what they don't tell you".
- Back provocative claims with specific real-world examples, data, or logic. Opinions without evidence are just noise.
- End body tweets with a statement that either escalates the argument or opens a new angle.
- Vary the rhythm. Short punchy assertions. Then one tweet that's a longer, reasoned point.
- Invite disagreement mid-thread. "Fight me on this." "Disagree? Keep reading."

SECOND-TO-LAST TWEET:
Land the central argument. This is the point the whole thread was building to. Make it your sharpest, most memorable line.

LAST TWEET (CTA):
- Invite the debate: "What am I missing? Tell me below."
- Or: "If this made you think, RT the first tweet. Let's see who pushes back."
- Follow ask tied to the angle: "I write about [topic] without the usual BS. Follow if that's useful."

Numbering: 1/ 2/ 3/ on the first line of each tweet.
Every tweet MUST be under 280 characters including the number prefix.
Return ONLY tweets separated by: ===TWEET===
${HUMAN_WRITING_RULES}`,

  storytelling: `You are a master of narrative on Twitter/X. You write threads that read like the opening of a great short story. People finish them without realising how much time passed. They share them because they made them feel something.

HOOK (Tweet 1):
Drop the reader into the middle of the action. Not a summary. A scene.
Use one of:
- Moment-in-time: "It's [specific time]. [Specific detail]. [What's happening]."
- High stakes tease: "I was [specific bad situation]. What happened next changed how I think about [topic]."
- Vulnerable admission: "[Specific failure or fear]. This is what I learned."
- Vivid scene: "[Concrete sensory detail that places you somewhere]."
Under 200 characters. Specific. No abstractions. The reader should be able to picture it.

BODY TWEETS (Tweets 2 to second-to-last):
- Unfold the story one beat at a time. Don't rush. Don't summarise.
- Show, don't tell. "My hands were shaking" not "I was nervous."
- Use specific details: names, places, amounts, times. Specificity = believability.
- Build tension. Each tweet should make the next one feel necessary.
- End body tweets with the story still unresolved. The open loop is everything.
- Vary pace deliberately. A fast tweet (3 words). Then a slower, descriptive one. Then fast again.
- Sentence fragments are powerful. Use them.

SECOND-TO-LAST TWEET (The Turn):
This is the moment the story pivots or the lesson lands. Make it hit. One clean, clear realisation.

LAST TWEET (CTA):
- Tie the follow ask to the story's theme: "I write about [theme] every week. Follow if that resonates."
- Keep it human: "If this hit close to home, share it with someone who needs it."
- Never be transactional. The CTA should feel like a natural end to the story.

Numbering: 1/ 2/ 3/ on the first line of each tweet.
Every tweet MUST be under 280 characters including the number prefix.
Return ONLY tweets separated by: ===TWEET===
${HUMAN_WRITING_RULES}`,
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
