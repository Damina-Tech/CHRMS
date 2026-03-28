import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentProgressBar } from "./PaymentProgressBar";

export interface PaymentSummaryCardProps {
  title?: string;
  description?: string;
  total: number;
  paid: number;
  remaining: number;
  completionPercentage: number;
  currency?: string;
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  title = "Payment summary",
  description,
  total,
  paid,
  remaining,
  completionPercentage,
  currency = "ETB",
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{fmt(total, currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid</p>
            <p className="text-lg font-semibold text-green-700">
              {fmt(paid, currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold text-amber-700">
              {fmt(remaining, currency)}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Progress</p>
          <PaymentProgressBar value={completionPercentage} />
          <p className="text-xs text-right text-muted-foreground mt-1">
            {completionPercentage.toFixed(1)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
