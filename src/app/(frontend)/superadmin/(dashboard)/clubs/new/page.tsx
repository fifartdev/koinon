import Link from 'next/link'
import { TenantForm } from '@/components/TenantForm'

export default function NewClubPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/superadmin/clubs" className="hover:text-indigo-600 transition">Σύλλογοι</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">Νέος Σύλλογος</span>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-6">Νέος Σύλλογος</h2>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <TenantForm mode="create" />
      </div>
    </div>
  )
}
