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
import { StatusBadge } from "@/components/chrms/StatusBadge";
import { api, getApiErrorMessage } from "@/services/api";
import { Users } from "lucide-react";

type Row = {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  propertyCode: string | null;
};

export default function TenantsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await api.get<Row[]>("/tenants");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-7 w-7 text-blue-600" />
          Tenants
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Residents linked to rental agreements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>Name, assigned property, contact</CardDescription>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : (data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No tenants
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data ?? []).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.fullName}</TableCell>
                        <TableCell>{t.propertyCode ?? "—"}</TableCell>
                        <TableCell>{t.phone}</TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} />
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
