'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import React from 'react'
import { MemberActions } from './MemberActions'

export interface DependentRow {
  id: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
}

export interface MemberRow {
  id: string
  firstName: string
  lastName: string
  email: string
  mobile?: string | null
  landline?: string | null
  hasUnpaidBalance: boolean
  enrolledServiceIds: string[]
  dependents: DependentRow[]
}

interface Props {
  members: MemberRow[]
  services: { id: string; title: string }[]
  slug: string
}

export function MembersClient({ members, services, slug }: Props) {
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return members.filter((m) => {
      if (q) {
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase()
        const mobile = (m.mobile ?? '').toLowerCase()
        const landline = (m.landline ?? '').toLowerCase()
        const email = m.email.toLowerCase()
        if (
          !fullName.includes(q) &&
          !email.includes(q) &&
          !mobile.includes(q) &&
          !landline.includes(q)
        )
          return false
      }
      if (serviceFilter !== 'all' && !m.enrolledServiceIds.includes(serviceFilter)) return false
      if (statusFilter === 'unpaid' && !m.hasUnpaidBalance) return false
      if (statusFilter === 'paid' && m.hasUnpaidBalance) return false
      return true
    })
  }, [members, search, serviceFilter, statusFilter])

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Αναζήτηση ονόματος, email, τηλ…"
          className="flex-1 min-w-52 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">Όλες οι Υπηρεσίες</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unpaid' | 'paid')}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">Όλες Καταστάσεις</option>
          <option value="unpaid">Ανεξόφλητα</option>
          <option value="paid">Εξοφλημένα</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">Δεν βρέθηκαν μέλη.</p>
          {members.length > 0 && (
            <p className="text-sm mt-1">Δοκιμάστε διαφορετικά κριτήρια αναζήτησης.</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/${slug}/dashboard/members/${m.id}`}
                      className="font-semibold text-slate-800 hover:text-indigo-600 transition truncate block"
                    >
                      {m.firstName} {m.lastName}
                    </Link>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{m.email}</p>
                    {(m.mobile || m.landline) && (
                      <p className="text-xs text-slate-400 mt-0.5">{m.mobile || m.landline}</p>
                    )}
                  </div>
                  {m.hasUnpaidBalance ? (
                    <span className="shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Ανεξόφλητο
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Εξοφλημένο
                    </span>
                  )}
                </div>

                {m.dependents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.dependents.map((dep) => (
                      <div key={dep.id} className="flex items-center justify-between pl-3 border-l-2 border-slate-100">
                        <span className="text-xs text-slate-500">
                          {dep.firstName} {dep.lastName}
                          <span className="ml-1 text-slate-300">τέκνο</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${slug}/dashboard/dependents/${dep.id}/enrollments`}
                            className="text-xs text-indigo-600 font-medium"
                          >
                            Εγγραφές
                          </Link>
                          <DeleteDependentButton depId={dep.id} depName={`${dep.firstName} ${dep.lastName}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                  <Link
                    href={`/${slug}/dashboard/members/${m.id}/enrollments`}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                  >
                    Εγγραφές
                  </Link>
                  <Link
                    href={`/${slug}/dashboard/members/${m.id}/add-child`}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 transition"
                  >
                    + Παιδί
                  </Link>
                  <div className="ml-auto">
                    <MemberActions
                      userId={m.id}
                      memberName={`${m.firstName} ${m.lastName}`.trim() || m.email}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">Όνομα</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">Κατάσταση</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">Εγγραφές</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((m) => (
                  <React.Fragment key={m.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        <Link
                          href={`/${slug}/dashboard/members/${m.id}`}
                          className="hover:text-indigo-600 transition"
                        >
                          {m.firstName} {m.lastName}
                        </Link>
                        {m.dependents.length > 0 && (
                          <span className="ml-2 text-xs text-slate-400 font-normal">
                            +{m.dependents.length} τέκν.
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{m.email}</td>
                      <td className="px-5 py-3">
                        {m.hasUnpaidBalance ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            Ανεξόφλητο
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Εξοφλημένο
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/${slug}/dashboard/members/${m.id}/enrollments`}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                          >
                            Εγγραφές
                          </Link>
                          <Link
                            href={`/${slug}/dashboard/members/${m.id}/add-child`}
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 transition"
                          >
                            + Παιδί
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <MemberActions
                          userId={m.id}
                          memberName={`${m.firstName} ${m.lastName}`.trim() || m.email}
                        />
                      </td>
                    </tr>
                    {m.dependents.map((dep) => (
                      <tr key={`dep-${dep.id}`} className="bg-slate-50/60 hover:bg-slate-50">
                        <td className="px-5 py-2 text-slate-600">
                          <span className="pl-5 flex items-center gap-2 text-sm">
                            <span className="text-slate-300">└</span>
                            <span className="font-medium">{dep.firstName} {dep.lastName}</span>
                            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">τέκνο</span>
                          </span>
                        </td>
                        <td className="px-5 py-2 text-slate-400 text-xs">
                          {dep.dateOfBirth ? new Date(dep.dateOfBirth).toLocaleDateString('el-GR') : '—'}
                        </td>
                        <td className="px-5 py-2" />
                        <td className="px-5 py-2">
                          <Link
                            href={`/${slug}/dashboard/dependents/${dep.id}/enrollments`}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                          >
                            Εγγραφές
                          </Link>
                        </td>
                        <td className="px-5 py-2">
                          <DeleteDependentButton depId={dep.id} depName={`${dep.firstName} ${dep.lastName}`} />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-right">
          {filtered.length} από {members.length} μέλη
        </p>
      )}
    </>
  )
}

function DeleteDependentButton({ depId, depName }: { depId: string; depName: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch('/api/delete-dependent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependentId: depId }),
        credentials: 'include',
      })
      if (res.ok) {
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  if (confirm) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-red-600 font-semibold hover:text-red-800"
        >
          {loading ? '…' : 'Επιβεβαίωση'}
        </button>
        <button onClick={() => setConfirm(false)} className="text-slate-400 hover:text-slate-600">
          Άκυρο
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-slate-400 hover:text-red-500 transition"
      title={`Διαγραφή ${depName}`}
    >
      Διαγραφή
    </button>
  )
}
