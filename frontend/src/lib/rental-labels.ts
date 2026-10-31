export const SECURITY_DEPOSIT_METHOD = "security_deposit";

export type MonthRentStatus =
  | "not_due"
  | "unpaid"
  | "partial"
  | "paid"
  | "overdue";

export function formatPaymentMethod(method: string): string {
  switch (method) {
    case SECURITY_DEPOSIT_METHOD:
      return "Security deposit";
    case "cash":
      return "Cash";
    case "bank":
      return "Bank transfer";
    case "mobile":
      return "Mobile money";
    case "other":
      return "Other";
    default:
      return method;
  }
}

export function formatMonthRentStatus(status: string | null | undefined): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partial";
    case "unpaid":
      return "Unpaid";
    case "overdue":
      return "Overdue";
    case "not_due":
      return "Not due yet";
    default:
      return "—";
  }
}

export function rentalStatusHelp(status: string): string {
  switch (status) {
    case "active":
      return "Lease ongoing — rent payments and due reminders apply; property is rented.";
    case "completed":
      return "Only after the lease end date (term finished). For a 1-month lease, wait until that end date — not the same day you start.";
    case "cancelled":
      return "Use this if the lease stops early or is voided (including same day). Property is freed; payments stay on record.";
    default:
      return "";
  }
}
