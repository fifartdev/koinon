import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

export default async function SuperadminOverviewPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  await payload.auth({ headers }) // already guarded by layout

  const [
    { totalDocs: totalClubs },
    { totalDocs: activeClubs },
    { totalDocs: clubAdmins },
    { totalDocs: totalMembers },
  ] = await Promise.all([
    payload.find({ collection: 'tenants', limit: 0, overrideAccess: true }),
    payload.find({ collection: 'tenants', where: { isActive: { equals: true } }, limit: 0, overrideAccess: true }),
    payload.find({ collection: 'users', where: { role: { equals: 'club-admin' } }, limit: 0, overrideAccess: true }),
    payload.find({ collection: 'users', where: { role: { equals: 'member' } }, limit: 0, overrideAccess: true }),
  ])

  const stats = [
    { label: 'Σύνολο Συλλόγων', value: totalClubs, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/superadmin/clubs' },
    { label: 'Ενεργοί Σύλλογοι', value: activeClubs, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/superadmin/clubs' },
    { label: 'Διαχειριστές Συλλόγων', value: clubAdmins, color: 'text-violet-600', bg: 'bg-violet-50', href: '/superadmin/club-admins' },
    { label: 'Σύνολο Μελών', value: totalMembers, color: 'text-sky-600', bg: 'bg-sky-50', href: null },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Επισκόπηση</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) =>
          s.href ? (
            <Link key={s.label} href={s.href} className={`${s.bg} rounded-2xl p-5 hover:shadow-sm transition block`}>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </Link>
          ) : (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          )
        )}
      </div>

      {/* Quick actions */}
      <h3 className="text-sm font-semibold text-slate-600 mb-3">Γρήγορες Ενέργειες</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        <Link
          href="/superadmin/clubs/new"
          className="flex items-center gap-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:text-indigo-700 transition"
        >
          <span className="text-xl">🏛</span>
          Νέος Σύλλογος
        </Link>
        <Link
          href="/superadmin/club-admins/new"
          className="flex items-center gap-3 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:text-violet-700 transition"
        >
          <span className="text-xl">👤</span>
          Νέος Διαχειριστής
        </Link>
      </div>
    </div>
  )
}
