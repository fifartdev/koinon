import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ClubAdminForm } from '@/components/ClubAdminForm'

export default async function NewClubAdminPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  await payload.auth({ headers })

  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    where: { isActive: { equals: true } },
    limit: 200,
    sort: 'name',
    overrideAccess: true,
  })

  const tenantList = (tenants as { id: string | number; name?: string; slug?: string }[]).map((t) => ({
    id: t.id,
    name: t.name ?? '',
    slug: t.slug ?? '',
  }))

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/superadmin/club-admins" className="hover:text-indigo-600 transition">Διαχειριστές</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">Νέος Διαχειριστής</span>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6">Νέος Διαχειριστής Συλλόγου</h2>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <ClubAdminForm tenants={tenantList} />
      </div>
    </div>
  )
}
