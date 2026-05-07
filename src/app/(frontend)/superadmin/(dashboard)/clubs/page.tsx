import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { TenantActions } from '@/components/TenantActions'

export default async function SuperadminClubsPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  await payload.auth({ headers })

  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    limit: 200,
    sort: '-createdAt',
    overrideAccess: true,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Σύλλογοι</h2>
        <Link
          href="/superadmin/clubs/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl px-4 py-2 transition"
        >
          + Νέος Σύλλογος
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏛</p>
          <p className="text-sm">Δεν υπάρχουν σύλλογοι ακόμα.</p>
          <Link href="/superadmin/clubs/new" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
            Δημιουργήστε τον πρώτο σύλλογο
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Σύλλογος</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Slug</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Κατάσταση</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tenants.map((t) => {
                  const tenant = t as {
                    id: string | number
                    name: string
                    slug: string
                    contactEmail?: string | null
                    isActive?: boolean
                    createdAt?: string
                  }
                  return (
                    <tr key={tenant.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{tenant.name}</td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{tenant.slug}</td>
                      <td className="px-5 py-3.5 text-slate-500">{tenant.contactEmail ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 ${
                          tenant.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tenant.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {tenant.isActive ? 'Ενεργός' : 'Ανενεργός'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <TenantActions
                          id={tenant.id}
                          slug={tenant.slug}
                          isActive={tenant.isActive ?? false}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tenants.map((t) => {
              const tenant = t as {
                id: string | number
                name: string
                slug: string
                contactEmail?: string | null
                isActive?: boolean
              }
              return (
                <div key={tenant.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{tenant.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{tenant.slug}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
                      tenant.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {tenant.isActive ? 'Ενεργός' : 'Ανενεργός'}
                    </span>
                  </div>
                  {tenant.contactEmail && (
                    <p className="text-xs text-slate-500 mb-3">{tenant.contactEmail}</p>
                  )}
                  <TenantActions
                    id={tenant.id}
                    slug={tenant.slug}
                    isActive={tenant.isActive ?? false}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
