import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Search, Home, Eye, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type PropertyRow = {
  id: string;
  code: string;
  location: string;
  type: string;
  status: string;
  assignee: string | null;
  woreda: string;
};

export default function PropertiesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [woreda, setWoreda] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "residential",
    woreda: "",
    kebele: "",
    houseNumber: "",
    rooms: "3",
    area: "70",
    condition: "good",
  });

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status !== "all") p.set("status", status);
    if (woreda !== "all") p.set("woreda", woreda);
    return p.toString();
  }, [q, status, woreda]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["properties", queryParams],
    queryFn: async () => {
      const url = queryParams ? `/properties?${queryParams}` : "/properties";
      const res = await api.get<PropertyRow[]>(url);
      return res.data;
    },
  });

  const woredas = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach((r) => s.add(r.woreda));
    return Array.from(s).sort();
  }, [data]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/properties", {
        code: form.code,
        type: form.type,
        woreda: form.woreda,
        kebele: form.kebele,
        houseNumber: form.houseNumber,
        rooms: Number(form.rooms),
        area: Number(form.area),
        condition: form.condition,
      });
      toast({ title: "Property created" });
      setOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: "Failed to create property",
        description: getApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="h-7 w-7 text-blue-600" />
            Properties
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Government-owned houses — search, filter, and open profiles
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add property</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New property</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label>Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Woreda</Label>
                  <Input
                    value={form.woreda}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, woreda: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Kebele</Label>
                  <Input
                    value={form.kebele}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, kebele: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>House number</Label>
                  <Input
                    value={form.houseNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, houseNumber: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Rooms</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.rooms}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rooms: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Area (m²)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.area}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, area: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Condition</Label>
                  <Input
                    value={form.condition}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, condition: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Save
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>Filter by status and woreda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search code, location..."
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={woreda} onValueChange={setWoreda}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Woreda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All woredas</SelectItem>
                {woredas.map((w) => (
                  <SelectItem key={w} value={w}>
                    Woreda {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenant / Buyer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : (data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No properties
                    </TableCell>
                  </TableRow>
                ) : (
                  (data ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.code}</TableCell>
                      <TableCell>{row.location}</TableCell>
                      <TableCell className="capitalize">{row.type}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>{row.assignee ?? "—"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/properties/${row.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/properties/${row.id}?edit=1`}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
