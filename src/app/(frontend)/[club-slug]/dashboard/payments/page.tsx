import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'
import type { Enrollment, User, Service } from '@/payload-types'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function PaymentsPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId =
    typeof (user as { tenant?: string | { id: string } })?.tenant === 'object'
      ? ((user as { tenant: { id: string } }).tenant.id)
      : ((user as { tenant?: string })?.tenant ?? '')

  const { docs: enrollments } = await payload.find({
    collection: 'enrollments',
    where: { tenant: { equals: tenantId } },
    sort: 'paymentStatus,-enrolledAt',
    limit: 200,
    depth: 1,
  })

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">Πληρωμές</h2>

      {enrollments.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Δεν υπάρχουν εγγραφές ακόμα.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Μέλος</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Υπηρεσία</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Κατάσταση</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Εγγραφή</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(enrollments as Enrollment[]).map((e) => {
                const member = e.member as User | null
                const service = e.service as Service | null
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {member
                        ? `${(member as { firstName?: string }).firstName ?? ''} ${(member as { lastName?: string }).lastName ?? ''}`.trim() || member.email
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {service?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          e.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {e.paymentStatus === 'paid' ? '✓ Εξοφλήθη' : '✗ Ανεξόφλητο'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {e.enrolledAt
                        ? new Date(e.enrolledAt).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
