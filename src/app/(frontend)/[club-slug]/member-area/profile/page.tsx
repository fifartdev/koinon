'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

interface ProfileData {
  id: number
  firstName: string
  lastName: string
  email: string
  mobile?: string | null
  landline?: string | null
  homeAddress?: string | null
  globalDiscountType?: string | null
  globalDiscountValue?: number | null
  globalDiscountNote?: string | null
  dependents?: { id: number; firstName: string; lastName: string; dateOfBirth?: string | null }[]
}

export default function ProfilePage() {
  const params = useParams()
  const slug = params['club-slug'] as string

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', mobile: '', landline: '', homeAddress: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { user?: ProfileData }) => {
        if (data.user) {
          setProfile(data.user)
          setForm({
            firstName: data.user.firstName ?? '',
            lastName: data.user.lastName ?? '',
            mobile: data.user.mobile ?? '',
            landline: data.user.landline ?? '',
            homeAddress: data.user.homeAddress ?? '',
          })
        }
      })
      .catch(() => setError('Αδυναμία φόρτωσης προφίλ'))
  }, [])

  // Also fetch dependents separately
  useEffect(() => {
    if (!profile) return
    fetch(`/api/dependents?where[parent][equals]=${profile.id}&depth=0&limit=50`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { docs?: ProfileData['dependents'] }) => {
        setProfile((prev) => prev ? { ...prev, dependents: data.docs ?? [] } : prev)
      })
      .catch(() => {})
  }, [profile?.id])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          mobile: form.mobile.trim() || null,
          landline: form.landline.trim() || null,
          homeAddress: form.homeAddress.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Σφάλμα αποθήκευσης')
      setProfile((prev) => prev ? { ...prev, ...form } : prev)
      setEditing(false)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        {error || 'Φόρτωση…'}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Το Προφίλ μου</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Επεξεργασία
          </button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-700 text-sm rounded-xl px-4 py-3 border border-emerald-100">
          Τα στοιχεία αποθηκεύτηκαν.
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-100">
          {error}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Όνομα</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Επώνυμο</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Κινητό</label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Σταθερό</label>
              <input
                type="tel"
                value={form.landline}
                onChange={(e) => setForm((f) => ({ ...f, landline: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Διεύθυνση</label>
              <input
                type="text"
                value={form.homeAddress}
                onChange={(e) => setForm((f) => ({ ...f, homeAddress: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? 'Αποθήκευση…' : 'Αποθήκευση'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Άκυρο
              </button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Όνομα</dt>
              <dd className="font-medium text-slate-800">{profile.firstName} {profile.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Email</dt>
              <dd className="font-medium text-slate-800">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Κινητό</dt>
              <dd className="font-medium text-slate-800">{profile.mobile || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Σταθερό</dt>
              <dd className="font-medium text-slate-800">{profile.landline || '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-slate-400">Διεύθυνση</dt>
              <dd className="font-medium text-slate-800">{profile.homeAddress || '—'}</dd>
            </div>
            {profile.globalDiscountType && profile.globalDiscountType !== 'none' && (
              <div className="col-span-2">
                <dt className="text-xs text-slate-400">Έκπτωση</dt>
                <dd className="font-medium text-slate-800">
                  {profile.globalDiscountType === 'percent'
                    ? `${profile.globalDiscountValue}%`
                    : `${profile.globalDiscountValue}€`}
                  {profile.globalDiscountNote && (
                    <span className="ml-2 font-normal text-slate-500">({profile.globalDiscountNote})</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Dependents */}
      {(profile.dependents ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Εξαρτώμενα Μέλη
          </h3>
          <ul className="space-y-2">
            {(profile.dependents ?? []).map((dep) => (
              <li key={dep.id} className="text-sm text-slate-700">
                <span className="font-medium">{dep.firstName} {dep.lastName}</span>
                {dep.dateOfBirth && (
                  <span className="ml-2 text-xs text-slate-400">
                    γεν. {new Date(dep.dateOfBirth).toLocaleDateString('el-GR')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/${slug}/member-area/receipts`}
          className="bg-white border border-slate-100 rounded-2xl p-4 text-center text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition"
        >
          🧾 Αποδείξεις
        </Link>
        <Link
          href={`/${slug}/member-area`}
          className="bg-white border border-slate-100 rounded-2xl p-4 text-center text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition"
        >
          🏠 Αρχική
        </Link>
      </div>
    </div>
  )
}
