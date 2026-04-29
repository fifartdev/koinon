'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { IssueReceiptModal } from '@/components/IssueReceiptModal'
import { MONTHS_GR } from '@/lib/pricing'

export interface EnrollmentRow {
  enrollmentId: string
  memberId: string
  memberName: string
  parentMemberId: string
  parentMemberName: string
  serviceTitle: string
  planType: 'monthly' | 'sessions'
  planTotal: number
  unitsInvoiced: number
  finalRate: number
  totalPlanValue: number
  totalPaid: number
  balance: number
  tenantId: string
  isDependent: boolean
  dependentId?: string
  dependentName?: string
  overdueMonths: number
  inSelectedMonth: boolean
  inNextMonth: boolean
}

export interface PaymentsKpis {
  expectedMonthly: number
  collectedMonthly: number
  outstandingMonthly: number
  nextMonthExpected: number
}

interface Props {
  monthlyRows: EnrollmentRow[]
  sessionRows: EnrollmentRow[]
  overdueRows: EnrollmentRow[]
  selectedMonth: string
  tenantId: string
  kpis: PaymentsKpis
}

type Tab = 'enrollment' | 'member'

interface ModalState {
  memberId: string
  memberName: string
  dependentIds: string[]
}

export function PaymentsClient({ monthlyRows, sessionRows, overdueRows, selectedMonth, tenantId, kpis }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalState | null>(null)
  const [tab, setTab] = useState<Tab>('enrollment')
  const [search, setSearch] = useState('')

  function changeMonth(delta: number) {
    const [y, m] = selectedMonth.split('-').map(Number) as [number, number]
    const d = new Date(y, m - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`?month=${next}`)
  }

  const [y, m] = selectedMonth.split('-').map(Number) as [number, number]
  const monthLabel = `${MONTHS_GR[m - 1]} ${y}`

  const q = search.trim().toLowerCase()
  const matchesSearch = (r: EnrollmentRow) =>
    !q || r.memberName.toLowerCase().includes(q) || r.parentMemberName.toLowerCase().includes(q)

  const filteredMonthly = monthlyRows.filter(matchesSearch)
  const filteredSessions = sessionRows.filter(matchesSearch)
  const filteredOverdue = overdueRows.filter(matchesSearch)

  const allRows = [...filteredMonthly, ...filteredSessions]

  function openModal(rows: EnrollmentRow[], parentMemberId: string, parentMemberName: string) {
    const depIds = [...new Set(
      rows
        .filter((r) => r.parentMemberId === parentMemberId && r.isDependent && r.dependentId)
        .map((r) => r.dependentId!),
    )]
    setModal({ memberId: parentMemberId, memberName: parentMemberName, dependentIds: depIds })
  }

  // ── Per-member grouping (uses filtered allRows) ────────────────────────
  const memberGroups = React.useMemo(() => {
    const map = new Map<string, { memberName: string; rows: EnrollmentRow[] }>()
    for (const r of allRows) {
      if (!map.has(r.parentMemberId)) {
        map.set(r.parentMemberId, { memberName: r.parentMemberName, rows: [] })
      }
      map.get(r.parentMemberId)!.rows.push(r)
    }
    return [...map.entries()]
      .map(([id, g]) => ({
        memberId: id,
        memberName: g.memberName,
        rows: g.rows,
        totalOwed: Math.round(g.rows.reduce((s, r) => s + r.totalPlanValue, 0) * 100) / 100,
        totalPaid: Math.round(g.rows.reduce((s, r) => s + r.totalPaid, 0) * 100) / 100,
        balance: Math.round(g.rows.reduce((s, r) => s + r.balance, 0) * 100) / 100,
      }))
      .sort((a, b) => {
        if (b.balance !== a.balance) return b.balance - a.balance
        return a.memberName.localeCompare(b.memberName)
      })
  }, [allRows])

  return (
    <>
      {modal && (
        <IssueReceiptModal
          memberId={modal.memberId}
          memberName={modal.memberName}
          tenantId={tenantId}
          dependentIds={modal.dependentIds}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); router.refresh() }}
        />
      )}

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Αναμένεται (μηνιαία)" value={kpis.expectedMonthly} color="slate" />
        <KpiCard label="Εισπράχθηκε" value={kpis.collectedMonthly} color="emerald" />
        <KpiCard label="Εκκρεμεί" value={kpis.outstandingMonthly} color={kpis.outstandingMonthly > 0 ? 'red' : 'emerald'} />
        <KpiCard label={`Επόμ. Μήνας`} value={kpis.nextMonthExpected} color="indigo" />
      </div>

      {/* Search + Month selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Αναζήτηση μέλους…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">‹</button>
          <span className="font-semibold text-slate-700 min-w-40 text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">›</button>
          <span className="text-xs text-slate-400">φίλτρο μηνιαίων πλάνων</span>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('enrollment')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === 'enrollment' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Ανά Εγγραφή
        </button>
        <button
          onClick={() => setTab('member')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === 'member' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Ανά Μέλος
        </button>
      </div>

      {allRows.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {q ? `Δεν βρέθηκαν μέλη για "${search}".` : 'Δεν υπάρχουν εγγραφές για αυτή την περίοδο.'}
        </div>
      ) : tab === 'enrollment' ? (
        <div className="space-y-8">
          {filteredMonthly.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Μηνιαία Πλάνα</h3>
              <EnrollmentTable
                rows={filteredMonthly}
                allRows={[...monthlyRows, ...sessionRows]}
                onIssueReceipt={(r) => openModal([...monthlyRows, ...sessionRows], r.parentMemberId, r.parentMemberName)}
              />
            </section>
          )}
          {filteredSessions.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Πλάνα Συνεδριών</h3>
              <EnrollmentTable
                rows={filteredSessions}
                allRows={[...monthlyRows, ...sessionRows]}
                onIssueReceipt={(r) => openModal([...monthlyRows, ...sessionRows], r.parentMemberId, r.parentMemberName)}
              />
            </section>
          )}
        </div>
      ) : (
        <MemberGroupTable groups={memberGroups} allRows={[...monthlyRows, ...sessionRows]} onIssueReceipt={openModal} />
      )}

      {/* Overdue section */}
      {filteredOverdue.length > 0 && (
        <section className="mt-10">
          <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span>Ανεξόφλητα Προηγούμενα Μήνες</span>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{filteredOverdue.length}</span>
          </h3>
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-50 bg-red-50/50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">Μέλος</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">Υπηρεσία</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500">Εκκρεμείς Μήνες</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-500">Υπόλοιπο</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOverdue.map((r) => (
                  <tr key={r.enrollmentId} className="hover:bg-red-50/30">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {r.memberName}
                      {r.isDependent && (
                        <span className="ml-1.5 text-xs text-indigo-500">(τέκνο)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.serviceTitle}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        {r.overdueMonths} μήν. εκκρεμείς
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-red-600">{r.balance.toFixed(2)}€</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openModal([...monthlyRows, ...sessionRows], r.parentMemberId, r.parentMemberName)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition whitespace-nowrap"
                      >
                        + Απόδειξη
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: 'slate' | 'emerald' | 'red' | 'indigo' }) {
  const colors = {
    slate: 'bg-slate-50 border-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value.toFixed(2)}€</p>
    </div>
  )
}

function EnrollmentTable({
  rows,
  allRows,
  onIssueReceipt,
}: {
  rows: EnrollmentRow[]
  allRows: EnrollmentRow[]
  onIssueReceipt: (r: EnrollmentRow) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left px-5 py-3 font-semibold text-slate-500">Μέλος</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-500">Υπηρεσία</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-500">Πλάνο</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-500">Αξία</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-500">Πληρωμένο</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-500">Υπόλοιπο</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r) => {
            const isComplete = r.planTotal > 0 && r.balance <= 0
            return (
              <tr key={r.enrollmentId} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">
                  {r.memberName}
                  {r.isDependent && (
                    <span className="ml-1.5 text-xs text-indigo-500">(τέκνο)</span>
                  )}
                  {r.overdueMonths > 0 && (
                    <span className="ml-1.5 text-xs text-red-500 font-normal">⚠ {r.overdueMonths}μ. εκκρ.</span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-600">{r.serviceTitle}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {r.planType === 'sessions'
                    ? `${r.unitsInvoiced}/${r.planTotal} συνεδρίες`
                    : `${r.unitsInvoiced}/${r.planTotal} μήνες`}
                </td>
                <td className="px-5 py-3 text-right text-slate-600">{r.totalPlanValue.toFixed(2)}€</td>
                <td className="px-5 py-3 text-right text-emerald-600 font-medium">{r.totalPaid.toFixed(2)}€</td>
                <td className="px-5 py-3 text-right">
                  <span className={`font-semibold ${isComplete ? 'text-emerald-600' : r.balance > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {isComplete ? '✓ Εξοφλήθη' : `${r.balance.toFixed(2)}€`}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onIssueReceipt(r)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition whitespace-nowrap"
                  >
                    + Απόδειξη
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MemberGroupTable({
  groups,
  allRows,
  onIssueReceipt,
}: {
  groups: { memberId: string; memberName: string; rows: EnrollmentRow[]; totalOwed: number; totalPaid: number; balance: number }[]
  allRows: EnrollmentRow[]
  onIssueReceipt: (rows: EnrollmentRow[], parentMemberId: string, parentMemberName: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left px-5 py-3 font-semibold text-slate-500">Μέλος</th>
            <th className="text-left px-5 py-3 font-semibold text-slate-500">Εγγραφές</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-500">Σύνολο Πλάνων</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-500">Πληρωμένο</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-500">Υπόλοιπο</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const isOpen = expanded.has(g.memberId)
            const isSettled = g.balance <= 0
            const hasOverdue = g.rows.some((r) => r.overdueMonths > 0)
            const hasChildren = g.rows.some((r) => r.isDependent)
            return (
              <React.Fragment key={g.memberId}>
                <tr
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggle(g.memberId)}
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    <span className="mr-2 text-slate-300 text-xs">{isOpen ? '▾' : '▸'}</span>
                    {g.memberName}
                    {hasChildren && <span className="ml-1.5 text-xs text-slate-400">+τέκνα</span>}
                    {hasOverdue && <span className="ml-1.5 text-xs text-red-500">⚠</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{g.rows.length} εγγρ.</td>
                  <td className="px-5 py-3 text-right text-slate-600">{g.totalOwed.toFixed(2)}€</td>
                  <td className="px-5 py-3 text-right text-emerald-600 font-medium">{g.totalPaid.toFixed(2)}€</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold ${isSettled ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isSettled ? '✓ Εξοφλήθη' : `${g.balance.toFixed(2)}€`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onIssueReceipt(allRows, g.memberId, g.memberName)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition whitespace-nowrap"
                    >
                      + Απόδειξη
                    </button>
                  </td>
                </tr>
                {isOpen &&
                  g.rows.map((r) => (
                    <tr key={r.enrollmentId} className="border-b border-slate-50 bg-slate-50/40">
                      <td className="px-5 py-2 text-slate-600 pl-10 text-xs">
                        {r.isDependent ? (
                          <span className="text-indigo-500">↳ {r.memberName} (τέκνο)</span>
                        ) : (
                          <span className="text-slate-400">↳ {r.memberName}</span>
                        )}
                      </td>
                      <td className="px-5 py-2 text-slate-500 text-xs">{r.serviceTitle}</td>
                      <td className="px-5 py-2 text-right text-slate-500 text-xs">{r.totalPlanValue.toFixed(2)}€</td>
                      <td className="px-5 py-2 text-right text-emerald-600 text-xs">{r.totalPaid.toFixed(2)}€</td>
                      <td className="px-5 py-2 text-right text-xs">
                        <span className={r.balance > 0 ? 'text-red-500 font-semibold' : 'text-emerald-600'}>
                          {r.balance > 0 ? `${r.balance.toFixed(2)}€` : '✓'}
                        </span>
                      </td>
                      <td />
                    </tr>
                  ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
