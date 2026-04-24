'use client'

import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { computeRate, nextPeriodDescription, planIsComplete } from '@/lib/pricing'

interface EnrollmentData {
  id: number
  planType?: 'monthly' | 'sessions' | null
  planTotal?: number | null
  planStart?: string | null
  discountType?: 'none' | 'percent' | 'fixed' | null
  discountValue?: number | null
  service: {
    id: number
    title: string
    fee?: number | null
    sessionFee?: number | null
    pricingType?: 'monthly' | 'per-session' | null
  }
  member: {
    globalDiscountType?: 'none' | 'percent' | 'fixed' | null
    globalDiscountValue?: number | null
  }
}

interface LineState {
  selected: boolean
  description: string
  sessionsCount: number
  baseAmount: number
  discountAmount: number
  finalAmount: number
  // for recalculation
  unitRate: number
  discountFraction: number
  planType: 'monthly' | 'sessions'
  isComplete: boolean
  serviceTitle: string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Μετρητά',
  transfer: 'Τραπεζική Μεταφορά',
  card: 'Κάρτα',
  other: 'Άλλο',
}

interface Props {
  memberId: string
  memberName: string
  tenantId: string
  onClose: () => void
  onSuccess: () => void
}

export function IssueReceiptModal({ memberId, memberName, tenantId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [lineStates, setLineStates] = useState<Record<string, LineState>>({})
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [enrollRes, receiptRes] = await Promise.all([
        fetch(
          `/api/enrollments?where[member][equals]=${memberId}&where[tenant][equals]=${tenantId}&depth=2&limit=50`,
          { credentials: 'include' },
        ),
        fetch(
          `/api/receipts?where[member][equals]=${memberId}&limit=200&depth=1`,
          { credentials: 'include' },
        ),
      ])

      if (!enrollRes.ok) throw new Error('Αδυναμία φόρτωσης εγγραφών')
      const enrollData = (await enrollRes.json()) as { docs: EnrollmentData[] }
      const enrollments = enrollData.docs

      // Collect prior invoiced units per enrollment from receipts
      const invoiced: Record<string, number> = {}
      if (receiptRes.ok) {
        const receiptData = (await receiptRes.json()) as {
          docs: { lineItems?: { enrollment?: { id: number } | number | null; sessionsCount?: number | null }[] }[]
        }
        for (const receipt of receiptData.docs) {
          for (const line of receipt.lineItems ?? []) {
            const eId = String(
              typeof line.enrollment === 'object' && line.enrollment !== null
                ? line.enrollment.id
                : line.enrollment ?? '',
            )
            if (!eId) continue
            const match = enrollments.find((e) => String(e.id) === eId)
            const isSession = match?.planType === 'sessions'
            invoiced[eId] = (invoiced[eId] ?? 0) + (isSession ? (line.sessionsCount ?? 0) : 1)
          }
        }
      }

      // Build line states
      const states: Record<string, LineState> = {}
      for (const e of enrollments) {
        const eId = String(e.id)
        const planType: 'monthly' | 'sessions' =
          e.planType === 'sessions' ? 'sessions' : 'monthly'
        const planTotal = e.planTotal ?? 0
        const planStart = e.planStart ?? new Date().toISOString()
        const unitsInvoiced = invoiced[eId] ?? 0
        const isComplete = planIsComplete(planTotal, unitsInvoiced)

        const unitRate =
          planType === 'sessions'
            ? (e.service.sessionFee ?? 0)
            : (e.service.fee ?? 0)

        const { enrollmentDiscount, globalDiscount, finalRate } = computeRate(unitRate, e, e.member)
        const totalDiscountAmount = enrollmentDiscount + globalDiscount
        const discountFraction = unitRate > 0 ? totalDiscountAmount / unitRate : 0

        let sessionsCount = 0
        let description = ''
        let baseAmount = 0

        if (planType === 'sessions') {
          sessionsCount = Math.max(0, planTotal - unitsInvoiced)
          description = nextPeriodDescription('sessions', planStart, planTotal, unitsInvoiced)
          baseAmount = sessionsCount * unitRate
        } else {
          sessionsCount = 0
          description = nextPeriodDescription('monthly', planStart, planTotal, unitsInvoiced)
          baseAmount = unitRate
        }

        const discountAmount = Math.round(baseAmount * discountFraction * 100) / 100
        const finalAmount = Math.max(0, Math.round((baseAmount - discountAmount) * 100) / 100)

        states[eId] = {
          selected: !isComplete,
          description,
          sessionsCount,
          baseAmount,
          discountAmount,
          finalAmount,
          unitRate,
          discountFraction,
          planType,
          isComplete,
          serviceTitle: e.service.title,
        }
      }
      setLineStates(states)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα φόρτωσης')
    } finally {
      setLoading(false)
    }
  }, [memberId, tenantId])

  useEffect(() => { load() }, [load])

  function updateLine(eId: string, patch: Partial<LineState>) {
    setLineStates((prev) => ({ ...prev, [eId]: { ...prev[eId]!, ...patch } }))
  }

  function handleSessionsChange(eId: string, rawValue: string) {
    const sessions = Math.max(0, Number(rawValue) || 0)
    const s = lineStates[eId]!
    const newBase = Math.round(sessions * s.unitRate * 100) / 100
    const newDiscount = Math.round(newBase * s.discountFraction * 100) / 100
    const newFinal = Math.max(0, Math.round((newBase - newDiscount) * 100) / 100)
    updateLine(eId, {
      sessionsCount: sessions,
      description: `${sessions} συνεδρίες`,
      baseAmount: newBase,
      discountAmount: newDiscount,
      finalAmount: newFinal,
    })
  }

  function handleFinalAmountChange(eId: string, rawValue: string) {
    const val = Math.max(0, Number(rawValue) || 0)
    updateLine(eId, { finalAmount: val })
  }

  const selectedLines = Object.entries(lineStates).filter(([, s]) => s.selected)
  const totalAmount = Math.round(
    selectedLines.reduce((sum, [, s]) => sum + s.finalAmount, 0) * 100,
  ) / 100

  async function handleSave() {
    if (!receiptNumber.trim()) { setError('Συμπληρώστε τον αριθμό απόδειξης'); return }
    if (selectedLines.length === 0) { setError('Επιλέξτε τουλάχιστον μία υπηρεσία'); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        receiptNumber: receiptNumber.trim(),
        member: Number(memberId),
        tenant: Number(tenantId),
        issuedAt: new Date(issuedAt).toISOString(),
        paymentMethod,
        lineItems: selectedLines.map(([eId, s]) => ({
          enrollment: Number(eId),
          description: s.description,
          sessionsCount: s.planType === 'sessions' ? s.sessionsCount : undefined,
          baseAmount: s.baseAmount,
          discountAmount: s.discountAmount,
          finalAmount: s.finalAmount,
        })),
        totalAmount,
        notes: notes.trim() || undefined,
      }

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      if (!res.ok) {
        let msg = 'Σφάλμα αποθήκευσης'
        try { msg = ((await res.json()) as { errors?: { message: string }[] }).errors?.[0]?.message ?? msg } catch { /* */ }
        throw new Error(msg)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Έκδοση Απόδειξης</h2>
            <p className="text-xs text-slate-500 mt-0.5">{memberName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Φόρτωση…</div>
          ) : Object.keys(lineStates).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Δεν υπάρχουν ενεργές εγγραφές για αυτό το μέλος.
            </div>
          ) : (
            <>
              {/* Line items */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Υπηρεσίες</p>
                <div className="space-y-3">
                  {Object.entries(lineStates).map(([eId, s]) => (
                    <div
                      key={eId}
                      className={`rounded-xl border p-4 transition ${
                        s.isComplete
                          ? 'border-slate-100 bg-slate-50 opacity-50'
                          : s.selected
                          ? 'border-indigo-100 bg-indigo-50/30'
                          : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={s.selected}
                          disabled={s.isComplete}
                          onChange={() => updateLine(eId, { selected: !s.selected })}
                          className="mt-0.5 w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm">
                            {s.serviceTitle}
                            {s.isComplete && (
                              <span className="ml-2 text-xs text-slate-400">(Ολοκληρωμένο)</span>
                            )}
                          </p>

                          {s.selected && !s.isComplete && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              {/* Description */}
                              <div className="col-span-2">
                                <label className="block text-xs text-slate-500 mb-1">Περίοδος / Περιγραφή</label>
                                <input
                                  type="text"
                                  value={s.description}
                                  onChange={(e) => updateLine(eId, { description: e.target.value })}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>

                              {/* Sessions count — only for sessions plan */}
                              {s.planType === 'sessions' && (
                                <div>
                                  <label className="block text-xs text-slate-500 mb-1">Αριθμός Συνεδριών</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={s.sessionsCount}
                                    onChange={(e) => handleSessionsChange(eId, e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                  />
                                </div>
                              )}

                              {/* Amounts */}
                              <div className="col-span-2 grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-slate-50 rounded-lg px-3 py-2">
                                  <span className="text-slate-400 block">Βάση</span>
                                  <span className="font-semibold text-slate-700">{s.baseAmount.toFixed(2)}€</span>
                                </div>
                                <div className="bg-slate-50 rounded-lg px-3 py-2">
                                  <span className="text-slate-400 block">Έκπτωση</span>
                                  <span className="font-semibold text-red-500">−{s.discountAmount.toFixed(2)}€</span>
                                </div>
                                <div>
                                  <label className="block text-slate-500 mb-1">Τελικό (€)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={s.finalAmount}
                                    onChange={(e) => handleFinalAmountChange(eId, e.target.value)}
                                    className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm font-semibold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              {selectedLines.length > 0 && (
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white rounded-xl px-5 py-3 text-right">
                    <span className="text-xs opacity-75 block">Σύνολο</span>
                    <span className="text-xl font-bold">{totalAmount.toFixed(2)}€</span>
                  </div>
                </div>
              )}

              {/* Receipt meta */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Στοιχεία Απόδειξης</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Αριθμός Απόδειξης <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="π.χ. ΑΠΟ-2026-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Τρόπος Πληρωμής</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Ημερομηνία</label>
                  <input
                    type="date"
                    value={issuedAt}
                    onChange={(e) => setIssuedAt(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Σημειώσεις</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    placeholder="Προαιρετικές σημειώσεις…"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Άκυρο
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || selectedLines.length === 0}
            className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? 'Αποθήκευση…' : `Έκδοση Απόδειξης — ${totalAmount.toFixed(2)}€`}
          </button>
        </div>
      </div>
    </div>
  )
}
