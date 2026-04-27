import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function DashboardPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown })?.tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? ((user as { tenant: { id: unknown } }).tenant.id)
      : ((user as { tenant?: unknown })?.tenant ?? ''),
  )

  const [{ totalDocs: memberCount }, { totalDocs: serviceCount }, { totalDocs: unpaidCount }] =
    await Promise.all([
      payload.find({
        collection: 'users',
        where: { and: [{ tenant: { equals: tenantId } }, { role: { equals: 'member' } }] },
        limit: 0,
      }),
      payload.find({
        collection: 'services',
        where: { and: [{ tenant: { equals: tenantId } }, { isActive: { equals: true } }] },
        limit: 0,
      }),
      payload.find({
        collection: 'enrollments',
        where: { and: [{ tenant: { equals: tenantId } }, { paymentStatus: { equals: 'unpaid' } }] },
        limit: 0,
      }),
    ])

  const stats = [
    { label: 'Μέλη', value: memberCount, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Ενεργές Υπηρεσίες', value: serviceCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ανεξόφλητες Οφειλές', value: unpaidCount, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">Επισκόπηση</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
