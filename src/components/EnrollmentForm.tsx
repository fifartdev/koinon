'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import type { Service, Enrollment } from '@/payload-types'

interface Props {
  memberId: string
  memberName: string
  tenantId: string
  slug: string
  services: Service[]
  enrollments: Enrollment[]
}

interface ServiceState {
  enrolled: boolean
  paymentStatus: 'paid' | 'unpaid'
  enrollmentId: string | null
}

export function EnrollmentForm({ memberId, memberName, tenantId, slug, services, enrollments }: Props) {
  const router = useRouter()

  // Build initial state from existing enrollments
  const initial: Record<string, ServiceState> = {}
  for (const svc of services) {
    const existing = enrollments.find((e) => String(typeof e.service === 'object' ? e.service.id : e.service) === String(svc.id))
    initial[String(svc.id)] = {
      enrolled: !!existing,
      paymentStatus: existing?.paymentStatus ?? 'unpaid',
      enrollmentId: existing ? String(existing.id) : null,
    }
  }

  const [state, setState] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleEnrolled(serviceId: string) {
    setState((prev) => ({
      ...prev,
      [serviceId]: { ...prev[serviceId]!, enrolled: !prev[serviceId]!.enrolled },
    }))
  }

  function togglePayment(serviceId: string) {
    setState((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId]!,
        paymentStatus: prev[serviceId]!.paymentStatus === 'paid' ? 'unpaid' : 'paid',
      },
    }))
  }

  async function handleSave() {
    setLoading(true)
    setError('')

    try {
      for (const svc of services) {
        const svcId = String(svc.id)
        const cur = state[svcId]!
        const orig = initial[svcId]!

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
        } else if (cur.enrolled && orig.enrolled && orig.enrollmentId && cur.paymentStatus !== orig.paymentStatus) {
          // Update payment status only
          const res = await fetch(`/api/enrollments/${orig.enrollmentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              paymentStatus: cur.paymentStatus,
              paidAt: cur.paymentStatus === 'paid' ? new Date().toISOString() : null,
            }),
          })
          if (!res.ok) throw new Error(`Σφάλμα ενημέρωσης πληρωμής "${svc.title}"`)
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
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {services.map((svc) => {
            const s = state[String(svc.id)]!
            return (
              <div key={svc.id} className={`flex items-center justify-between px-5 py-4 transition ${s.enrolled ? 'bg-indigo-50/40' : ''}`}>
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
                    {svc.fee != null && (
                      <span className="text-xs text-indigo-500 ml-2">{svc.fee}€/μήνα</span>
                    )}
                  </label>
                </div>

                {s.enrolled && (
                  <button
                    type="button"
                    onClick={() => togglePayment(String(svc.id))}
                    className={`text-xs font-semibold px-3 py-1 rounded-full transition ${
                      s.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    {s.paymentStatus === 'paid' ? 'Πληρωμένο' : 'Εκκρεμεί'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-4">
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
