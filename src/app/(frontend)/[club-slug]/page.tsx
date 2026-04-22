import { getPayload } from 'payload'
import config from '@payload-config'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import type { Tenant, Service, Announcement } from '@/payload-types'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function ClubLandingPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const payload = await getPayload({ config })

  const [{ docs: tenants }, { docs: services }, { docs: announcements }] =
    await Promise.all([
      payload.find({
        collection: 'tenants',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
      }),
      payload.find({
        collection: 'services',
        where: {
          and: [
            { 'tenant.slug': { equals: slug } },
            { isActive: { equals: true } },
          ],
        },
        limit: 12,
        depth: 0,
      }),
      payload.find({
        collection: 'announcements',
        where: {
          and: [
            { 'tenant.slug': { equals: slug } },
            { status: { equals: 'published' } },
          ],
        },
        sort: '-isPinned,-publishedAt',
        limit: 6,
        depth: 0,
      }),
    ])

  const tenant = tenants[0] as Tenant

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-indigo-700 text-white">
        {tenant.heroImage &&
          typeof tenant.heroImage === 'object' &&
          (tenant.heroImage as { url?: string }).url && (
            <Image
              src={(tenant.heroImage as { url: string }).url}
              alt={tenant.name}
              fill
              className="object-cover opacity-30"
              priority
            />
          )}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center gap-6">
          {tenant.logo &&
            typeof tenant.logo === 'object' &&
            (tenant.logo as { url?: string }).url && (
              <Image
                src={(tenant.logo as { url: string }).url}
                alt={`${tenant.name} logo`}
                width={80}
                height={80}
                className="rounded-full ring-4 ring-white/30"
              />
            )}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            {tenant.name}
          </h1>
          {tenant.contactEmail && (
            <p className="text-indigo-200 text-lg">{tenant.contactEmail}</p>
          )}
          <div className="flex gap-3 mt-4">
            <Link
              href={`/${slug}/login`}
              className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition"
            >
              Member Login
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        {/* Services */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Services</h2>
          {services.length === 0 ? (
            <p className="text-slate-500">No services available yet.</p>
          ) : (
            <div className="space-y-4">
              {(services as Service[]).map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {service.title}
                      </h3>
                      {service.tutor && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          Coach: {service.tutor}
                        </p>
                      )}
                    </div>
                    {service.fee != null && (
                      <span className="text-indigo-600 font-semibold text-sm whitespace-nowrap">
                        {service.fee} / mo
                      </span>
                    )}
                  </div>
                  {service.weeklySchedule && service.weeklySchedule.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.weeklySchedule.map((s, i) => (
                        <span
                          key={i}
                          className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {s.day} {s.startTime}–{s.endTime}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Announcements */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Announcements
          </h2>
          {announcements.length === 0 ? (
            <p className="text-slate-500">No announcements yet.</p>
          ) : (
            <div className="space-y-4">
              {(announcements as Announcement[]).map((a) => (
                <div
                  key={a.id}
                  className={`bg-white rounded-2xl shadow-sm border p-5 ${
                    a.isPinned
                      ? 'border-indigo-300 ring-1 ring-indigo-200'
                      : 'border-slate-100'
                  }`}
                >
                  {a.isPinned && (
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                      📌 Pinned
                    </span>
                  )}
                  <h3 className="font-semibold text-slate-800 mt-1">
                    {a.title}
                  </h3>
                  {a.publishedAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(a.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
