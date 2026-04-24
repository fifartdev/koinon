import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Μετρητά',
  transfer: 'Τραπεζική Μεταφορά',
  card: 'Κάρτα',
  other: 'Άλλο',
}

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function ReceiptsPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )

  const { docs: receipts } = await payload.find({
    collection: 'receipts',
    where: { tenant: { equals: tenantId } },
    sort: '-issuedAt',
    depth: 1,
    limit: 200,
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${slug}/dashboard/payments`}
          className="text-slate-400 hover:text-slate-600 transition text-sm"
        >
          ← Πληρωμές
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Ιστορικό Αποδείξεων</h2>
      </div>

      {receipts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Δεν έχουν εκδοθεί αποδείξεις ακόμα.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Αρ. Απόδειξης</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Μέλος</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Ημερομηνία</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Τρόπος</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Υπηρεσίες</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-500">Σύνολο</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {receipts.map((r) => {
                const rAny = r as unknown as {
                  id: number
                  receiptNumber: string
                  issuedAt?: string | null
                  paymentMethod?: string | null
                  totalAmount?: number | null
                  member?: { id: number; firstName?: string; lastName?: string; email?: string } | null
                  lineItems?: { description?: string | null }[]
                }
                const member = rAny.member
                const memberName = member
                  ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || (member.email ?? '—')
                  : '—'
                const descriptions = (rAny.lineItems ?? [])
                  .map((l) => l.description)
                  .filter(Boolean)
                  .join(', ')

                return (
                  <tr key={rAny.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-indigo-600 font-semibold text-xs">
                      {rAny.receiptNumber}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{memberName}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {rAny.issuedAt ? new Date(rAny.issuedAt).toLocaleDateString('el-GR') : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {METHOD_LABELS[rAny.paymentMethod ?? ''] ?? rAny.paymentMethod ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs max-w-50 truncate">
                      {descriptions || '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">
                      {(rAny.totalAmount ?? 0).toFixed(2)}€
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/${slug}/receipt/${rAny.id}`}
                        className="text-xs text-indigo-500 hover:text-indigo-700 transition"
                      >
                        Εκτύπωση
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
