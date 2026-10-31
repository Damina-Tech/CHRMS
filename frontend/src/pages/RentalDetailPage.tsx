import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, getApiErrorMessage } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatMonthRentStatus,
  formatPaymentMethod,
  rentalStatusHelp,
  SECURITY_DEPOSIT_METHOD,
  type MonthRentStatus,
} from "@/lib/rental-labels";

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
  agreementNumber?: string | null;
  agreementFile?: string | null;
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  deposit: number | string | null;
  overdue: boolean;
  paymentStatus?: MonthRentStatus | null;
  paidThisMonth?: number | null;
  balanceDue?: number | null;
  tenant: {
    id: string;
    fullName: string;
    phone: string;
    nationalId?: string | null;
    address?: string | null;
  };
  property: {
    id: string;
    code: string | null;
    type?: string;
    category?: string | null;
    woreda: string;
    kebele: string;
    houseNumber: string;
  };
  payments: PaymentRow[];
};

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    paidAt: format(new Date(), "yyyy-MM-dd"),
    method: "cash",
    receiptNo: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["rental", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<RentalDetail>(`/rentals/${id}`);
      return res.data;
    },
  });

  const createPay = useMutation({
    mutationFn: async () => {
      await api.post("/rental-payments", {
        rentalId: id,
        amount: Number(form.amount),
        paidAt: new Date(form.paidAt).toISOString(),
        method: form.method,
        receiptNo: form.receiptNo || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Payment recorded" });
      setOpen(false);
      setForm({
        amount: data ? String(data.monthlyRent) : "",
        paidAt: format(new Date(), "yyyy-MM-dd"),
        method: "cash",
        receiptNo: "",
      });
      qc.invalidateQueries({ queryKey: ["rental", id] });
      qc.invalidateQueries({ queryKey: ["rental-payments"] });
      qc.invalidateQueries({ queryKey: ["rentals"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      toast({
        title: "Could not record payment",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
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
        <Badge variant="outline" className="capitalize font-normal">
          {data.status}
        </Badge>
        {data.status === "active" && data.paymentStatus === "paid" ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 font-normal">
            This month: Paid · Balance ETB 0
          </Badge>
        ) : data.status === "active" && data.paymentStatus === "partial" ? (
          <Badge className="bg-amber-500 hover:bg-amber-500 font-normal">
            This month: Partial · Balance ETB{" "}
            {Number(data.balanceDue ?? 0).toLocaleString()}
          </Badge>
        ) : data.status === "active" && data.paymentStatus === "overdue" ? (
          <Badge variant="destructive" className="gap-1 font-normal">
            <AlertTriangle className="h-3 w-3" />
            Overdue · Balance ETB {Number(data.balanceDue ?? 0).toLocaleString()}
          </Badge>
        ) : data.status === "active" && data.paymentStatus === "unpaid" ? (
          <Badge variant="secondary" className="font-normal">
            Unpaid · Balance ETB {Number(data.balanceDue ?? 0).toLocaleString()}
          </Badge>
        ) : data.status === "active" ? (
          <Badge variant="secondary" className="font-normal">
            This month: {formatMonthRentStatus(data.paymentStatus)}
          </Badge>
        ) : null}
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
            {data.property.type ? (
              <p className="capitalize">
                {data.property.type}
                {data.property.category ? ` · ${data.property.category}` : ""}
              </p>
            ) : null}
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
            {data.tenant.address ? <p>{data.tenant.address}</p> : null}
            {data.tenant.nationalId ? (
              <p>National ID: {data.tenant.nationalId}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease terms</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Agreement:</span>{" "}
            {data.agreementNumber ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Agreement file:</span>{" "}
            {data.agreementFile ? (
              <a
                className="text-primary hover:underline"
                href={`${import.meta.env.VITE_API_URL || "http://localhost:3000"}${data.agreementFile}`}
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
            ) : (
              "—"
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Monthly rent:</span> ETB{" "}
            {data.monthlyRent.toLocaleString()}
          </p>
          <p>
            <span className="text-muted-foreground">Security deposit:</span>{" "}
            {data.deposit != null && data.deposit !== ""
              ? `ETB ${Number(data.deposit).toLocaleString()} (held, not rent)`
              : "—"}
          </p>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            {rentalStatusHelp(data.status)}
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Payments</CardTitle>
            <CardDescription>
              Security deposit and rent receipts (newest first). Deposit does
              not count toward monthly rent.
            </CardDescription>
          </div>
          {data.status === "active" ? (
            <Dialog
              open={open}
              onOpenChange={(o) => {
                setOpen(o);
                if (o && !form.amount) {
                  setForm((f) => ({
                    ...f,
                    amount: String(
                      data.balanceDue != null && data.balanceDue > 0
                        ? data.balanceDue
                        : data.monthlyRent,
                    ),
                  }));
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Record payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record rental payment</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    createPay.mutate();
                  }}
                >
                  <div>
                    <Label>Amount (ETB)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Paid on</Label>
                    <Input
                      type="date"
                      value={form.paidAt}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, paidAt: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select
                      value={form.method}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, method: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank transfer</SelectItem>
                        <SelectItem value="mobile">Mobile money</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Receipt no. (optional)</Label>
                    <Input
                      value={form.receiptNo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, receiptNo: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createPay.isPending}
                  >
                    {createPay.isPending ? "Saving…" : "Save payment"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
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
                      <TableCell>
                        {formatPaymentMethod(p.method)}
                        {p.method === SECURITY_DEPOSIT_METHOD ? (
                          <Badge variant="outline" className="ml-2 font-normal">
                            Held
                          </Badge>
                        ) : null}
                      </TableCell>
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
