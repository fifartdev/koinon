export const MONTHS_GR = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος',
  'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος',
  'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος',
]

export function formatMonth(date: Date): string {
  return `${MONTHS_GR[date.getMonth()]} ${date.getFullYear()}`
}

function applyDiscount(base: number, type?: string | null, value?: number | null): number {
  if (!type || type === 'none' || value == null) return 0
  if (type === 'percent') return Math.round(base * value) / 100
  return value
}

export interface PricingResult {
  enrollmentDiscount: number
  globalDiscount: number
  finalRate: number
}

export function computeRate(
  baseRate: number,
  enrollment: { discountType?: string | null; discountValue?: number | null },
  member: { globalDiscountType?: string | null; globalDiscountValue?: number | null },
): PricingResult {
  const enrollmentDiscount = applyDiscount(baseRate, enrollment.discountType, enrollment.discountValue)
  const globalDiscount = applyDiscount(baseRate, member.globalDiscountType, member.globalDiscountValue)
  return {
    enrollmentDiscount,
    globalDiscount,
    finalRate: Math.max(0, baseRate - enrollmentDiscount - globalDiscount),
  }
}

export function nextPeriodDescription(
  planType: string,
  planStart: string,
  planTotal: number,
  unitsAlreadyInvoiced: number,
): string {
  if (planType === 'sessions') {
    const remaining = Math.max(0, planTotal - unitsAlreadyInvoiced)
    return `${remaining} συνεδρίες`
  }
  const start = new Date(planStart)
  const next = new Date(start.getFullYear(), start.getMonth() + unitsAlreadyInvoiced, 1)
  return formatMonth(next)
}

export function planIsComplete(planTotal: number, unitsAlreadyInvoiced: number): boolean {
  return planTotal > 0 && unitsAlreadyInvoiced >= planTotal
}
