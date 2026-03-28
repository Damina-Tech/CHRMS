import React from "react";
import { Progress } from "@/components/ui/progress";

/** Thin wrapper around the design-system Progress for installment / sale completion */
export const PaymentProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <Progress value={Math.min(100, Math.max(0, value))} className="h-2" />
);

export const ProgressBar = PaymentProgressBar;
