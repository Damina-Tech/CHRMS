import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentProgressBar } from "@/components/chrms/PaymentProgressBar";
import { api, getApiErrorMessage } from "@/services/api";
import { Banknote } from "lucide-react";

type Row = {
  id: string;
  property: { code: string };
  buyer: { fullName: string };
  totalPrice: number;
  totalPaid: number;
  remaining: number;
  completionPercentage: number;
  status: string;
};

export default function SalesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const res = await api.get<Row[]>("/sales");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Banknote className="h-7 w-7 text-blue-600" />
          Property sales
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Installment sales — paid, remaining, and progress
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Installment contracts</CardTitle>
          <CardDescription>Progress reflects paid / total price</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive text-sm">
              {getApiErrorMessage(error)}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead className="min-w-[140px]">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : (data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No sales
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data ?? []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.property.code}
                        </TableCell>
                        <TableCell>{s.buyer.fullName}</TableCell>
                        <TableCell>
                          ETB {s.totalPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-green-700">
                          ETB {s.totalPaid.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-amber-700">
                          ETB {s.remaining.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <PaymentProgressBar value={s.completionPercentage} />
                          <span className="text-xs text-muted-foreground">
                            {s.completionPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
