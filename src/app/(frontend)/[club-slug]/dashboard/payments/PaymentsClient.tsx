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
  serviceTitle: string
  planType: 'monthly' | 'sessions'
  planTotal: number
  unitsInvoiced: number
  finalRate: number
  totalPlanValue: number
  totalPaid: number
  balance: number
  tenantId: string
}

interface Props {
  rows: EnrollmentRow[]
  selectedMonth: string  // YYYY-MM
  tenantId: string
}

export function PaymentsClient({ rows, selectedMonth, tenantId }: Props) {
  const router = useRouter()
  const [modalMemberId, setModalMemberId] = useState<string | null>(null)
  const [modalMemberName, setModalMemberName] = useState('')

  function changeMonth(delta: number) {
    const [y, m] = selectedMonth.split('-').map(Number) as [number, number]
    const d = new Date(y, m - 1 + delta, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`?month=${next}`)
  }

  const [y, m] = selectedMonth.split('-').map(Number) as [number, number]
  const monthLabel = `${MONTHS_GR[m - 1]} ${y}`

  const sessionRows = rows.filter((r) => r.planType === 'sessions')
  const monthlyRows = rows.filter((r) => r.planType === 'monthly')

  return (
    <>
      {modalMemberId && (
        <IssueReceiptModal
          memberId={modalMemberId}
          memberName={modalMemberName}
          tenantId={tenantId}
          onClose={() => setModalMemberId(null)}
          onSuccess={() => {
            setModalMemberId(null)
            router.refresh()
          }}
        />
      )}

      {/* Month selector (affects only monthly rows) */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
        >
          ‹
        </button>
        <span className="font-semibold text-slate-700 min-w-40 text-center">{monthLabel}</span>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
        >
          ›
        </button>
        <span className="text-xs text-slate-400 ml-2">φίλτρο μηνιαίων πλάνων</span>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Δεν υπάρχουν εγγραφές για αυτή την περίοδο.
        </div>
      ) : (
        <div className="space-y-8">
          {monthlyRows.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Μηνιαία Πλάνα</h3>
              <EnrollmentTable
                rows={monthlyRows}
                onIssueReceipt={(r) => { setModalMemberId(r.memberId); setModalMemberName(r.memberName) }}
              />
            </section>
          )}

          {sessionRows.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Πλάνα Συνεδριών</h3>
              <EnrollmentTable
                rows={sessionRows}
                onIssueReceipt={(r) => { setModalMemberId(r.memberId); setModalMemberName(r.memberName) }}
              />
            </section>
          )}
        </div>
      )}
    </>
  )
}

function EnrollmentTable({
  rows,
  onIssueReceipt,
}: {
  rows: EnrollmentRow[]
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
                <td className="px-5 py-3 font-medium text-slate-800">{r.memberName}</td>
                <td className="px-5 py-3 text-slate-600">{r.serviceTitle}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {r.planType === 'sessions'
                    ? `${r.unitsInvoiced}/${r.planTotal} συνεδρίες`
                    : `${r.unitsInvoiced}/${r.planTotal} μήνες`}
                </td>
                <td className="px-5 py-3 text-right text-slate-600">{r.totalPlanValue.toFixed(2)}€</td>
                <td className="px-5 py-3 text-right text-emerald-600 font-medium">{r.totalPaid.toFixed(2)}€</td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={`font-semibold ${
                      isComplete ? 'text-emerald-600' : r.balance > 0 ? 'text-red-500' : 'text-slate-400'
                    }`}
                  >
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
