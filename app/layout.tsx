import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'

export const metadata: Metadata = {
  title: 'ThreadCraft — Turn any content into a viral X thread',
  description: 'Paste a blog post, newsletter, or raw idea. ThreadCraft transforms it into a crafted Twitter/X thread in seconds — powered by Claude AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextTopLoader
          color="#88C0D0"
          shadow="0 0 10px #88C0D0,0 0 5px #88C0D0"
          height={2}
          showSpinner={false}
        />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
