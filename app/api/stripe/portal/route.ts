import Stripe from 'stripe'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/auth/signin', process.env.NEXTAUTH_URL!))
  }

  // Look up the Stripe customer by email
  const customers = await stripe.customers.list({
    email: session.user.email,
    limit: 1,
  })

  const customer = customers.data[0]

  if (!customer) {
    // Shouldn't happen for a Pro user, but handle gracefully
    return NextResponse.redirect(
      new URL('/generate?error=no-subscription', process.env.NEXTAUTH_URL!),
    )
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${process.env.NEXTAUTH_URL}/generate`,
  })

  return NextResponse.redirect(portalSession.url)
}
