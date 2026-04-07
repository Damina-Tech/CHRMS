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
import { Badge } from "@/components/ui/badge";
import { ConfirmActionDialog } from "@/components/chrms/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
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
import { FileText, AlertTriangle, Trash2, Pencil, Plus } from "lucide-react";
import { format } from "date-fns";

type Row = {
  id: string;
  status: string;
  monthlyRent: number;
  dueDay: number;
  deposit: number | null;
  overdue: boolean;
  tenant: { id: string; fullName: string };
  property: { id: string; code: string };
  startDate: string;
  endDate?: string | null;
};

type TenantOption = { id: string; fullName: string; status: string };
type PropertyOption = { id: string; code: string; status: string };

export default function RentalsPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    propertyId: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    monthlyRent: "",
    dueDay: "1",
    deposit: "",
    status: "active",
  });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["rentals"],
    queryFn: async () => {
      const res = await api.get<Row[]>("/rentals");
      return res.data;
    },
  });
  const { data: tenantOptions } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await api.get<TenantOption[]>("/tenants");
      return res.data;
    },
  });
  const { data: propertyOptions } = useQuery({
    queryKey: ["properties", "all"],
    queryFn: async () => {
      const res = await api.get<PropertyOption[]>("/properties");
      return res.data;
    },
  });

  const active = (data ?? []).filter((r) => r.status === "active");
  const availableProperties = (propertyOptions ?? []).filter(
    (p) => p.status === "available",
  );
  const activeTenants = (tenantOptions ?? []).filter((t) => t.status === "active");

  const resetForm = () => {
    setForm({
      propertyId: "",
      tenantId: "",
      startDate: "",
      endDate: "",
      monthlyRent: "",
      dueDay: "1",
      deposit: "",
      status: "active",
    });
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/rentals", {
        propertyId: form.propertyId,
        tenantId: form.tenantId,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        monthlyRent: Number(form.monthlyRent),
        dueDay: Number(form.dueDay),
        deposit: form.deposit ? Number(form.deposit) : undefined,
      });
      toast({ title: "Rental created" });
      setCreating(false);
      resetForm();
      refetch();
    } catch (err) {
      toast({
        title: "Failed to create rental",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const startEdit = (r: Row) => {
    setEditing(r);
    setForm({
      propertyId: r.property.id,
      tenantId: r.tenant.id,
      startDate: r.startDate.slice(0, 10),
      endDate: r.endDate ? r.endDate.slice(0, 10) : "",
      monthlyRent: String(r.monthlyRent),
      dueDay: String(r.dueDay),
      deposit: r.deposit ? String(r.deposit) : "",
      status: r.status,
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/rentals/${editing.id}`, {
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        monthlyRent: Number(form.monthlyRent),
        dueDay: Number(form.dueDay),
        deposit: form.deposit ? Number(form.deposit) : undefined,
        status: form.status,
      });
      toast({ title: "Rental updated" });
      setEditing(null);
      resetForm();
      refetch();
    } catch (err) {
      toast({
        title: "Failed to update rental",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (rental: Row) => {
    try {
      setDeletingId(rental.id);
      await api.delete(`/rentals/${rental.id}`);
      toast({ title: "Rental deleted" });
      refetch();
    } catch (err) {
      toast({
        title: "Failed to delete rental",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" />
            Rentals
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Active leases, monthly rent, and overdue indicator
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add rental
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New rental</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitCreate} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Property</Label>
                <Select
                  value={form.propertyId}
                  onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Tenant</Label>
                <Select
                  value={form.tenantId}
                  onValueChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Monthly rent</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.monthlyRent}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyRent: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Due day</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.dueDay}
                  onChange={(e) => setForm((f) => ({ ...f, dueDay: e.target.value }))}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Deposit</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.deposit}
                  onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : active.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
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
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(r)}
                            className="mr-2"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <ConfirmActionDialog
                            title="Delete rental"
                            description={`Delete rental for ${r.property.code} / ${r.tenant.fullName}? This action cannot be undone.`}
                            confirmLabel="Delete"
                            onConfirm={() => handleDelete(r)}
                            disabled={deletingId === r.id}
                          >
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === r.id}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              {deletingId === r.id ? "Deleting..." : "Delete"}
                            </Button>
                          </ConfirmActionDialog>
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

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit rental</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Property</Label>
              <Input value={editing?.property.code ?? ""} disabled />
            </div>
            <div className="col-span-2">
              <Label>Tenant</Label>
              <Input value={editing?.tenant.fullName ?? ""} disabled />
            </div>
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>End date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Monthly rent</Label>
              <Input
                type="number"
                min={0}
                value={form.monthlyRent}
                onChange={(e) => setForm((f) => ({ ...f, monthlyRent: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Due day</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={form.dueDay}
                onChange={(e) => setForm((f) => ({ ...f, dueDay: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Deposit</Label>
              <Input
                type="number"
                min={0}
                value={form.deposit}
                onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Button type="submit" className="w-full">Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
