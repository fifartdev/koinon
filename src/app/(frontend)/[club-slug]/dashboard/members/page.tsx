import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import type { User } from '@/payload-types'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function MembersPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId =
    typeof (user as { tenant?: string | { id: string } })?.tenant === 'object'
      ? ((user as { tenant: { id: string } }).tenant.id)
      : ((user as { tenant?: string })?.tenant ?? '')

  const { docs: members } = await payload.find({
    collection: 'users',
    where: { and: [{ tenant: { equals: tenantId } }, { role: { equals: 'member' } }] },
    sort: 'firstName',
    limit: 100,
    depth: 0,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Members</h2>
        <Link
          href={`/${slug}/dashboard/members/invite`}
          className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          + Invite Member
        </Link>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No members yet.</p>
          <p className="text-sm mt-1">Invite your first member to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(members as User[]).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {(m as { firstName?: string }).firstName}{' '}
                    {(m as { lastName?: string }).lastName}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
