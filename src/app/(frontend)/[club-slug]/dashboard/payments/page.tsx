import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import { computeRate } from '@/lib/pricing'
import { PaymentsClient, type EnrollmentRow } from './PaymentsClient'

interface Props {
  params: Promise<{ 'club-slug': string }>
  searchParams: Promise<{ month?: string }>
}

export default async function PaymentsPage({ params, searchParams }: Props) {
  const { 'club-slug': slug } = await params
  const { month } = await searchParams

  const now = new Date()
  const selectedMonth =
    month && /^\d{4}-\d{2}$/.test(month)
      ? month
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [selYear, selMonthNum] = selectedMonth.split('-').map(Number) as [number, number]
  const selectedYM = selYear * 12 + (selMonthNum - 1)

  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )

  const [{ docs: enrollments }, { docs: receipts }] = await Promise.all([
    payload.find({
      collection: 'enrollments',
      where: { tenant: { equals: tenantId } },
      depth: 2,
      limit: 500,
    }),
    payload.find({
      collection: 'receipts',
      where: { tenant: { equals: tenantId } },
      depth: 1,
      limit: 1000,
    }),
  ])

  // Build paid totals + invoiced units per enrollment from receipts
  type ReceiptSummary = { paid: number; sessionsInvoiced: number; monthsInvoiced: number }
  const receiptSums: Record<string, ReceiptSummary> = {}

  for (const receipt of receipts) {
    const lineItems = (receipt as unknown as { lineItems?: { enrollment?: { id: unknown } | null | number; sessionsCount?: number | null; finalAmount?: number | null }[] }).lineItems ?? []
    for (const line of lineItems) {
      const eId = String(
        typeof line.enrollment === 'object' && line.enrollment !== null
          ? (line.enrollment as { id: unknown }).id
          : (line.enrollment ?? ''),
      )
      if (!eId) continue
      if (!receiptSums[eId]) receiptSums[eId] = { paid: 0, sessionsInvoiced: 0, monthsInvoiced: 0 }
      receiptSums[eId]!.paid += line.finalAmount ?? 0
      if (line.sessionsCount) receiptSums[eId]!.sessionsInvoiced += line.sessionsCount
      else receiptSums[eId]!.monthsInvoiced += 1
    }
  }

  const rows: EnrollmentRow[] = []

  for (const e of enrollments) {
    const eAny = e as unknown as {
      id: number
      planType?: 'monthly' | 'sessions' | null
      planTotal?: number | null
      planStart?: string | null
      discountType?: string | null
      discountValue?: number | null
      member?: { id: number; firstName?: string; lastName?: string; email?: string; globalDiscountType?: string | null; globalDiscountValue?: number | null } | null
      service?: { id: number; title?: string; fee?: number | null; sessionFee?: number | null; pricingType?: 'monthly' | 'per-session' | null } | null
    }

    const member = eAny.member
    const service = eAny.service
    if (!member || !service) continue

    const planType: 'monthly' | 'sessions' = eAny.planType === 'sessions' ? 'sessions' : 'monthly'
    const planTotal = eAny.planTotal ?? 0
    const planStart = eAny.planStart ?? ''

    // Skip enrollments with no plan configured — they have no billing basis yet
    if (planTotal === 0) continue

    // Month filter: only include monthly plans that cover the selected month
    if (planType === 'monthly' && planStart && planTotal > 0) {
      const startDate = new Date(planStart)
      const startYM = startDate.getFullYear() * 12 + startDate.getMonth()
      const endYM = startYM + planTotal - 1
      if (selectedYM < startYM || selectedYM > endYM) continue
    }

    const unitRate =
      planType === 'sessions'
        ? (service.sessionFee ?? 0)
        : (service.fee ?? 0)

    const { finalRate } = computeRate(
      unitRate,
      { discountType: eAny.discountType, discountValue: eAny.discountValue },
      { globalDiscountType: member.globalDiscountType, globalDiscountValue: member.globalDiscountValue },
    )

    const totalPlanValue = Math.round(finalRate * planTotal * 100) / 100
    const eId = String(eAny.id)
    const summary = receiptSums[eId]
    const totalPaid = Math.round((summary?.paid ?? 0) * 100) / 100
    const unitsInvoiced =
      planType === 'sessions'
        ? (summary?.sessionsInvoiced ?? 0)
        : (summary?.monthsInvoiced ?? 0)
    const balance = Math.max(0, Math.round((totalPlanValue - totalPaid) * 100) / 100)

    const memberName =
      `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || (member.email ?? '—')

    rows.push({
      enrollmentId: eId,
      memberId: String(member.id),
      memberName,
      serviceTitle: service.title ?? '—',
      planType,
      planTotal,
      unitsInvoiced,
      finalRate,
      totalPlanValue,
      totalPaid,
      balance,
      tenantId,
    })
  }

  // Sort: unpaid first, then by member name
  rows.sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance
    return a.memberName.localeCompare(b.memberName)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Πληρωμές</h2>
        <Link
          href={`/${slug}/dashboard/receipts`}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
        >
          Ιστορικό Αποδείξεων →
        </Link>
      </div>

      <PaymentsClient rows={rows} selectedMonth={selectedMonth} tenantId={tenantId} />
    </div>
  )
}
