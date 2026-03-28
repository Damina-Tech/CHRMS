import { Decimal } from '@prisma/client/runtime/library';

/**
 * Core sale math: total paid from installment rows, remaining balance, completion %.
 * Spec: total_paid = SUM(sale_payments.amount)
 */
export function saleTotals(totalPrice: Decimal, payments: { amount: Decimal }[]) {
  const totalPriceNum = Number(totalPrice);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Math.max(0, totalPriceNum - totalPaid);
  const completionPercentage =
    totalPriceNum > 0 ? Math.min(100, (totalPaid / totalPriceNum) * 100) : 0;
  return {
    totalPrice: totalPriceNum,
    totalPaid,
    remaining,
    completionPercentage: Math.round(completionPercentage * 100) / 100,
    isCompleted: remaining <= 0,
  };
}
