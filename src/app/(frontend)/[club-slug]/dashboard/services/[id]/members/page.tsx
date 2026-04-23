import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import type { Service, Enrollment, User } from '@/payload-types'

interface Props {
  params: Promise<{ 'club-slug': string; id: string }>
}

export default async function ServiceMembersPage({ params }: Props) {
  const { 'club-slug': slug, id: serviceId } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? ''
  )

  const role = (user as { role?: string }).role ?? ''

  let service: Service
  try {
    service = await payload.findByID({ collection: 'services', id: serviceId, depth: 0 }) as Service
  } catch {
    notFound()
  }

  if (!['master', 'superadmin'].includes(role)) {
    const serviceTenantId = String(
      typeof (service as { tenant?: unknown }).tenant === 'object' && (service as { tenant: unknown }).tenant !== null
        ? (service as { tenant: { id: unknown } }).tenant.id
        : (service as { tenant?: unknown }).tenant ?? ''
    )
    if (serviceTenantId !== tenantId) notFound()
  }

  const { docs: enrollments } = await payload.find({
    collection: 'enrollments',
    where: { and: [{ service: { equals: serviceId } }, { tenant: { equals: tenantId } }] },
    depth: 1,
    limit: 200,
    sort: '-enrolledAt',
  })

  const paid = enrollments.filter((e) => e.paymentStatus === 'paid').length
  const unpaid = enrollments.filter((e) => e.paymentStatus === 'unpaid').length

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${slug}/dashboard/services`}
          className="text-slate-400 hover:text-slate-600 transition text-sm"
        >
          ← Πίσω
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{service.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {enrollments.length} μέλη · {paid} πληρωμένα · {unpaid} εκκρεμή
          </p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p>Δεν υπάρχουν εγγεγραμμένα μέλη σε αυτή την υπηρεσία.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Μέλος</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Εγγραφή</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Πληρωμή</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(enrollments as Enrollment[]).map((e) => {
                const member = e.member as User
                const memberName = `${(member as { firstName?: string }).firstName ?? ''} ${(member as { lastName?: string }).lastName ?? ''}`.trim() || member.email!
                const enrolledAt = e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString('el-GR') : '—'
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{memberName}</td>
                    <td className="px-5 py-3 text-slate-500">{member.email}</td>
                    <td className="px-5 py-3 text-slate-500">{enrolledAt}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        e.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {e.paymentStatus === 'paid' ? 'Πληρωμένο' : 'Εκκρεμεί'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/${slug}/dashboard/members/${member.id}/enrollments`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                      >
                        Επεξεργασία
                      </Link>
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
