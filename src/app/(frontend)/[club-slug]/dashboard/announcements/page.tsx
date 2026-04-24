import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import type { Announcement } from '@/payload-types'
import { AnnouncementActions } from '@/components/AnnouncementActions'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function AnnouncementsPage({ params }: Props) {
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

  const { docs: announcements } = await payload.find({
    collection: 'announcements',
    where: { tenant: { equals: tenantId } },
    sort: '-isPinned,-createdAt',
    limit: 50,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Ανακοινώσεις</h2>
        <Link
          href={`/${slug}/dashboard/announcements/new`}
          className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          + Νέα
        </Link>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Δεν υπάρχουν ανακοινώσεις ακόμα.
        </div>
      ) : (
        <div className="space-y-3">
          {(announcements as Announcement[]).map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-2xl border p-5 ${
                a.isPinned ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {a.isPinned && (
                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                      Καρφιτσωμένη
                    </span>
                  )}
                  <h3 className="font-semibold text-slate-800 truncate">{a.title}</h3>
                  {a.publishedAt && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(a.publishedAt).toLocaleDateString('el-GR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      a.status === 'published'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {a.status === 'published' ? 'Δημοσιευμένη' : 'Πρόχειρο'}
                  </span>
                  <AnnouncementActions slug={slug} announcementId={a.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
