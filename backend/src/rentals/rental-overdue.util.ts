import { Decimal } from '@prisma/client/runtime/library';

/**
 * Overdue when the previous calendar month's rent is not fully covered
 * (no fixed due-day on the agreement).
 */
export function isRentalOverdue(
  monthlyRent: Decimal,
  payments: { paidAt: Date; amount: Decimal }[],
  asOf: Date = new Date(),
): boolean {
  const y = asOf.getFullYear();
  const m = asOf.getMonth();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const paidPrevMonth = payments
    .filter((p) => p.paidAt >= start && p.paidAt <= end)
    .reduce((s, p) => s + Number(p.amount), 0);

  return paidPrevMonth < Number(monthlyRent);
}
