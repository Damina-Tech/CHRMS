import { Decimal } from '@prisma/client/runtime/library';

/** Overdue when past due-day in the current month and rent for that month is not fully covered. */
export function isRentalOverdue(
  dueDay: number,
  monthlyRent: Decimal,
  payments: { paidAt: Date; amount: Decimal }[],
  asOf: Date = new Date(),
): boolean {
  const capDay = Math.min(Math.max(1, dueDay), 28);
  const y = asOf.getFullYear();
  const m = asOf.getMonth();
  const dueDate = new Date(y, m, capDay, 23, 59, 59, 999);
  if (asOf <= dueDate) return false;

  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  const paidThisMonth = payments
    .filter((p) => p.paidAt >= start && p.paidAt <= end)
    .reduce((s, p) => s + Number(p.amount), 0);

  return paidThisMonth < Number(monthlyRent);
}
