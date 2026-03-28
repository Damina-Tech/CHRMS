import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/chrms/StatusBadge";
import { PaymentSummaryCard } from "@/components/chrms/PaymentSummaryCard";
import { api, getApiErrorMessage } from "@/services/api";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

type DetailResponse = {
  property: {
    id: string;
    code: string;
    type: string;
    woreda: string;
    kebele: string;
    houseNumber: string;
    rooms: number;
    area: number;
    condition: string;
    status: string;
  };
  tenant: null | {
    id: string;
    fullName: string;
    phone: string;
    rental: {
      id: string;
      monthlyRent: number;
      dueDay: number;
      deposit: number | null;
      status: string;
      startDate: string;
    };
  };
  sale: null | {
    id: string;
    totalPrice: number;
    totalPaid: number;
    remaining: number;
    completionPercentage: number;
    isCompleted: boolean;
    buyer: { id: string; fullName: string; phone: string };
    downPayment: number;
    durationMonths: number;
    startDate: string;
    status: string;
  };
  paymentSummary: {
    context: "rental" | "sale" | null;
    total: number;
    paid: number;
    remaining: number;
    completionPercentage: number;
  };
};

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const edit = searchParams.get("edit") === "1";
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["property", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<DetailResponse>(`/properties/${id}`);
      return res.data;
    },
  });

  const [form, setForm] = useState({
    woreda: "",
    kebele: "",
    houseNumber: "",
    rooms: "",
    area: "",
    condition: "",
    status: "available",
  });

  useEffect(() => {
    if (!data?.property) return;
    const p = data.property;
    setForm({
      woreda: p.woreda,
      kebele: p.kebele,
      houseNumber: p.houseNumber,
      rooms: String(p.rooms),
      area: String(p.area),
      condition: p.condition,
      status: p.status,
    });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.put(`/properties/${id}`, {
        woreda: form.woreda,
        kebele: form.kebele,
        houseNumber: form.houseNumber,
        rooms: Number(form.rooms),
        area: Number(form.area),
        condition: form.condition,
        status: form.status,
      });
      toast({ title: "Property updated" });
      qc.invalidateQueries({ queryKey: ["property", id] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    } catch (err) {
      toast({
        title: "Update failed",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading property…</p>;
  }
  if (error || !data) {
    return (
      <p className="text-destructive">
        {error ? getApiErrorMessage(error) : "Not found"}
      </p>
    );
  }

  const { property, tenant, sale, paymentSummary } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/properties">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{property.code}</h1>
        <StatusBadge status={property.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property info</CardTitle>
            <CardDescription>Registered asset details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Type:</span>{" "}
              <span className="capitalize">{property.type}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Location:</span> Woreda{" "}
              {property.woreda}, Kebele {property.kebele}, #{property.houseNumber}
            </p>
            <p>
              <span className="text-muted-foreground">Rooms:</span>{" "}
              {property.rooms}
            </p>
            <p>
              <span className="text-muted-foreground">Area:</span>{" "}
              {property.area} m²
            </p>
            <p>
              <span className="text-muted-foreground">Condition:</span>{" "}
              {property.condition}
            </p>
          </CardContent>
        </Card>

        {sale ? (
          <PaymentSummaryCard
            title="Sale installments"
            description={`Buyer: ${sale.buyer.fullName}`}
            total={sale.totalPrice}
            paid={sale.totalPaid}
            remaining={sale.remaining}
            completionPercentage={sale.completionPercentage}
          />
        ) : paymentSummary.context === "rental" && tenant ? (
          <Card>
            <CardHeader>
              <CardTitle>Rental collections</CardTitle>
              <CardDescription>
                Recorded payments for active lease (not a full ledger)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <span className="text-muted-foreground">Monthly rent:</span>{" "}
                ETB {tenant.rental.monthlyRent.toLocaleString()}
              </p>
              <p className="text-sm mt-2">
                <span className="text-muted-foreground">Total recorded:</span>{" "}
                ETB {paymentSummary.paid.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Payment summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No active sale or rental payment summary.
            </CardContent>
          </Card>
        )}
      </div>

      {tenant ? (
        <Card>
          <CardHeader>
            <CardTitle>Tenant</CardTitle>
            <CardDescription>Current occupant (rented)</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{tenant.fullName}</p>
            <p>{tenant.phone}</p>
            <p>
              Rent ETB {tenant.rental.monthlyRent.toLocaleString()} · Due day{" "}
              {tenant.rental.dueDay}
            </p>
            <StatusBadge status={tenant.rental.status} />
          </CardContent>
        </Card>
      ) : null}

      {sale ? (
        <Card>
          <CardHeader>
            <CardTitle>Sale</CardTitle>
            <CardDescription>Installment contract</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{sale.buyer.fullName}</p>
            <p>{sale.buyer.phone}</p>
            <p>
              Down ETB {sale.downPayment.toLocaleString()} ·{" "}
              {sale.durationMonths} months plan
            </p>
            <StatusBadge status={sale.status} />
          </CardContent>
        </Card>
      ) : null}

      {edit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit property</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Woreda</Label>
                <Input
                  value={form.woreda}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, woreda: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Kebele</Label>
                <Input
                  value={form.kebele}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, kebele: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>House number</Label>
                <Input
                  value={form.houseNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, houseNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Rooms</Label>
                <Input
                  type="number"
                  value={form.rooms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rooms: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Area</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.area}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, area: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Condition</Label>
                <Input
                  value={form.condition}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, condition: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
