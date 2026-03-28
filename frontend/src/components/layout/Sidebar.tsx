import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  BarChart3,
  Home,
  Users,
  FileText,
  Banknote,
  CreditCard,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
}

const menuItems = [
  { title: "Dashboard", icon: BarChart3, href: "/dashboard", permission: "dashboard.view" },
  { title: "Properties", icon: Home, href: "/properties", permission: "properties.read" },
  { title: "Tenants", icon: Users, href: "/tenants", permission: "tenants.read" },
  { title: "Rentals", icon: FileText, href: "/rentals", permission: "rentals.read" },
  { title: "Sales", icon: Banknote, href: "/sales", permission: "sales.read" },
  { title: "Payments", icon: CreditCard, href: "/payments", permission: "payments.read" },
  { title: "Reports", icon: BarChart3, href: "/reports", permission: "reports.view" },
];

const adminItems = [
  { title: "User Management", icon: Shield, href: "/admin/users", permission: "*" },
  { title: "System Settings", icon: Settings, href: "/admin/settings", permission: "*" },
];

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { user, logout, hasPermission } = useAuth();

  const filteredMenuItems = menuItems.filter(
    (item) => item.permission === "*" || hasPermission(item.permission)
  );

  const filteredAdminItems = adminItems.filter(
    (item) => item.permission === "*" || hasPermission(item.permission)
  );

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } h-full flex flex-col`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">CHRMS</h1>
              <p className="text-xs text-gray-500">Chiro City Housing</p>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.designation}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } ${isCollapsed ? "justify-center" : ""}`
                }
              >
                <Icon className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                {!isCollapsed && (
                  <>
                    {item.title}
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  </>
                )}
              </NavLink>
            );
          })}

          {filteredAdminItems.length > 0 && (
            <>
              <Separator className="my-3" />
              <div
                className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                  isCollapsed ? "text-center" : ""
                }`}
              >
                {!isCollapsed ? "Admin" : "A"}
              </div>
              {filteredAdminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? "bg-red-50 text-red-700 border-r-2 border-red-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } ${isCollapsed ? "justify-center" : ""}`
                    }
                  >
                    <Icon className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
                    {!isCollapsed && (
                      <>
                        {item.title}
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-gray-200">
        <Button
          variant="ghost"
          className={`w-full ${
            isCollapsed ? "px-2" : "justify-start"
          } text-red-600 hover:text-red-700 hover:bg-red-50`}
          onClick={logout}
        >
          <LogOut className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
