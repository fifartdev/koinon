import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import { SuperadminLogoutButton } from '@/components/SuperadminLogoutButton'

interface Props {
  children: React.ReactNode
}

const NAV = [
  { href: '/superadmin', label: 'Επισκόπηση', icon: '◉', exact: true },
  { href: '/superadmin/clubs', label: 'Σύλλογοι', icon: '🏛' },
  { href: '/superadmin/club-admins', label: 'Διαχειριστές', icon: '👤' },
]

export default async function SuperadminLayout({ children }: Props) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/superadmin/login')
  if ((user as { role?: string }).role !== 'superadmin') redirect('/superadmin/login')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-100 shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <span className="font-bold text-indigo-600 text-lg tracking-tight">Koinon</span>
          <p className="text-xs text-slate-400 mt-0.5">Superadmin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition font-medium"
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 space-y-1">
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
          <SuperadminLogoutButton className="text-xs text-slate-500 hover:text-red-600 transition" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-600 text-base md:hidden tracking-tight">Koinon</span>
            <span className="text-slate-300 md:hidden">·</span>
            <span className="text-slate-500 text-xs md:hidden">Superadmin</span>
            <span className="hidden md:block font-semibold text-slate-700 text-sm">Superadmin Panel</span>
          </div>
          <SuperadminLogoutButton className="md:hidden text-xs text-slate-500 hover:text-red-600 transition" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex z-50">
        {NAV.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-slate-500 hover:text-indigo-600 active:text-indigo-700 transition"
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[9px] font-medium leading-none">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
