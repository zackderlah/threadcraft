import NextAuth from 'next-auth'
import Twitter from 'next-auth/providers/twitter'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/supabase'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Twitter,
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        if (!email || !password) return null

        const { data: user } = await db()
          .from('users')
          .select('id, name, email, image, password_hash')
          .eq('email', email)
          .single()

        if (!user?.password_hash) return null

        const valid = await bcrypt.compare(password, user.password_hash as string)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
  adapter:
    SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? SupabaseAdapter({ url: SUPABASE_URL, secret: SUPABASE_SERVICE_ROLE_KEY })
      : undefined,
  // JWT strategy is required for the Credentials provider — database sessions
  // don't support credentials in Auth.js v5
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
