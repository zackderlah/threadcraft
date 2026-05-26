import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/supabase'
import ThreadCraftApp from './ThreadCraftApp'

export default async function GeneratePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Fetch user's pro status and monthly usage in parallel
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [userResult, usageResult] = await Promise.all([
    db()
      .from('users')
      .select('is_pro')
      .eq('id', session.user.id)
      .single(),
    db()
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .gte('created_at', startOfMonth.toISOString()),
  ])

  const isPro: boolean = userResult.data?.is_pro ?? false

  return (
    <ThreadCraftApp
      initialUsage={usageResult.count ?? 0}
      isPro={isPro}
      userName={session.user.name ?? null}
      userImage={session.user.image ?? null}
      userEmail={session.user.email ?? null}
    />
  )
}
