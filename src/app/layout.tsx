import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/components/providers/QueryProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PayzDesk',
  description: 'Professional payment agent management platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      {/*
        Body bg + text come from globals.css :root vars (--bg-page / --text-primary).
        Do NOT add bg-* or text-* Tailwind classes here — the CSS vars already handle it
        and adding Tailwind overrides breaks the theme system.
      */}
      <body className="min-h-full flex flex-col antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}