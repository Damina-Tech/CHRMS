import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, getApiErrorMessage } from "@/services/api";
import {
  Building2,
  Home,
  KeyRound,
  Banknote,
  Wallet,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type Summary = {
  total_properties: number;
  available: number;
  rented: number;
  sold: number;
  maintenance: number;
  total_revenue: number;
  outstanding_balance: number;
};

type Trends = {
  monthly_revenue: { month: string; rental: number; sale: number; total: number }[];
  payment_trends: { month: string; total: number }[];
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const summaryQ = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await api.get<Summary>("/dashboard/summary");
      return res.data;
    },
  });

  const trendsQ = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: async () => {
      const res = await api.get<Trends>("/dashboard/trends");
      return res.data;
    },
  });

  const s = summaryQ.data;
  const err = summaryQ.error || trendsQ.error;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-blue-100">
          Chiro City Housing &amp; Rental Management — portfolio overview
        </p>
      </div>

      {err ? (
        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base">Could not load dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {getApiErrorMessage(err)}. Ensure the API is running and{" "}
            <code className="text-xs bg-muted px-1 rounded">VITE_API_URL</code>{" "}
            is set.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryQ.isLoading ? "—" : s?.total_properties ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryQ.isLoading ? "—" : s?.available ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rented</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryQ.isLoading ? "—" : s?.rented ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryQ.isLoading ? "—" : s?.sold ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total revenue</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryQ.isLoading
                ? "—"
                : `ETB ${(s?.total_revenue ?? 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rental + sale payments recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {summaryQ.isLoading
                ? "—"
                : `ETB ${(s?.outstanding_balance ?? 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding sales + uncovered current-month rent
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue</CardTitle>
            <CardDescription>Rental vs sale cash-in (last 12 months)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {trendsQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading chart…</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsQ.data?.monthly_revenue ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rental" fill="#2563eb" name="Rental" />
                  <Bar dataKey="sale" fill="#06b6d4" name="Sale" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment trends</CardTitle>
            <CardDescription>Total collections per month</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {trendsQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading chart…</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsQ.data?.payment_trends ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
