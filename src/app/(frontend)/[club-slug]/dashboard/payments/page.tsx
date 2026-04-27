import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import { computeRate } from '@/lib/pricing'
import { PaymentsClient, type EnrollmentRow, type PaymentsKpis } from './PaymentsClient'

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

  const nextMonthDate = new Date(selYear, selMonthNum, 1) // JS months are 0-indexed so selMonthNum is already +1
  const nextYM = nextMonthDate.getFullYear() * 12 + nextMonthDate.getMonth()

  const currentYM = now.getFullYear() * 12 + now.getMonth()

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

  // ── Receipt sums per enrollment ─────────────────────────────────────────
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

  // ── Build enrollment rows ────────────────────────────────────────────────
  const rows: EnrollmentRow[] = []

  for (const e of enrollments) {
    const eAny = e as unknown as {
      id: number
      planType?: 'monthly' | 'sessions' | null
      planTotal?: number | null
      planStart?: string | null
      discountType?: string | null
      discountValue?: number | null
      // member enrollment
      member?: {
        id: number; firstName?: string; lastName?: string; email?: string
        globalDiscountType?: string | null; globalDiscountValue?: number | null
      } | null
      // dependent enrollment
      dependent?: {
        id: number; firstName?: string; lastName?: string
        parent?: {
          id: number; firstName?: string; lastName?: string; email?: string
          globalDiscountType?: string | null; globalDiscountValue?: number | null
        } | null
      } | null
      service?: { id: number; title?: string; fee?: number | null; sessionFee?: number | null; pricingType?: 'monthly' | 'per-session' | null } | null
    }

    const service = eAny.service
    if (!service) continue

    // Determine if this is a dependent or adult enrollment
    const isDependent = !!eAny.dependent && !eAny.member
    const dep = eAny.dependent
    const member = eAny.member

    // For receipts, always use the parent user
    const parentUser = isDependent ? dep?.parent : member
    if (!parentUser) continue

    const parentMemberId = String(parentUser.id)
    const parentMemberName = `${parentUser.firstName ?? ''} ${parentUser.lastName ?? ''}`.trim() || (parentUser.email ?? '—')

    const displayName = isDependent
      ? `${dep?.firstName ?? ''} ${dep?.lastName ?? ''}`.trim()
      : parentMemberName

    const planType: 'monthly' | 'sessions' = eAny.planType === 'sessions' ? 'sessions' : 'monthly'
    const planTotal = eAny.planTotal ?? 0
    const planStart = eAny.planStart ?? ''

    if (planTotal === 0) continue

    const discountSource = isDependent ? dep?.parent : member
    const unitRate = planType === 'sessions' ? (service.sessionFee ?? 0) : (service.fee ?? 0)
    const { finalRate } = computeRate(
      unitRate,
      { discountType: eAny.discountType, discountValue: eAny.discountValue },
      { globalDiscountType: discountSource?.globalDiscountType, globalDiscountValue: discountSource?.globalDiscountValue },
    )

    const eId = String(eAny.id)
    const summary = receiptSums[eId]
    const totalPaid = Math.round((summary?.paid ?? 0) * 100) / 100
    const unitsInvoiced =
      planType === 'sessions' ? (summary?.sessionsInvoiced ?? 0) : (summary?.monthsInvoiced ?? 0)
    const totalPlanValue = Math.round(finalRate * planTotal * 100) / 100
    const balance = Math.max(0, Math.round((totalPlanValue - totalPaid) * 100) / 100)

    // ── Overdue detection (monthly only) ─────────────────────────────────
    let overdueMonths = 0
    let inSelectedMonth = false
    let inNextMonth = false

    if (planType === 'monthly' && planStart && planTotal > 0) {
      const startDate = new Date(planStart)
      const startYM = startDate.getFullYear() * 12 + startDate.getMonth()
      const endYM = startYM + planTotal - 1

      inSelectedMonth = selectedYM >= startYM && selectedYM <= endYM
      inNextMonth = nextYM >= startYM && nextYM <= endYM

      const monthsElapsed = Math.max(0, Math.min(currentYM - startYM + 1, planTotal))
      overdueMonths = Math.max(0, monthsElapsed - unitsInvoiced)
    } else if (planType === 'sessions') {
      inSelectedMonth = true // sessions not filtered by month
    }

    rows.push({
      enrollmentId: eId,
      memberId: parentMemberId,
      memberName: displayName,
      parentMemberId,
      parentMemberName,
      serviceTitle: service.title ?? '—',
      planType,
      planTotal,
      unitsInvoiced,
      finalRate,
      totalPlanValue,
      totalPaid,
      balance,
      tenantId,
      isDependent,
      dependentId: isDependent ? String(dep!.id) : undefined,
      dependentName: isDependent ? displayName : undefined,
      overdueMonths,
      inSelectedMonth,
      inNextMonth,
    })
  }

  // ── Filter for selected-month display ────────────────────────────────────
  const monthlyRows = rows.filter((r) => r.planType === 'monthly' && r.inSelectedMonth)
  const sessionRows = rows.filter((r) => r.planType === 'sessions')
  const overdueRows = rows.filter((r) => r.planType === 'monthly' && r.overdueMonths > 0)

  // Sort: unpaid first, then by member name
  const sortRows = (arr: EnrollmentRow[]) =>
    [...arr].sort((a, b) => {
      if (b.balance !== a.balance) return b.balance - a.balance
      return a.memberName.localeCompare(b.memberName)
    })

  // ── KPIs ────────────────────────────────────────────────────────────────
  const expectedMonthly = Math.round(monthlyRows.reduce((s, r) => s + r.finalRate, 0) * 100) / 100
  const collectedMonthly = Math.round(monthlyRows.reduce((s, r) => s + r.totalPaid, 0) * 100) / 100
  const outstandingMonthly = Math.round(monthlyRows.filter((r) => r.balance > 0).reduce((s, r) => s + r.balance, 0) * 100) / 100
  const nextMonthExpected = Math.round(rows.filter((r) => r.planType === 'monthly' && r.inNextMonth).reduce((s, r) => s + r.finalRate, 0) * 100) / 100

  const kpis: PaymentsKpis = { expectedMonthly, collectedMonthly, outstandingMonthly, nextMonthExpected }

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

      <PaymentsClient
        monthlyRows={sortRows(monthlyRows)}
        sessionRows={sortRows(sessionRows)}
        overdueRows={sortRows(overdueRows)}
        selectedMonth={selectedMonth}
        tenantId={tenantId}
        kpis={kpis}
      />
    </div>
  )
}
