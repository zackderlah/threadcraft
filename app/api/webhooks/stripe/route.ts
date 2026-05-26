import Stripe from 'stripe'
import { db } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Stripe requires the raw body to verify webhook signatures —
// disable Next.js body parsing for this route.
export const config = { api: { bodyParser: false } }

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook Error: ${err}`, { status: 400 })
  }

  // ── Payment succeeded → upgrade user ──────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email?.toLowerCase()

    if (email) {
      const { error } = await db()
        .from('users')
        .update({ is_pro: true })
        .eq('email', email)

      if (error) console.error('Failed to upgrade user:', error)
      else console.log('Upgraded user to Pro:', email)
    }
  }

  // ── Subscription cancelled → downgrade user ───────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customer = await stripe.customers.retrieve(subscription.customer as string)

    if (!customer.deleted && customer.email) {
      const { error } = await db()
        .from('users')
        .update({ is_pro: false })
        .eq('email', customer.email.toLowerCase())

      if (error) console.error('Failed to downgrade user:', error)
      else console.log('Downgraded user from Pro:', customer.email)
    }
  }

  return new Response('ok', { status: 200 })
}
