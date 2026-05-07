import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ClubAdminActions } from '@/components/ClubAdminActions'

interface AdminUser {
  id: string | number
  firstName?: string
  lastName?: string
  email?: string
  tenant?: { id: string | number; name?: string; slug?: string } | string | null
}

export default async function SuperadminClubAdminsPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  await payload.auth({ headers })

  const { docs: admins } = await payload.find({
    collection: 'users',
    where: { role: { equals: 'club-admin' } },
    depth: 1,
    limit: 200,
    sort: 'firstName',
    overrideAccess: true,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Διαχειριστές Συλλόγων</h2>
        <Link
          href="/superadmin/club-admins/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl px-4 py-2 transition"
        >
          + Νέος Διαχειριστής
        </Link>
      </div>

      {admins.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm">Δεν υπάρχουν διαχειριστές ακόμα.</p>
          <Link href="/superadmin/club-admins/new" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            Προσθέστε τον πρώτο διαχειριστή
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Όνομα</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Σύλλογος</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(admins as AdminUser[]).map((admin) => {
                  const fullName = `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() || '—'
                  const tenant = typeof admin.tenant === 'object' && admin.tenant !== null ? admin.tenant : null
                  const tenantName = tenant?.name ?? '—'
                  const tenantSlug = tenant?.slug

                  return (
                    <tr key={String(admin.id)} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{fullName}</td>
                      <td className="px-5 py-3.5 text-slate-500">{admin.email ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        {tenantSlug ? (
                          <a
                            href={`/${tenantSlug}/dashboard`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {tenantName} ↗
                          </a>
                        ) : (
                          <span className="text-slate-400">{tenantName}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <ClubAdminActions userId={admin.id} name={fullName} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {(admins as AdminUser[]).map((admin) => {
              const fullName = `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() || '—'
              const tenant = typeof admin.tenant === 'object' && admin.tenant !== null ? admin.tenant : null
              const tenantName = tenant?.name ?? '—'
              const tenantSlug = tenant?.slug

              return (
                <div key={String(admin.id)} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="mb-3">
                    <p className="font-semibold text-slate-800 text-sm">{fullName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{admin.email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {tenantSlug ? (
                        <a href={`/${tenantSlug}/dashboard`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                          {tenantName} ↗
                        </a>
                      ) : tenantName}
                    </p>
                  </div>
                  <ClubAdminActions userId={admin.id} name={fullName} />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
