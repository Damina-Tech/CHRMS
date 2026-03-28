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
import { Badge } from "@/components/ui/badge";
import { api, getApiErrorMessage } from "@/services/api";
import { FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

type Row = {
  id: string;
  status: string;
  monthlyRent: number;
  dueDay: number;
  overdue: boolean;
  tenant: { fullName: string };
  property: { code: string };
  startDate: string;
};

export default function RentalsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rentals"],
    queryFn: async () => {
      const res = await api.get<Row[]>("/rentals");
      return res.data;
    },
  });

  const active = (data ?? []).filter((r) => r.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-7 w-7 text-blue-600" />
          Rentals
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Active leases, monthly rent, and overdue indicator
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active rentals</CardTitle>
          <CardDescription>
            Overdue when the current month is past the due day and rent is not
            fully covered
          </CardDescription>
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
                    <TableHead>Tenant</TableHead>
                    <TableHead>Monthly rent</TableHead>
                    <TableHead>Due day</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : active.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No active rentals
                      </TableCell>
                    </TableRow>
                  ) : (
                    active.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.property.code}
                        </TableCell>
                        <TableCell>{r.tenant.fullName}</TableCell>
                        <TableCell>
                          ETB {r.monthlyRent.toLocaleString()}
                        </TableCell>
                        <TableCell>{r.dueDay}</TableCell>
                        <TableCell>
                          {format(new Date(r.startDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {r.overdue ? (
                            <Badge
                              variant="destructive"
                              className="gap-1 font-normal"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Current</Badge>
                          )}
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
