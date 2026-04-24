import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import type { Enrollment, Service, Announcement } from '@/payload-types'
import { computeRate } from '@/lib/pricing'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function MemberAreaPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' &&
    (user as { tenant?: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )

  const [{ docs: enrollments }, { docs: announcements }, { totalDocs: unreadCount }, { docs: receipts }] =
    await Promise.all([
      payload.find({
        collection: 'enrollments',
        where: { and: [{ member: { equals: user!.id } }] },
        depth: 2,
        limit: 20,
      }),
      payload.find({
        collection: 'announcements',
        where: {
          and: [
            { tenant: { equals: tenantId } },
            { status: { equals: 'published' } },
          ],
        },
        sort: '-isPinned,-publishedAt',
        limit: 5,
      }),
      payload.find({
        collection: 'notifications',
        where: { and: [{ recipient: { equals: user!.id } }, { isRead: { equals: false } }] },
        limit: 0,
      }),
      payload.find({
        collection: 'receipts',
        where: { member: { equals: user!.id } },
        depth: 1,
        limit: 200,
      }),
    ])

  // Build paid per enrollment from receipts
  const paidPerEnrollment: Record<string, number> = {}
  for (const receipt of receipts) {
    const lines = (receipt as unknown as { lineItems?: { enrollment?: { id: unknown } | number | null; finalAmount?: number | null }[] }).lineItems ?? []
    for (const line of lines) {
      const eId = String(typeof line.enrollment === 'object' && line.enrollment !== null ? (line.enrollment as { id: unknown }).id : (line.enrollment ?? ''))
      if (!eId) continue
      paidPerEnrollment[eId] = (paidPerEnrollment[eId] ?? 0) + (line.finalAmount ?? 0)
    }
  }

  // Compute total balance
  let totalOwed = 0
  let totalPaid = 0
  for (const e of enrollments) {
    const eAny = e as unknown as {
      id: number
      planType?: 'monthly' | 'sessions' | null
      planTotal?: number | null
      discountType?: string | null
      discountValue?: number | null
      service?: { fee?: number | null; sessionFee?: number | null } | null
    }
    const service = eAny.service
    if (!service || !eAny.planTotal) continue
    const planType = eAny.planType === 'sessions' ? 'sessions' : 'monthly'
    const unitRate = planType === 'sessions' ? (service.sessionFee ?? 0) : (service.fee ?? 0)
    const userAny = user as unknown as { globalDiscountType?: string | null; globalDiscountValue?: number | null }
    const { finalRate } = computeRate(unitRate, eAny, userAny)
    const planValue = Math.round(finalRate * eAny.planTotal * 100) / 100
    const paid = Math.round((paidPerEnrollment[String(eAny.id)] ?? 0) * 100) / 100
    totalOwed += planValue
    totalPaid += paid
  }
  const balance = Math.max(0, Math.round((totalOwed - totalPaid) * 100) / 100)

  const firstName = (user as { firstName?: string }).firstName ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Καλώς ήρθες{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Τι γίνεται στον σύλλογό σου.</p>
      </div>

      {/* Balance card */}
      {totalOwed > 0 && (
        <Link href={`/${slug}/member-area/receipts`} className="block">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between hover:border-indigo-100 transition">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Σύνολο Πλάνου</p>
                <p className="font-bold text-slate-800">{totalOwed.toFixed(2)}€</p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="text-center">
                <p className="text-[10px] text-emerald-500 uppercase tracking-wide">Καταβληθέν</p>
                <p className="font-bold text-emerald-600">{totalPaid.toFixed(2)}€</p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Υπόλοιπο</p>
                <p className={`font-bold ${balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {balance > 0 ? `${balance.toFixed(2)}€` : '✓ Εξοφλήθη'}
                </p>
              </div>
            </div>
            <span className="text-slate-300 text-lg">🧾</span>
          </div>
        </Link>
      )}

      {unreadCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <p className="text-sm text-indigo-700 font-medium">
            Έχεις {unreadCount} αδιάβαστη{unreadCount > 1 ? 'ς' : ''} ειδοποίηση{unreadCount > 1 ? 'ς' : ''}
          </p>
        </div>
      )}

      {/* My Enrollments */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Οι Υπηρεσίες μου</h2>
        {enrollments.length === 0 ? (
          <p className="text-slate-400 text-sm">Δεν είστε εγγεγραμμένοι σε καμία υπηρεσία ακόμα.</p>
        ) : (
          <div className="space-y-3">
            {(enrollments as Enrollment[]).map((e) => {
              const service = e.service as Service | null
              return (
                <div
                  key={e.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-800">{service?.title ?? '—'}</p>
                    {service?.tutor && (
                      <p className="text-xs text-slate-500 mt-0.5">Εκπαιδευτής: {service.tutor}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      e.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {e.paymentStatus === 'paid' ? '✓ Εξοφλήθη' : '✗ Ανεξόφλητο'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            Τελευταίες Ανακοινώσεις
          </h2>
          <div className="space-y-3">
            {(announcements as Announcement[]).map((a) => (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border p-4 ${
                  a.isPinned ? 'border-indigo-200' : 'border-slate-100'
                }`}
              >
                {a.isPinned && (
                  <span className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">
                    📌 Καρφιτσωμένη
                  </span>
                )}
                <p className="font-medium text-slate-800 mt-0.5">{a.title}</p>
                {a.content && (
                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                    {a.content as string}
                  </p>
                )}
                {a.publishedAt && (
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(a.publishedAt).toLocaleDateString('el-GR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
