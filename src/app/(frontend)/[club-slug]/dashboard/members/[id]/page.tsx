import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

interface Props {
  params: Promise<{ 'club-slug': string; id: string }>
}

export default async function MemberDetailPage({ params }: Props) {
  const { 'club-slug': slug, id: memberId } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )
  const role = (user as { role?: string }).role ?? ''

  let member: {
    id: number; firstName?: string; lastName?: string; email: string
    mobile?: string | null; landline?: string | null; homeAddress?: string | null
    tenant?: unknown; role?: string
    globalDiscountType?: string | null; globalDiscountValue?: number | null; globalDiscountNote?: string | null
  }
  try {
    member = await payload.findByID({ collection: 'users', id: memberId, depth: 0 }) as typeof member
  } catch {
    notFound()
  }

  const memberTenantId = String(
    typeof member.tenant === 'object' && member.tenant !== null
      ? (member.tenant as { id: unknown }).id
      : member.tenant ?? '',
  )
  if (!['master', 'superadmin'].includes(role) && memberTenantId !== tenantId) notFound()

  const [{ docs: dependents }, { docs: enrollments }, { docs: receipts }] = await Promise.all([
    payload.find({
      collection: 'dependents',
      where: { parent: { equals: memberId } },
      limit: 100,
      depth: 0,
    }),
    payload.find({
      collection: 'enrollments',
      where: { and: [{ member: { equals: memberId } }, { tenant: { equals: tenantId } }] },
      depth: 1,
      limit: 100,
    }),
    payload.find({
      collection: 'receipts',
      where: { and: [{ member: { equals: memberId } }, { tenant: { equals: tenantId } }] },
      depth: 0,
      limit: 20,
      sort: '-issuedAt',
    }),
  ])

  const memberName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${slug}/dashboard/members`}
          className="text-xs text-slate-500 hover:text-slate-700 transition"
        >
          ← Μέλη
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-xl font-bold text-slate-800">{memberName}</h2>
          <Link
            href={`/${slug}/dashboard/members/${memberId}/enrollments`}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Εγγραφές →
          </Link>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Στοιχεία Επικοινωνίας
        </h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-400 text-xs">Email</dt>
            <dd className="text-slate-800 font-medium">{member.email}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs">Κινητό</dt>
            <dd className="text-slate-800 font-medium">{member.mobile ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs">Σταθερό</dt>
            <dd className="text-slate-800 font-medium">{member.landline ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs">Διεύθυνση</dt>
            <dd className="text-slate-800 font-medium">{member.homeAddress ?? '—'}</dd>
          </div>
        </dl>
        {member.globalDiscountType && member.globalDiscountType !== 'none' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <dt className="text-slate-400 text-xs mb-1">Γενική Έκπτωση</dt>
            <dd className="text-slate-700 text-sm font-medium">
              {member.globalDiscountType === 'percent'
                ? `${member.globalDiscountValue}%`
                : `${member.globalDiscountValue}€`}
              {member.globalDiscountNote && (
                <span className="ml-2 font-normal text-slate-500">— {member.globalDiscountNote}</span>
              )}
            </dd>
          </div>
        )}
      </div>

      {/* Dependents */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Εξαρτώμενα Μέλη ({dependents.length})
          </h3>
          <Link
            href={`/${slug}/dashboard/members/${memberId}/add-child`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            + Προσθήκη Παιδιού
          </Link>
        </div>
        {dependents.length === 0 ? (
          <p className="text-sm text-slate-400">Δεν υπάρχουν εξαρτώμενα μέλη.</p>
        ) : (
          <ul className="space-y-2">
            {dependents.map((dep) => {
              const d = dep as unknown as { id: number; firstName?: string; lastName?: string; dateOfBirth?: string | null; notes?: string | null }
              return (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {d.firstName} {d.lastName}
                    {d.dateOfBirth && (
                      <span className="ml-2 text-xs text-slate-400">
                        γεν. {new Date(d.dateOfBirth).toLocaleDateString('el-GR')}
                      </span>
                    )}
                  </span>
                  <Link
                    href={`/${slug}/dashboard/dependents/${d.id}/enrollments`}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Εγγραφές
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Active enrollments */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Εγγραφές ({enrollments.length})
        </h3>
        {enrollments.length === 0 ? (
          <p className="text-sm text-slate-400">Δεν υπάρχουν εγγραφές.</p>
        ) : (
          <ul className="space-y-2">
            {enrollments.map((e) => {
              const en = e as unknown as { id: number; service?: { title?: string } | null; paymentStatus?: string }
              return (
                <li key={en.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{en.service?.title ?? '—'}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      en.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {en.paymentStatus === 'paid' ? 'Πληρωμένο' : 'Εκκρεμεί'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Recent receipts */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Πρόσφατες Αποδείξεις
          </h3>
          <Link
            href={`/${slug}/dashboard/receipts`}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Όλες →
          </Link>
        </div>
        {receipts.length === 0 ? (
          <p className="text-sm text-slate-400">Δεν υπάρχουν αποδείξεις.</p>
        ) : (
          <ul className="space-y-2">
            {receipts.slice(0, 5).map((r) => {
              const rc = r as unknown as { id: number; receiptNumber?: string; totalAmount?: number; issuedAt?: string }
              return (
                <li key={rc.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/${slug}/receipt/${rc.id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    #{rc.receiptNumber}
                  </Link>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-xs">
                      {rc.issuedAt ? new Date(rc.issuedAt).toLocaleDateString('el-GR') : '—'}
                    </span>
                    <span className="font-semibold text-slate-700">{rc.totalAmount?.toFixed(2)}€</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
