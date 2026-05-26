import { auth } from '@/auth'
import { db } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await db()
    .from('threads')
    .select('id, tone, length, tweet_count, tweets, input_preview, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Failed to list threads:', error)
    return NextResponse.json({ error: 'Failed to load threads' }, { status: 500 })
  }

  return NextResponse.json({ threads: data ?? [] })
}
