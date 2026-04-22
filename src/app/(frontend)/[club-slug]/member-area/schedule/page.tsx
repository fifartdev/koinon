import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import React from 'react'
import type { Enrollment, Service } from '@/payload-types'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export default async function SchedulePage({ params }: Props) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const { docs: enrollments } = await payload.find({
    collection: 'enrollments',
    where: { member: { equals: user!.id } },
    depth: 1,
    limit: 50,
  })

  // Build day → slots map
  const byDay: Record<string, { service: string; time: string; location?: string }[]> = {}

  for (const e of enrollments as Enrollment[]) {
    const service = e.service as Service | null
    if (!service?.weeklySchedule) continue
    for (const slot of service.weeklySchedule) {
      if (!slot.day) continue
      if (!byDay[slot.day]) byDay[slot.day] = []
      byDay[slot.day].push({
        service: service.title,
        time: `${slot.startTime ?? ''}–${slot.endTime ?? ''}`,
        location: slot.location ?? undefined,
      })
    }
  }

  const days = DAY_ORDER.filter((d) => byDay[d])

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-5">My Schedule</h1>

      {days.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p>No schedule yet.</p>
          <p className="text-sm mt-1">Enroll in services to see your weekly schedule here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <div key={day}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {day}
              </h2>
              <div className="space-y-2">
                {byDay[day].map((slot, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-4"
                  >
                    <div className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap">
                      {slot.time}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{slot.service}</p>
                      {slot.location && (
                        <p className="text-xs text-slate-400">{slot.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
