import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import React from 'react'
import { computeRate } from '@/lib/pricing'
import { MembersClient, type MemberRow } from '@/components/MembersClient'

interface Props {
  params: Promise<{ 'club-slug': string }>
}

export default async function MembersPage({ params }: Props) {
  const { 'club-slug': slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  const tenantId = String(
    typeof (user as { tenant?: unknown }).tenant === 'object' && (user as { tenant: unknown }).tenant !== null
      ? (user as { tenant: { id: unknown } }).tenant.id
      : (user as { tenant?: unknown }).tenant ?? '',
  )

  const [
    { docs: members },
    { docs: dependents },
    { docs: services },
    { docs: enrollments },
    { docs: receipts },
  ] = await Promise.all([
    payload.find({
      collection: 'users',
      where: { and: [{ tenant: { equals: tenantId } }, { role: { equals: 'member' } }] },
      sort: 'firstName',
      limit: 500,
      depth: 0,
    }),
    payload.find({
      collection: 'dependents',
      where: { tenant: { equals: tenantId } },
      limit: 500,
      depth: 0,
    }),
    payload.find({
      collection: 'services',
      where: { tenant: { equals: tenantId } },
      limit: 200,
      depth: 0,
    }),
    payload.find({
      collection: 'enrollments',
      where: { tenant: { equals: tenantId } },
      depth: 1,
      limit: 1000,
    }),
    payload.find({
      collection: 'receipts',
      where: { tenant: { equals: tenantId } },
      depth: 1,
      limit: 2000,
    }),
  ])

  // ── Compute receipt totals per enrollment ──────────────────────────────
  const receiptSums: Record<string, number> = {}
  for (const receipt of receipts) {
    const lines = (receipt as unknown as { lineItems?: { enrollment?: unknown; finalAmount?: number | null }[] }).lineItems ?? []
    for (const line of lines) {
      const eId = String(
        typeof line.enrollment === 'object' && line.enrollment !== null
          ? (line.enrollment as { id: unknown }).id
          : (line.enrollment ?? ''),
      )
      if (!eId) continue
      receiptSums[eId] = (receiptSums[eId] ?? 0) + (line.finalAmount ?? 0)
    }
  }

  // ── Compute per-member balance and enrolled services ───────────────────
  const memberBalance: Record<string, number> = {}
  const memberServiceIds: Record<string, Set<string>> = {}

  for (const e of enrollments) {
    const eAny = e as unknown as {
      id: number
      member?: { id: number; globalDiscountType?: string | null; globalDiscountValue?: number | null } | null
      service?: { id: number; fee?: number | null; sessionFee?: number | null } | null
      planType?: 'monthly' | 'sessions' | null
      planTotal?: number | null
      discountType?: string | null
      discountValue?: number | null
    }

    const memberId = eAny.member ? String(eAny.member.id) : null
    if (!memberId || !eAny.service) continue

    const planTotal = eAny.planTotal ?? 0
    if (planTotal === 0) continue

    const planType: 'monthly' | 'sessions' = eAny.planType === 'sessions' ? 'sessions' : 'monthly'
    const unitRate = planType === 'sessions' ? (eAny.service.sessionFee ?? 0) : (eAny.service.fee ?? 0)
    const { finalRate } = computeRate(
      unitRate,
      { discountType: eAny.discountType, discountValue: eAny.discountValue },
      { globalDiscountType: eAny.member?.globalDiscountType, globalDiscountValue: eAny.member?.globalDiscountValue },
    )
    const totalPlanValue = finalRate * planTotal
    const totalPaid = receiptSums[String(eAny.id)] ?? 0
    const balance = Math.max(0, totalPlanValue - totalPaid)

    memberBalance[memberId] = (memberBalance[memberId] ?? 0) + balance

    const svcId = String(eAny.service.id)
    if (!memberServiceIds[memberId]) memberServiceIds[memberId] = new Set()
    memberServiceIds[memberId]!.add(svcId)
  }

  // ── Group dependents by parent ─────────────────────────────────────────
  const depsByParent: Record<string, { id: string; firstName: string; lastName: string; dateOfBirth?: string | null }[]> = {}
  for (const dep of dependents) {
    const depAny = dep as unknown as { id: number; firstName?: string; lastName?: string; dateOfBirth?: string | null; parent?: number | { id: number } | null }
    const parentId = String(
      typeof depAny.parent === 'object' && depAny.parent !== null
        ? depAny.parent.id
        : (depAny.parent ?? ''),
    )
    if (!parentId) continue
    if (!depsByParent[parentId]) depsByParent[parentId] = []
    depsByParent[parentId]!.push({
      id: String(depAny.id),
      firstName: depAny.firstName ?? '',
      lastName: depAny.lastName ?? '',
      dateOfBirth: depAny.dateOfBirth,
    })
  }

  // ── Build MemberRow array ──────────────────────────────────────────────
  const memberRows: MemberRow[] = members.map((m) => {
    const mAny = m as unknown as { id: number; firstName?: string; lastName?: string; email: string; mobile?: string | null; landline?: string | null }
    const mId = String(mAny.id)
    return {
      id: mId,
      firstName: mAny.firstName ?? '',
      lastName: mAny.lastName ?? '',
      email: mAny.email,
      mobile: mAny.mobile,
      landline: mAny.landline,
      hasUnpaidBalance: (memberBalance[mId] ?? 0) > 0.01,
      enrolledServiceIds: [...(memberServiceIds[mId] ?? new Set())],
      dependents: depsByParent[mId] ?? [],
    }
  })

  const serviceList = services.map((s) => ({
    id: String((s as unknown as { id: number }).id),
    title: (s as unknown as { title: string }).title,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Μέλη</h2>
        <Link
          href={`/${slug}/dashboard/members/invite`}
          className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          + Πρόσκληση Μέλους
        </Link>
      </div>

      <MembersClient members={memberRows} services={serviceList} slug={slug} />
    </div>
  )
}
