import { auth } from '@/auth'
import { db } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { tweets, tone, length, inputPreview } = await req.json()

  const { error } = await db().from('threads').insert({
    user_id: session.user.id,
    tone,
    length,
    tweet_count: tweets.length,
    tweets,
    input_preview: inputPreview?.slice(0, 150) ?? null,
  })

  if (error) {
    console.error('Failed to save thread:', error)
    return new NextResponse('Failed to save thread', { status: 500 })
  }

  return new NextResponse('OK')
}
