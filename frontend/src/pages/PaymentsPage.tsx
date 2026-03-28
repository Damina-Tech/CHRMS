import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, getApiErrorMessage } from "@/services/api";
import { CreditCard } from "lucide-react";
import { format } from "date-fns";

type RentalPay = {
  id: string;
  amount: string;
  paidAt: string;
  method: string;
  receiptNo: string | null;
  rental: {
    property: { code: string };
    tenant: { fullName: string };
  };
};

type SalePay = {
  id: string;
  amount: string;
  paidAt: string;
  method: string;
  sale: {
    property: { code: string };
    buyer: { fullName: string };
  };
};

export default function PaymentsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const qp = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [from, to]);

  const rentalQ = useQuery({
    queryKey: ["rental-payments", qp],
    queryFn: async () => {
      const url = qp ? `/rental-payments?${qp}` : "/rental-payments";
      const res = await api.get<RentalPay[]>(url);
      return res.data;
    },
  });

  const saleQ = useQuery({
    queryKey: ["sale-payments", qp],
    queryFn: async () => {
      const url = qp ? `/sale-payments?${qp}` : "/sale-payments";
      const res = await api.get<SalePay[]>(url);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-blue-600" />
          Payments
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Rental receipts and sale installments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Optional date range (ISO date)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label>From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rental">
        <TabsList>
          <TabsTrigger value="rental">Rental payments</TabsTrigger>
          <TabsTrigger value="sale">Sale payments</TabsTrigger>
        </TabsList>
        <TabsContent value="rental">
          <Card>
            <CardHeader>
              <CardTitle>Rent receipts</CardTitle>
            </CardHeader>
            <CardContent>
              {rentalQ.error ? (
                <p className="text-destructive text-sm">
                  {getApiErrorMessage(rentalQ.error)}
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentalQ.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading…
                          </TableCell>
                        </TableRow>
                      ) : (rentalQ.data ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No records
                          </TableCell>
                        </TableRow>
                      ) : (
                        (rentalQ.data ?? []).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              {format(new Date(p.paidAt), "yyyy-MM-dd")}
                            </TableCell>
                            <TableCell>{p.rental.property.code}</TableCell>
                            <TableCell>{p.rental.tenant.fullName}</TableCell>
                            <TableCell>
                              ETB {Number(p.amount).toLocaleString()}
                            </TableCell>
                            <TableCell>{p.method}</TableCell>
                            <TableCell>{p.receiptNo ?? "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sale">
          <Card>
            <CardHeader>
              <CardTitle>Sale installments</CardTitle>
            </CardHeader>
            <CardContent>
              {saleQ.error ? (
                <p className="text-destructive text-sm">
                  {getApiErrorMessage(saleQ.error)}
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleQ.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Loading…
                          </TableCell>
                        </TableRow>
                      ) : (saleQ.data ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No records
                          </TableCell>
                        </TableRow>
                      ) : (
                        (saleQ.data ?? []).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              {format(new Date(p.paidAt), "yyyy-MM-dd")}
                            </TableCell>
                            <TableCell>{p.sale.property.code}</TableCell>
                            <TableCell>{p.sale.buyer.fullName}</TableCell>
                            <TableCell>
                              ETB {Number(p.amount).toLocaleString()}
                            </TableCell>
                            <TableCell>{p.method}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
