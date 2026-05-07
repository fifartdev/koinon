import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { TenantForm } from '@/components/TenantForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditClubPage({ params }: Props) {
  const { id } = await params
  const payload = await getPayload({ config })

  type TenantShape = { id: string | number; name: string; slug: string; contactEmail?: string | null; isActive?: boolean }
  let tenant: TenantShape | null = null
  try {
    const result = await payload.findByID({ collection: 'tenants', id, overrideAccess: true })
    tenant = result as unknown as TenantShape
  } catch {
    notFound()
  }
  if (!tenant) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/superadmin/clubs" className="hover:text-indigo-600 transition">Σύλλογοι</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">{tenant.name}</span>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6">Επεξεργασία Συλλόγου</h2>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <TenantForm
          mode="edit"
          existing={{
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            contactEmail: tenant.contactEmail,
            isActive: tenant.isActive ?? true,
          }}
        />
      </div>
    </div>
  )
}
