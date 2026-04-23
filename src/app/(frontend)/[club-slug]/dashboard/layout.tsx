import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import { NotificationBell } from '@/components/NotificationBell'
import { LogoutButton } from '@/components/LogoutButton'

interface Props {
  children: React.ReactNode
  params: Promise<{ 'club-slug': string }>
}

const NAV = [
  { href: '', label: 'Επισκόπηση', icon: '◉' },
  { href: '/members', label: 'Μέλη', icon: '👥' },
  { href: '/services', label: 'Υπηρεσίες', icon: '🗓' },
  { href: '/announcements', label: 'Ανακοινώσεις', icon: '📢' },
  { href: '/payments', label: 'Πληρωμές', icon: '💳' },
]

export default async function DashboardLayout({ children, params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers })

  if (!user) redirect(`/${slug}/login?redirect=dashboard`)

  const role = (user as { role?: string }).role
  if (!['master', 'superadmin', 'club-admin'].includes(role ?? '')) {
    redirect(`/${slug}/member-area`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <span className="font-bold text-indigo-600 text-lg tracking-tight">
            Koinon
          </span>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{slug}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={`/${slug}/dashboard${href}`}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition font-medium"
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between shrink-0">
          <h1 className="font-semibold text-slate-700 text-sm">Πίνακας Ελέγχου</h1>
          <div className="flex items-center gap-3">
            <NotificationBell clubSlug={slug} />
            <LogoutButton slug={slug} className="text-xs text-slate-500 hover:text-slate-700" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
