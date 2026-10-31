/** Security deposit collected at lease start — not counted toward monthly rent. */
export const SECURITY_DEPOSIT_METHOD = 'security_deposit';

export const RENTAL_STATUSES = ['active', 'completed', 'cancelled'] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export function isSecurityDepositPayment(method: string): boolean {
  return method === SECURITY_DEPOSIT_METHOD;
}
