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
import { StatusBadge } from "@/components/chrms/StatusBadge";
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
import { Users, Trash2, Pencil, Plus, Eye, MoreHorizontal } from "lucide-react";

type Row = {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  propertyCode: string | null;
};

type TenantDetail = {
  id: string;
  fullName: string;
  gender: string;
  phone: string;
  nationalId: string | null;
  familySize: number;
  status: string;
};

export default function TenantsPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    gender: "male",
    phone: "",
    nationalId: "",
    familySize: "1",
    status: "active",
  });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await api.get<Row[]>("/tenants");
      return res.data;
    },
  });

  const resetForm = () => {
    setForm({
      fullName: "",
      gender: "male",
      phone: "",
      nationalId: "",
      familySize: "1",
      status: "active",
    });
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tenants", {
        fullName: form.fullName,
        gender: form.gender,
        phone: form.phone,
        nationalId: form.nationalId || undefined,
        familySize: Number(form.familySize),
        status: form.status,
      });
      toast({ title: "Tenant created" });
      setCreating(false);
      resetForm();
      refetch();
    } catch (err) {
      toast({
        title: "Failed to create tenant",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const startEdit = async (tenant: Row) => {
    try {
      const res = await api.get<TenantDetail>(`/tenants/${tenant.id}`);
      const detail = res.data;
      setEditing(tenant);
      setForm({
        fullName: detail.fullName ?? tenant.fullName,
        gender: detail.gender ?? "male",
        phone: detail.phone ?? tenant.phone,
        nationalId: detail.nationalId ?? "",
        familySize: String(detail.familySize ?? 1),
        status: detail.status ?? tenant.status ?? "active",
      });
    } catch (err) {
      toast({
        title: "Failed to load tenant details",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/tenants/${editing.id}`, {
        fullName: form.fullName,
        gender: form.gender,
        phone: form.phone,
        nationalId: form.nationalId.trim() || undefined,
        familySize: Number(form.familySize),
        status: form.status,
      });
      toast({ title: "Tenant updated" });
      setEditing(null);
      resetForm();
      refetch();
    } catch (err) {
      toast({
        title: "Failed to update tenant",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (tenant: Row) => {
    try {
      setDeletingId(tenant.id);
      await api.delete(`/tenants/${tenant.id}`);
      toast({ title: "Tenant deleted" });
      refetch();
    } catch (err) {
      toast({
        title: "Failed to delete tenant",
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
            <Users className="h-7 w-7 text-blue-600" />
            Tenants
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Residents linked to rental agreements
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New tenant</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitCreate} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Full name</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>National ID</Label>
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. CHI-10001"
                  value={form.nationalId}
                  onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
                />
              </div>
              <div>
                <Label>Family size</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.familySize}
                  onChange={(e) => setForm((f) => ({ ...f, familySize: e.target.value }))}
                  required
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
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : (data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={deletingId === t.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/tenants/${t.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  void startEdit(t);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={deletingId === t.id}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setDeleteTarget(t);
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
            <DialogTitle>Edit tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Full name</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>National ID</Label>
              <Input
                type="text"
                  autoComplete="off"
                placeholder="e.g. CHI-10001"
                value={form.nationalId}
                onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
              />
            </div>
            <div>
              <Label>Family size</Label>
              <Input
                type="number"
                min={0}
                value={form.familySize}
                onChange={(e) => setForm((f) => ({ ...f, familySize: e.target.value }))}
                required
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
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Button type="submit" className="w-full">Update</Button>
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
          title="Delete tenant"
          description={`Delete tenant ${deleteTarget.fullName}? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => {
            await handleDelete(deleteTarget);
          }}
        />
      ) : null}
    </div>
  );
}
