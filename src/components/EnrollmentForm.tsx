'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'

// Extended types for new fields (generated types update after generate:types)
interface ExtService {
  id: number | string
  title: string
  tutor?: string | null
  fee?: number | null
  sessionFee?: number | null
  pricingType?: 'monthly' | 'per-session' | null
}

interface ExtEnrollment {
  id: number | string
  service: number | string | { id: number | string }
  paymentStatus?: 'paid' | 'unpaid'
  planType?: 'monthly' | 'sessions' | null
  planTotal?: number | null
  planStart?: string | null
  discountType?: 'none' | 'percent' | 'fixed' | null
  discountValue?: number | null
  discountNote?: string | null
}

interface Props {
  memberId: string
  memberName: string
  tenantId: string
  slug: string
  services: ExtService[]
  enrollments: ExtEnrollment[]
}

interface ServiceState {
  enrolled: boolean
  paymentStatus: 'paid' | 'unpaid'
  enrollmentId: string | null
  // Plan
  planType: 'monthly' | 'sessions'
  planTotal: string
  planStart: string
  // Discount
  discountType: 'none' | 'percent' | 'fixed'
  discountValue: string
  discountNote: string
  // UI
  planOpen: boolean
}

export function EnrollmentForm({ memberId, memberName, tenantId, slug, services, enrollments }: Props) {
  const router = useRouter()

  const initial: Record<string, ServiceState> = {}
  for (const svc of services) {
    const existing = enrollments.find(
      (e) => String(typeof e.service === 'object' ? e.service.id : e.service) === String(svc.id),
    )
    const defaultPlanType: 'monthly' | 'sessions' =
      svc.pricingType === 'per-session' ? 'sessions' : 'monthly'

    initial[String(svc.id)] = {
      enrolled: !!existing,
      paymentStatus: existing?.paymentStatus ?? 'unpaid',
      enrollmentId: existing ? String(existing.id) : null,
      planType: (existing?.planType as 'monthly' | 'sessions') ?? defaultPlanType,
      planTotal: existing?.planTotal != null ? String(existing.planTotal) : '',
      planStart: existing?.planStart ? existing.planStart.slice(0, 10) : '',
      discountType: (existing?.discountType as 'none' | 'percent' | 'fixed') ?? 'none',
      discountValue: existing?.discountValue != null ? String(existing.discountValue) : '',
      discountNote: existing?.discountNote ?? '',
      planOpen: false,
    }
  }

  const [state, setState] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(serviceId: string, patch: Partial<ServiceState>) {
    setState((prev) => ({ ...prev, [serviceId]: { ...prev[serviceId]!, ...patch } }))
  }

  function toggleEnrolled(serviceId: string) {
    setState((prev) => {
      const cur = prev[serviceId]!
      return {
        ...prev,
        [serviceId]: {
          ...cur,
          enrolled: !cur.enrolled,
          planOpen: !cur.enrolled, // open plan section when enrolling
        },
      }
    })
  }

  async function handleSave() {
    setLoading(true)
    setError('')

    try {
      for (const svc of services) {
        const svcId = String(svc.id)
        const cur = state[svcId]!
        const orig = initial[svcId]!

        const planFields = {
          planType: cur.planType,
          planTotal: cur.planTotal !== '' ? Number(cur.planTotal) : null,
          planStart: cur.planStart ? new Date(cur.planStart).toISOString() : null,
          discountType: cur.discountType,
          discountValue: cur.discountValue !== '' ? Number(cur.discountValue) : null,
          discountNote: cur.discountNote || null,
        }

        if (cur.enrolled && !orig.enrolled) {
          // New enrollment
          const res = await fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              member: Number(memberId),
              service: Number(svcId),
              tenant: Number(tenantId),
              paymentStatus: cur.paymentStatus,
              enrolledAt: new Date().toISOString(),
              ...planFields,
            }),
          })
          if (!res.ok) {
            let msg = `Σφάλμα εγγραφής στην υπηρεσία "${svc.title}"`
            try { msg = ((await res.json()) as { errors?: { message: string }[] }).errors?.[0]?.message ?? msg } catch { /* */ }
            throw new Error(msg)
          }
        } else if (!cur.enrolled && orig.enrolled && orig.enrollmentId) {
          // Remove enrollment
          const res = await fetch(`/api/enrollments/${orig.enrollmentId}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (!res.ok) throw new Error(`Σφάλμα διαγραφής εγγραφής "${svc.title}"`)
        } else if (cur.enrolled && orig.enrolled && orig.enrollmentId) {
          // Check if anything changed
          const changed =
            cur.paymentStatus !== orig.paymentStatus ||
            cur.planType !== orig.planType ||
            cur.planTotal !== orig.planTotal ||
            cur.planStart !== orig.planStart ||
            cur.discountType !== orig.discountType ||
            cur.discountValue !== orig.discountValue ||
            cur.discountNote !== orig.discountNote

          if (changed) {
            const res = await fetch(`/api/enrollments/${orig.enrollmentId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                paymentStatus: cur.paymentStatus,
                paidAt: cur.paymentStatus === 'paid' ? new Date().toISOString() : null,
                ...planFields,
              }),
            })
            if (!res.ok) throw new Error(`Σφάλμα ενημέρωσης εγγραφής "${svc.title}"`)
          }
        }
      }

      router.push(`/${slug}/dashboard/members`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης')
    } finally {
      setLoading(false)
    }
  }

  const enrolledCount = Object.values(state).filter((s) => s.enrolled).length

  return (
    <div className="max-w-2xl space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
          {error}
        </div>
      )}

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
          <p>Δεν υπάρχουν ενεργές υπηρεσίες.</p>
          <p className="text-sm mt-1">Δημιουργήστε πρώτα μια υπηρεσία από την ενότητα Υπηρεσίες.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => {
            const s = state[String(svc.id)]!
            const rateLabel = svc.pricingType === 'per-session'
              ? `${svc.sessionFee ?? 0}€/συνεδρία`
              : `${svc.fee ?? 0}€/μήνα`

            return (
              <div
                key={svc.id}
                className={`bg-white rounded-2xl border transition ${s.enrolled ? 'border-indigo-100' : 'border-slate-100'}`}
              >
                {/* Main row */}
                <div className={`flex items-center justify-between px-5 py-4 ${s.enrolled ? 'bg-indigo-50/40' : ''} rounded-2xl`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`svc-${svc.id}`}
                      checked={s.enrolled}
                      onChange={() => toggleEnrolled(String(svc.id))}
                      className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor={`svc-${svc.id}`} className="cursor-pointer">
                      <span className="font-medium text-slate-800 text-sm">{svc.title}</span>
                      {svc.tutor && (
                        <span className="text-xs text-slate-400 ml-2">{svc.tutor}</span>
                      )}
                      <span className="text-xs text-indigo-500 ml-2">{rateLabel}</span>
                    </label>
                  </div>

                  {s.enrolled && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = s.paymentStatus === 'paid' ? 'unpaid' : 'paid'
                          update(String(svc.id), { paymentStatus: next })
                        }}
                        className={`text-xs font-semibold px-3 py-1 rounded-full transition ${
                          s.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {s.paymentStatus === 'paid' ? 'Πληρωμένο' : 'Εκκρεμεί'}
                      </button>
                      <button
                        type="button"
                        onClick={() => update(String(svc.id), { planOpen: !s.planOpen })}
                        className="text-xs text-slate-400 hover:text-indigo-600 transition px-2 py-1 rounded-lg hover:bg-indigo-50"
                        title="Πλάνο & Έκπτωση"
                      >
                        {s.planOpen ? '▲ Πλάνο' : '▼ Πλάνο'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded plan + discount section */}
                {s.enrolled && s.planOpen && (
                  <div className="border-t border-indigo-50 px-5 py-4 space-y-4 bg-white rounded-b-2xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Πλάνο & Έκπτωση</p>

                    {/* Plan fields */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Τύπος Πλάνου</label>
                        <select
                          value={s.planType}
                          onChange={(e) => update(String(svc.id), { planType: e.target.value as 'monthly' | 'sessions' })}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <option value="monthly">Μηνιαίο</option>
                          <option value="sessions">Συνεδρίες</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          {s.planType === 'sessions' ? 'Σύνολο Συνεδριών' : 'Σύνολο Μηνών'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={s.planTotal}
                          onChange={(e) => update(String(svc.id), { planTotal: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          placeholder={s.planType === 'sessions' ? 'π.χ. 20' : 'π.χ. 6'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Έναρξη Πλάνου</label>
                        <input
                          type="date"
                          value={s.planStart}
                          onChange={(e) => update(String(svc.id), { planStart: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                    </div>

                    {/* Discount fields */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Έκπτωση</label>
                        <select
                          value={s.discountType}
                          onChange={(e) => update(String(svc.id), { discountType: e.target.value as 'none' | 'percent' | 'fixed' })}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                          <option value="none">Καμία</option>
                          <option value="percent">Ποσοστό (%)</option>
                          <option value="fixed">Ποσό (€)</option>
                        </select>
                      </div>
                      {s.discountType !== 'none' && (
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            {s.discountType === 'percent' ? 'Ποσοστό (%)' : 'Ποσό (€)'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={s.discountValue}
                            onChange={(e) => update(String(svc.id), { discountValue: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="0"
                          />
                        </div>
                      )}
                      {s.discountType !== 'none' && (
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Αιτιολογία</label>
                          <input
                            type="text"
                            value={s.discountNote}
                            onChange={(e) => update(String(svc.id), { discountNote: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="π.χ. Οικογενειακή έκπτωση"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || services.length === 0}
          className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Αποθήκευση…' : `Αποθήκευση (${enrolledCount} υπηρεσίες)`}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${slug}/dashboard/members`)}
          className="text-sm text-slate-500 hover:text-slate-700 transition"
        >
          Άκυρο
        </button>
      </div>
    </div>
  )
}
