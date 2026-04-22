import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'
import type { Service } from '@/payload-types'

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
      <h2 className="text-xl font-bold text-slate-800 mb-6">Services</h2>

      {services.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p>No services yet. Add them via the admin panel.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(services as Service[]).map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-100 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{s.title}</h3>
                  {s.tutor && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Coach: {s.tutor}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {s.fee != null && (
                    <span className="text-indigo-600 font-semibold text-sm">
                      {s.fee}/mo
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.isActive
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
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
                      {sch.day} {sch.startTime}–{sch.endTime}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
