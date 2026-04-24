import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound, redirect } from 'next/navigation'
import { PrintButton } from '@/components/PrintButton'
import React from 'react'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Μετρητά',
  transfer: 'Τραπεζική Μεταφορά',
  card: 'Κάρτα',
  other: 'Άλλο',
}

interface Props {
  params: Promise<{ 'club-slug': string; id: string }>
}

export default async function ReceiptPrintPage({ params }: Props) {
  const { 'club-slug': slug, id } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) redirect(`/${slug}/login`)

  let receipt: unknown
  try {
    receipt = await payload.findByID({
      collection: 'receipts',
      id,
      depth: 2,
    })
  } catch {
    notFound()
  }

  if (!receipt) notFound()

  const r = receipt as {
    id: number
    receiptNumber: string
    issuedAt?: string | null
    paymentMethod?: string | null
    totalAmount?: number | null
    notes?: string | null
    lineItems?: {
      description?: string | null
      baseAmount?: number | null
      discountAmount?: number | null
      finalAmount?: number | null
    }[]
    member?: {
      firstName?: string | null
      lastName?: string | null
      email?: string | null
      landline?: string | null
      mobile?: string | null
    } | null
    tenant?: {
      name?: string | null
      contactEmail?: string | null
    } | null
    issuedBy?: {
      firstName?: string | null
      lastName?: string | null
    } | null
  }

  const clubName = r.tenant?.name ?? 'Σύλλογος'
  const clubEmail = r.tenant?.contactEmail ?? ''
  const memberName =
    `${r.member?.firstName ?? ''} ${r.member?.lastName ?? ''}`.trim() ||
    (r.member?.email ?? '—')
  const memberEmail = r.member?.email ?? ''
  const memberPhone = r.member?.mobile || r.member?.landline || ''
  const issuedByName =
    `${r.issuedBy?.firstName ?? ''} ${r.issuedBy?.lastName ?? ''}`.trim() || ''

  const issuedDate = r.issuedAt
    ? new Date(r.issuedAt).toLocaleDateString('el-GR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  const role = (user as { role?: string }).role ?? ''
  const backHref = ['master', 'superadmin', 'club-admin'].includes(role)
    ? `/${slug}/dashboard/receipts`
    : `/${slug}/member-area/receipts`

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="no-print flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
        <a href={backHref} className="text-sm text-slate-500 hover:text-slate-700 transition">
          ← Πίσω
        </a>
        <span className="text-slate-300">|</span>
        <PrintButton />
      </div>

      {/* Receipt document */}
      <div className="max-w-2xl mx-auto px-6 py-10 print:py-0 print:px-0 print:max-w-full">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 print:rounded-none print:border-0 print:shadow-none space-y-6">

          {/* Club header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{clubName}</h1>
              {clubEmail && (
                <p className="text-sm text-slate-500 mt-0.5">{clubEmail}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                Απόδειξη Πληρωμής
              </p>
              <p className="font-mono text-indigo-600 font-bold text-lg mt-0.5">
                #{r.receiptNumber}
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Receipt meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Ημερομηνία</p>
              <p className="font-medium text-slate-800">{issuedDate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Τρόπος Πληρωμής</p>
              <p className="font-medium text-slate-800">
                {METHOD_LABELS[r.paymentMethod ?? ''] ?? r.paymentMethod ?? '—'}
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Member details */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Στοιχεία Μέλους</p>
            <p className="font-semibold text-slate-900">{memberName}</p>
            {memberEmail && (
              <p className="text-sm text-slate-500 mt-0.5">{memberEmail}</p>
            )}
            {memberPhone && (
              <p className="text-sm text-slate-500 mt-0.5">{memberPhone}</p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Line items */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Αναλυτικά</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-2 font-semibold text-slate-500">Περιγραφή</th>
                  <th className="text-right pb-2 font-semibold text-slate-500">Τιμή</th>
                  <th className="text-right pb-2 font-semibold text-slate-500">Έκπτωση</th>
                  <th className="text-right pb-2 font-semibold text-slate-500">Σύνολο</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(r.lineItems ?? []).map((line, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-slate-700">{line.description ?? '—'}</td>
                    <td className="py-2.5 text-right text-slate-600">
                      {(line.baseAmount ?? 0).toFixed(2)}€
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {(line.discountAmount ?? 0) > 0
                        ? `−${(line.discountAmount ?? 0).toFixed(2)}€`
                        : '—'}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {(line.finalAmount ?? 0).toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-slate-50 print:bg-gray-100 rounded-xl px-6 py-3 flex items-center gap-6">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Σύνολο
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {(r.totalAmount ?? 0).toFixed(2)}€
              </span>
            </div>
          </div>

          {/* Notes */}
          {r.notes && (
            <>
              <hr className="border-slate-100" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Σημειώσεις</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{r.notes}</p>
              </div>
            </>
          )}

          {/* Footer */}
          <hr className="border-slate-100" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{clubName}</span>
            {issuedByName && <span>Εκδόθηκε από: {issuedByName}</span>}
            <span>{issuedDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
