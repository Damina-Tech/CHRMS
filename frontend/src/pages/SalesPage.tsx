import React, { useState } from "react";
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
import { TablePagination } from "@/components/chrms/TablePagination";
import { api, getApiErrorMessage } from "@/services/api";
import { buildPageParams, Paginated } from "@/lib/pagination";
import { Banknote } from "lucide-react";

type Row = {
  id: string;
  property: { code: string | null };
  buyer: { fullName: string };
  totalPrice: number;
  totalPaid: number;
  remaining: number;
  completionPercentage: number;
  status: string;
};

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const queryParams = buildPageParams({ page });

  const { data, isLoading, error } = useQuery({
    queryKey: ["sales", queryParams],
    queryFn: async () => {
      const res = await api.get<Paginated<Row>>(`/sales?${queryParams}`);
      return res.data;
    },
  });

  const rows = data?.items ?? [];

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
          <CardDescription>Newest first — progress reflects paid / total price</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-destructive text-sm">
              {getApiErrorMessage(error)}
            </p>
          ) : (
            <>
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
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No sales
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.property.code ?? "—"}
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
              {data ? (
                <TablePagination
                  page={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
