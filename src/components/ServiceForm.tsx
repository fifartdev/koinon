'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import type { Service } from '@/payload-types'

const DAYS = [
  { value: 'Monday', label: 'Δευτέρα' },
  { value: 'Tuesday', label: 'Τρίτη' },
  { value: 'Wednesday', label: 'Τετάρτη' },
  { value: 'Thursday', label: 'Πέμπτη' },
  { value: 'Friday', label: 'Παρασκευή' },
  { value: 'Saturday', label: 'Σάββατο' },
  { value: 'Sunday', label: 'Κυριακή' },
]

interface Slot {
  day: string
  startTime: string
  endTime: string
  location: string
}

interface Props {
  tenantId: string
  slug: string
  service?: Service
}

export function ServiceForm({ tenantId, slug, service }: Props) {
  const router = useRouter()
  const isEdit = !!service

  const svc = service as (typeof service & { pricingType?: string; sessionFee?: number | null }) | undefined
  const [title, setTitle] = useState(svc?.title ?? '')
  const [tutor, setTutor] = useState(svc?.tutor ?? '')
  const [pricingType, setPricingType] = useState<'monthly' | 'per-session'>(
    (svc?.pricingType as 'monthly' | 'per-session') ?? 'monthly',
  )
  const [fee, setFee] = useState(svc?.fee != null ? String(svc.fee) : '')
  const [sessionFee, setSessionFee] = useState(svc?.sessionFee != null ? String(svc.sessionFee) : '')
  const [isActive, setIsActive] = useState(svc?.isActive ?? true)
  const [slots, setSlots] = useState<Slot[]>(
    service?.weeklySchedule?.map((s) => ({
      day: s.day ?? 'Monday',
      startTime: s.startTime ?? '',
      endTime: s.endTime ?? '',
      location: s.location ?? '',
    })) ?? [],
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function addSlot() {
    setSlots((prev) => [...prev, { day: 'Monday', startTime: '', endTime: '', location: '' }])
  }

  function removeSlot(i: number) {
    setSlots((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateSlot(i: number, field: keyof Slot, value: string) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const body = {
      title,
      tutor: tutor || undefined,
      pricingType,
      fee: pricingType === 'monthly' && fee !== '' ? Number(fee) : undefined,
      sessionFee: pricingType === 'per-session' && sessionFee !== '' ? Number(sessionFee) : undefined,
      isActive,
      tenant: Number(tenantId),
      weeklySchedule: slots.map((s) => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        location: s.location || undefined,
      })),
    }

    try {
      const url = isEdit ? `/api/services/${service!.id}` : '/api/services'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      if (!res.ok) {
        const data = (await res.json()) as { errors?: { message: string }[]; message?: string }
        const msg = data.errors?.[0]?.message ?? data.message ?? 'Σφάλμα αποθήκευσης'
        throw new Error(msg)
      }

      router.push(`/${slug}/dashboard/services`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Βασικές Πληροφορίες</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Τίτλος <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="π.χ. Τμήμα Ενηλίκων"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Εκπαιδευτής</label>
          <input
            type="text"
            value={tutor}
            onChange={(e) => setTutor(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Όνομα εκπαιδευτή"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span className="text-sm font-medium text-slate-700">Ενεργή υπηρεσία</span>
        </label>
      </div>

      {/* Billing */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm">Χρέωση</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Τύπος Χρέωσης</label>
          <select
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value as 'monthly' | 'per-session')}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="monthly">Μηνιαίο</option>
            <option value="per-session">Ανά Συνεδρία</option>
          </select>
        </div>

        {pricingType === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Μηνιαίο Τέλος (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        )}

        {pricingType === 'per-session' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Τέλος ανά Συνεδρία (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sessionFee}
              onChange={(e) => setSessionFee(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        )}
      </div>

      {/* Weekly schedule */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 text-sm">Εβδομαδιαίο Πρόγραμμα</h3>
          <button
            type="button"
            onClick={addSlot}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            + Προσθήκη Ώρας
          </button>
        </div>

        {slots.length === 0 && (
          <p className="text-sm text-slate-400">Δεν έχει οριστεί πρόγραμμα ακόμα.</p>
        )}

        <div className="space-y-3">
          {slots.map((slot, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
              <div>
                {i === 0 && <label className="block text-xs text-slate-500 mb-1">Ημέρα</label>}
                <select
                  value={slot.day}
                  onChange={(e) => updateSlot(i, 'day', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                {i === 0 && <label className="block text-xs text-slate-500 mb-1">Έναρξη</label>}
                <input
                  type="time"
                  required
                  value={slot.startTime}
                  onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                {i === 0 && <label className="block text-xs text-slate-500 mb-1">Λήξη</label>}
                <input
                  type="time"
                  required
                  value={slot.endTime}
                  onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                {i === 0 && <label className="block text-xs text-slate-500 mb-1">Χώρος</label>}
                <input
                  type="text"
                  value={slot.location}
                  onChange={(e) => updateSlot(i, 'location', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="π.χ. Αίθουσα Α"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSlot(i)}
                className="text-slate-300 hover:text-red-400 transition pb-0.5 text-lg leading-none"
                title="Αφαίρεση"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Αποθήκευση…' : isEdit ? 'Αποθήκευση Αλλαγών' : 'Δημιουργία Υπηρεσίας'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${slug}/dashboard/services`)}
          className="text-sm text-slate-500 hover:text-slate-700 transition"
        >
          Άκυρο
        </button>
      </div>
    </form>
  )
}
