import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, getApiErrorMessage } from "@/services/api";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaymentRow = {
  id: string;
  amount: unknown;
  paidAt: string;
  method: string;
  receiptNo: string | null;
};

type RentalDetail = {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  dueDay: number;
  deposit: number | string | null;
  overdue: boolean;
  tenant: { id: string; fullName: string; phone: string };
  property: {
    id: string;
    code: string;
    woreda: string;
    kebele: string;
    houseNumber: string;
  };
  payments: PaymentRow[];
};

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["rental", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<RentalDetail>(`/rentals/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading rental…</p>;
  }
  if (error || !data) {
    return (
      <p className="text-destructive">
        {error ? getApiErrorMessage(error) : "Not found"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/rentals">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Rental · {data.property.code}</h1>
        {data.status === "active" && data.overdue ? (
          <Badge variant="destructive" className="gap-1 font-normal">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        ) : (
          <Badge variant="secondary" className="capitalize">
            {data.status}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property</CardTitle>
            <CardDescription>Leased unit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              <Link
                to={`/properties/${data.property.id}`}
                className="text-primary hover:underline"
              >
                {data.property.code}
              </Link>
            </p>
            <p>
              Woreda {data.property.woreda}, Kebele {data.property.kebele}, #
              {data.property.houseNumber}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant</CardTitle>
            <CardDescription>Lessee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              <Link
                to={`/tenants/${data.tenant.id}`}
                className="text-primary hover:underline"
              >
                {data.tenant.fullName}
              </Link>
            </p>
            <p>{data.tenant.phone}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease terms</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Monthly rent:</span> ETB{" "}
            {data.monthlyRent.toLocaleString()}
          </p>
          <p>
            <span className="text-muted-foreground">Due day:</span> {data.dueDay}
          </p>
          <p>
            <span className="text-muted-foreground">Deposit:</span>{" "}
            {data.deposit != null && data.deposit !== ""
              ? `ETB ${Number(data.deposit).toLocaleString()}`
              : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Start:</span>{" "}
            {format(new Date(data.startDate), "MMM d, yyyy")}
          </p>
          <p>
            <span className="text-muted-foreground">End:</span>{" "}
            {data.endDate
              ? format(new Date(data.endDate), "MMM d, yyyy")
              : "Open-ended"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Recorded rent payments (newest first)</CardDescription>
        </CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {format(new Date(p.paidAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        ETB {Number(p.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell>{p.receiptNo ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
