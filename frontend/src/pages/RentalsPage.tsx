import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { TablePagination } from "@/components/chrms/TablePagination";
import { buildPageParams, Paginated } from "@/lib/pagination";
import {
  FileText,
  AlertTriangle,
  Trash2,
  Pencil,
  Plus,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";

type Row = {
  id: string;
  status: string;
  agreementNumber?: string | null;
  agreementFile?: string | null;
  monthlyRent: number;
  deposit: number | null;
  overdue: boolean;
  tenant: { id: string; fullName: string };
  property: { id: string; code: string | null };
  startDate: string;
  endDate?: string | null;
};

type TenantOption = { id: string; fullName: string; status: string };
type PropertyOption = { id: string; code: string | null; status: string };

const emptyForm = {
  propertyId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  monthlyRent: "",
  deposit: "",
  status: "active",
};

export default function RentalsPage() {
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  const queryParams = buildPageParams({ page });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["rentals", queryParams],
    queryFn: async () => {
      const res = await api.get<Paginated<Row>>(`/rentals?${queryParams}`);
      return res.data;
    },
  });
  const { data: tenantOptions } = useQuery({
    queryKey: ["tenants", "options"],
    queryFn: async () => {
      const res = await api.get<Paginated<TenantOption>>(
        "/tenants?page=1&pageSize=100",
      );
      return res.data.items;
    },
  });
  const { data: propertyOptions } = useQuery({
    queryKey: ["properties", "options"],
    queryFn: async () => {
      const res = await api.get<Paginated<PropertyOption>>(
        "/properties?page=1&pageSize=100",
      );
      return res.data.items;
    },
  });

  const rows = data?.items ?? [];
  const active = rows.filter((r) => r.status === "active");
  const availableProperties = (propertyOptions ?? []).filter(
    (p) => p.status === "available",
  );
  const activeTenants = (tenantOptions ?? []).filter((t) => t.status === "active");

  const resetForm = () => {
    setForm(emptyForm);
    setAgreementFile(null);
  };

  const buildFormData = (includeIds: boolean) => {
    const fd = new FormData();
    if (includeIds) {
      fd.append("propertyId", form.propertyId);
      fd.append("tenantId", form.tenantId);
    }
    fd.append("startDate", form.startDate);
    if (form.endDate) fd.append("endDate", form.endDate);
    fd.append("monthlyRent", form.monthlyRent);
    if (form.deposit) fd.append("deposit", form.deposit);
    if (!includeIds) fd.append("status", form.status);
    if (agreementFile) fd.append("agreementFile", agreementFile);
    return fd;
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/rentals", buildFormData(true));
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
    setAgreementFile(null);
    setForm({
      propertyId: r.property.id,
      tenantId: r.tenant.id,
      startDate: r.startDate.slice(0, 10),
      endDate: r.endDate ? r.endDate.slice(0, 10) : "",
      monthlyRent: String(r.monthlyRent),
      deposit: r.deposit ? String(r.deposit) : "",
      status: r.status,
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/rentals/${editing.id}`, buildFormData(false));
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
            Active leases with auto agreement numbers and file upload
          </p>
        </div>
        <Dialog
          open={creating}
          onOpenChange={(o) => {
            setCreating(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add rental
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                        {p.code ?? p.id.slice(0, 8)}
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
              <div className="col-span-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Agreement number is generated automatically (e.g. RA-2026-0001).
              </div>
              <div className="col-span-2">
                <Label>Agreement file</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) =>
                    setAgreementFile(e.target.files?.[0] ?? null)
                  }
                />
              </div>
              <div>
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Monthly rent</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.monthlyRent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, monthlyRent: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label>Deposit</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.deposit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deposit: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full">
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rentals</CardTitle>
          <CardDescription>
            Newest first. Overdue when the previous month&apos;s rent is not
            fully covered ({active.length} active on this page)
          </CardDescription>
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
                    <TableHead>Agreement</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Monthly rent</TableHead>
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
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No rentals
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.agreementNumber ?? "—"}
                        </TableCell>
                        <TableCell>{r.property.code ?? "—"}</TableCell>
                        <TableCell>{r.tenant.fullName}</TableCell>
                        <TableCell>
                          ETB {r.monthlyRent.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {format(new Date(r.startDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {r.status === "active" && r.overdue ? (
                            <Badge
                              variant="destructive"
                              className="gap-1 font-normal"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </Badge>
                          ) : r.status === "active" ? (
                            <Badge variant="secondary">Current</Badge>
                          ) : (
                            <Badge variant="outline" className="capitalize">
                              {r.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={deletingId === r.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/rentals/${r.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  startEdit(r);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={deletingId === r.id}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setDeleteTarget(r);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
            <div className="col-span-2">
              <Label>Agreement number</Label>
              <Input value={editing?.agreementNumber ?? ""} disabled />
            </div>
            <div className="col-span-2">
              <Label>Agreement file</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) =>
                  setAgreementFile(e.target.files?.[0] ?? null)
                }
              />
              {editing?.agreementFile ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Current file attached. Upload a new file to replace it.
                </p>
              ) : null}
            </div>
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>End date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Monthly rent</Label>
              <Input
                type="number"
                min={0}
                value={form.monthlyRent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthlyRent: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label>Deposit</Label>
              <Input
                type="number"
                min={0}
                value={form.deposit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deposit: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
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
              <Button type="submit" className="w-full">
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {deleteTarget ? (
        <ConfirmActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
          title="Delete rental"
          description={`Delete rental ${deleteTarget.agreementNumber ?? deleteTarget.id}? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => {
            await handleDelete(deleteTarget);
          }}
        />
      ) : null}
    </div>
  );
}
