import { Decimal } from '@prisma/client/runtime/library';

/** Cap due day so shorter months still work. */
export function dueDateForMonth(year: number, monthIndex: number, dueDay: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(Math.max(1, dueDay), Math.min(28, lastDay));
  return new Date(year, monthIndex, day, 23, 59, 59, 999);
}

/** Amount paid toward rent in a calendar month (by paidAt). */
export function paidInMonth(
  payments: { paidAt: Date; amount: Decimal | number }[],
  year: number,
  monthIndex: number,
): number {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return payments
    .filter((p) => p.paidAt >= start && p.paidAt <= end)
    .reduce((s, p) => s + Number(p.amount), 0);
}

/**
 * Overdue when the current month's rent is not fully covered
 * and today is after the global due day for this month.
 */
export function isRentalOverdue(
  monthlyRent: Decimal | number,
  payments: { paidAt: Date; amount: Decimal | number }[],
  dueDay: number,
  asOf: Date = new Date(),
): boolean {
  const y = asOf.getFullYear();
  const m = asOf.getMonth();
  const due = dueDateForMonth(y, m, dueDay);
  if (asOf <= due) return false;
  return paidInMonth(payments, y, m) < Number(monthlyRent);
}

/** True when today is exactly `reminderDaysBefore` days before this month's due date. */
export function isReminderDay(
  dueDay: number,
  reminderDaysBefore: number,
  asOf: Date = new Date(),
): boolean {
  const y = asOf.getFullYear();
  const m = asOf.getMonth();
  const due = dueDateForMonth(y, m, dueDay);
  const reminder = new Date(due);
  reminder.setDate(reminder.getDate() - reminderDaysBefore);
  reminder.setHours(0, 0, 0, 0);
  const today = new Date(asOf);
  today.setHours(0, 0, 0, 0);
  return today.getTime() === reminder.getTime();
}
