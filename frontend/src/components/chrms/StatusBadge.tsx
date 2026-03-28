import React from "react";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  rented: "bg-blue-100 text-blue-800",
  sold: "bg-violet-100 text-violet-800",
  maintenance: "bg-amber-100 text-amber-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  inactive: "bg-gray-100 text-gray-700",
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls = statusStyles[status] ?? "bg-gray-100 text-gray-700";
  return (
    <Badge variant="secondary" className={cls}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
};
