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
import { StatusBadge } from "@/components/chrms/StatusBadge";
import { api, getApiErrorMessage } from "@/services/api";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

type RentalRow = {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  monthlyRent: unknown;
  dueDay: number;
  property: { id: string; code: string; woreda: string; kebele: string };
};

type PurchaseRow = {
  id: string;
  status: string;
  totalPrice: unknown;
  startDate: string;
  property: { id: string; code: string };
};

type TenantDetail = {
  id: string;
  fullName: string;
  gender: string;
  phone: string;
  nationalId: string | null;
  familySize: number;
  status: string;
  rentals: RentalRow[];
  purchases: PurchaseRow[];
};

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<TenantDetail>(`/tenants/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading tenant…</p>;
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
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/tenants">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{data.fullName}</h1>
        <StatusBadge status={data.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Contact and identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Phone:</span> {data.phone}
          </p>
          <p>
            <span className="text-muted-foreground">Gender:</span>{" "}
            <span className="capitalize">{data.gender}</span>
          </p>
          <p>
            <span className="text-muted-foreground">National ID:</span>{" "}
            {data.nationalId ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Family size:</span>{" "}
            {data.familySize}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rentals</CardTitle>
          <CardDescription>Lease history for this tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.rentals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rentals</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {data.rentals.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-3"
                >
                  <div>
                    <Link
                      to={`/properties/${r.property.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.property.code}
                    </Link>
                    <span className="text-muted-foreground">
                      {" "}
                      · Woreda {r.property.woreda}, Kebele {r.property.kebele}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/rentals/${r.id}`}>View rental</Link>
                    </Button>
                  </div>
                  <p className="w-full text-muted-foreground">
                    ETB {Number(r.monthlyRent).toLocaleString()} · Due day{" "}
                    {r.dueDay} · Started{" "}
                    {format(new Date(r.startDate), "MMM d, yyyy")}
                    {r.endDate
                      ? ` · Ends ${format(new Date(r.endDate), "MMM d, yyyy")}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchases</CardTitle>
          <CardDescription>Sales linked to this tenant as buyer</CardDescription>
        </CardHeader>
        <CardContent>
          {data.purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchases</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.purchases.map((s) => (
                <li key={s.id} className="flex flex-wrap gap-2 border rounded-md p-3">
                  <Link
                    to={`/properties/${s.property.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {s.property.code}
                  </Link>
                  <StatusBadge status={s.status} />
                  <span className="text-muted-foreground">
                    ETB {Number(s.totalPrice).toLocaleString()} ·{" "}
                    {format(new Date(s.startDate), "MMM d, yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
