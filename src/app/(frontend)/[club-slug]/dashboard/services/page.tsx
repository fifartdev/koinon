import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import type { Service } from '@/payload-types'
import { ServiceActions } from '@/components/ServiceActions'

const DAY_GREEK: Record<string, string> = {
  Monday: 'Δευτέρα',
  Tuesday: 'Τρίτη',
  Wednesday: 'Τετάρτη',
  Thursday: 'Πέμπτη',
  Friday: 'Παρασκευή',
  Saturday: 'Σάββατο',
  Sunday: 'Κυριακή',
}

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function ServicesPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId =
    typeof (user as { tenant?: string | { id: string } })?.tenant === 'object'
      ? ((user as { tenant: { id: string } }).tenant.id)
      : ((user as { tenant?: string })?.tenant ?? '')

  const { docs: services } = await payload.find({
    collection: 'services',
    where: { tenant: { equals: tenantId } },
    sort: 'title',
    limit: 100,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Υπηρεσίες</h2>
        <Link
          href={`/${slug}/dashboard/services/new`}
          className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          + Νέα Υπηρεσία
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p>Δεν υπάρχουν υπηρεσίες ακόμα.</p>
          <p className="text-sm mt-1">Δημιουργήστε την πρώτη υπηρεσία για να ξεκινήσετε.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(services as Service[]).map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{s.title}</h3>
                  {s.tutor && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Εκπαιδευτής: {s.tutor}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {s.fee != null && (
                    <span className="text-indigo-600 font-semibold text-sm">
                      {s.fee}/μήνα
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {s.isActive ? 'Ενεργή' : 'Ανενεργή'}
                  </span>
                </div>
              </div>
              {s.weeklySchedule && s.weeklySchedule.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.weeklySchedule.map((sch, i) => (
                    <span
                      key={i}
                      className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full"
                    >
                      {DAY_GREEK[sch.day ?? ''] ?? sch.day} {sch.startTime}–{sch.endTime}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 mt-3">
                <Link
                  href={`/${slug}/dashboard/services/${s.id}/members`}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
                >
                  👥 Μέλη
                </Link>
                <span className="text-slate-200">|</span>
                <ServiceActions
                  serviceId={String(s.id)}
                  serviceTitle={s.title}
                  slug={slug}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
