import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'
import type { Enrollment, Service, Announcement } from '@/payload-types'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function MemberAreaPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId =
    typeof (user as { tenant?: string | { id: string } })?.tenant === 'object'
      ? ((user as { tenant: { id: string } }).tenant.id)
      : ((user as { tenant?: string })?.tenant ?? '')

  const [{ docs: enrollments }, { docs: announcements }, { totalDocs: unreadCount }] =
    await Promise.all([
      payload.find({
        collection: 'enrollments',
        where: { and: [{ member: { equals: user!.id } }] },
        depth: 1,
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
    ])

  const firstName = (user as { firstName?: string }).firstName ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Here's what's going on at your club.</p>
      </div>

      {unreadCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <p className="text-sm text-indigo-700 font-medium">
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* My Enrollments */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">My Services</h2>
        {enrollments.length === 0 ? (
          <p className="text-slate-400 text-sm">You are not enrolled in any services yet.</p>
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
                      <p className="text-xs text-slate-500 mt-0.5">Coach: {service.tutor}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      e.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {e.paymentStatus === 'paid' ? '✓ Paid' : '✗ Unpaid'}
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
            Latest Announcements
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
                    📌 Pinned
                  </span>
                )}
                <p className="font-medium text-slate-800 mt-0.5">{a.title}</p>
                {a.publishedAt && (
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(a.publishedAt).toLocaleDateString()}
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
