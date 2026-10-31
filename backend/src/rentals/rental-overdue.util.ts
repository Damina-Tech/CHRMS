import { Decimal } from '@prisma/client/runtime/library';
import { isSecurityDepositPayment } from './rental-payment.constants';

type PaymentLike = {
  paidAt: Date;
  amount: Decimal | number;
  method?: string;
};

/** Cap due day so shorter months still work. */
export function dueDateForMonth(year: number, monthIndex: number, dueDay: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(Math.max(1, dueDay), Math.min(28, lastDay));
  return new Date(year, monthIndex, day, 23, 59, 59, 999);
}

function isRentPayment(p: PaymentLike): boolean {
  return !p.method || !isSecurityDepositPayment(p.method);
}

/** Amount paid toward rent in a calendar month (excludes security deposit). */
export function paidInMonth(
  payments: PaymentLike[],
  year: number,
  monthIndex: number,
): number {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return payments
    .filter(
      (p) => isRentPayment(p) && p.paidAt >= start && p.paidAt <= end,
    )
    .reduce((s, p) => s + Number(p.amount), 0);
}

/**
 * Whether this month's rent cycle applies for a rental that started on `startDate`.
 * If the lease starts after this month's due day, the first due is next month.
 */
export function isRentExpectedThisMonth(
  startDate: Date | string | null | undefined,
  dueDay: number,
  asOf: Date = new Date(),
): boolean {
  if (!startDate) return true;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const y = asOf.getFullYear();
  const m = asOf.getMonth();

  if (start.getFullYear() > y) return false;
  if (start.getFullYear() === y && start.getMonth() > m) return false;

  const due = dueDateForMonth(y, m, dueDay);
  if (start.getFullYear() === y && start.getMonth() === m && start > due) {
    return false;
  }
  return true;
}

export type MonthRentStatus =
  | 'not_due'
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overdue';

/**
 * Current-month rent payment status for an active rental.
 * Deposit payments are ignored.
 */
export function getMonthRentStatus(
  monthlyRent: Decimal | number,
  payments: PaymentLike[],
  dueDay: number,
  asOf: Date = new Date(),
  startDate?: Date | string | null,
): MonthRentStatus {
  if (!isRentExpectedThisMonth(startDate, dueDay, asOf)) return 'not_due';

  const y = asOf.getFullYear();
  const m = asOf.getMonth();
  const rent = Number(monthlyRent);
  const paid = paidInMonth(payments, y, m);
  const due = dueDateForMonth(y, m, dueDay);

  if (paid >= rent) return 'paid';
  if (asOf > due) return 'overdue';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

/** Rent coverage for a specific calendar month (no overdue — use for payment rows). */
export function getMonthCoverageStatus(
  monthlyRent: Decimal | number,
  payments: PaymentLike[],
  year: number,
  monthIndex: number,
): 'unpaid' | 'partial' | 'paid' {
  const rent = Number(monthlyRent);
  const paid = paidInMonth(payments, year, monthIndex);
  if (paid >= rent) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

/**
 * Overdue = this month's rent is expected, today is after the due day,
 * and rent payments this month are still short of monthly rent.
 * (Security deposit does not count.)
 */
export function isRentalOverdue(
  monthlyRent: Decimal | number,
  payments: PaymentLike[],
  dueDay: number,
  asOf: Date = new Date(),
  startDate?: Date | string | null,
): boolean {
  return (
    getMonthRentStatus(monthlyRent, payments, dueDay, asOf, startDate) ===
    'overdue'
  );
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
