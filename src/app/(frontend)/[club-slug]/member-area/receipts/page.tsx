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

export default async function MemberReceiptsPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const { docs: receipts } = await payload.find({
    collection: 'receipts',
    where: { member: { equals: user!.id } },
    sort: '-issuedAt',
    depth: 1,
    limit: 100,
  })

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Αποδείξεις</h1>

      {receipts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Δεν υπάρχουν αποδείξεις ακόμα.
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => {
            const rAny = r as unknown as {
              id: number
              receiptNumber: string
              issuedAt?: string | null
              paymentMethod?: string | null
              totalAmount?: number | null
              notes?: string | null
              lineItems?: { description?: string | null; finalAmount?: number | null }[]
            }

            return (
              <div
                key={rAny.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs text-indigo-600 font-semibold">
                        #{rAny.receiptNumber}
                      </p>
                      <Link
                        href={`/${slug}/receipt/${rAny.id}`}
                        className="text-[10px] text-slate-400 hover:text-indigo-600 transition underline underline-offset-2"
                      >
                        Εκτύπωση
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {rAny.issuedAt
                        ? new Date(rAny.issuedAt).toLocaleDateString('el-GR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'}
                      {rAny.paymentMethod && (
                        <span className="ml-2 text-slate-300">·</span>
                      )}
                      {rAny.paymentMethod && (
                        <span className="ml-2">
                          {METHOD_LABELS[rAny.paymentMethod] ?? rAny.paymentMethod}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-bold text-slate-800 text-lg">
                    {(rAny.totalAmount ?? 0).toFixed(2)}€
                  </span>
                </div>

                {/* Line items */}
                {(rAny.lineItems ?? []).length > 0 && (
                  <div className="border-t border-slate-50 pt-3 space-y-1.5">
                    {(rAny.lineItems ?? []).map((line, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{line.description ?? '—'}</span>
                        <span className="font-medium text-slate-800">
                          {(line.finalAmount ?? 0).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {rAny.notes && (
                  <p className="text-xs text-slate-400 border-t border-slate-50 pt-2">
                    {rAny.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
