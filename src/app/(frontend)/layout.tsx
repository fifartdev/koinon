import React from 'react'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata = {
  title: 'Koinon — Club Management Platform',
  description:
    'Stop managing clubs with group chats. Koinon gives every club a dedicated space for members, schedules, payments, and announcements.',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Koinon',
  },
  openGraph: {
    title: 'Koinon — Club Management Platform',
    description: 'Stop managing clubs with group chats.',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full ${bricolage.variable} ${dmSans.variable}`}
    >
      <body className="h-full font-sans antialiased bg-[#07070f] text-white">
        {children}
      </body>
    </html>
  )
}
