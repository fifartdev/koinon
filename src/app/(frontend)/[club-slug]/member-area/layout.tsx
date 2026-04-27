import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import { NotificationBell } from '@/components/NotificationBell'
import { LogoutButton } from '@/components/LogoutButton'
import { InstallPWA } from '@/components/InstallPWA'

interface Props {
  children: React.ReactNode
  params: Promise<{ 'club-slug': string }>
}

const NAV = [
  { href: '', label: 'Αρχική', icon: '🏠' },
  { href: '/schedule', label: 'Πρόγραμμα', icon: '📅' },
  { href: '/receipts', label: 'Αποδείξεις', icon: '🧾' },
  { href: '/notifications', label: 'Ειδοποιήσεις', icon: '🔔' },
  { href: '/profile', label: 'Προφίλ', icon: '👤' },
]

export default async function MemberAreaLayout({ children, params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })

  if (!user) redirect(`/${slug}/login?redirect=member-area`)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href={`/${slug}`} className="font-bold text-indigo-600 text-base tracking-tight">
          Koinon
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell clubSlug={slug} />
          <LogoutButton slug={slug} className="text-xs text-slate-500 hover:text-slate-700" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="bg-white border-t border-slate-100 flex justify-around py-2 sticky bottom-0 z-40">
        {NAV.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={`/${slug}/member-area${href}`}
            className="flex flex-col items-center gap-0.5 px-4 py-1 text-slate-500 hover:text-indigo-600 transition"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      <InstallPWA />
    </div>
  )
}
