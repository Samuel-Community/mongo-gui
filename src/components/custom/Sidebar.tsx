"use client";

import Link from "next/link";
import { Database, Server, Settings, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { name: "Databases", icon: Database, href: "/databases" },
    { name: "Server Stats", icon: Server, href: "/server-stats" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        {!mobileOpen && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="bg-white dark:bg-compass-bg shadow-md border-slate-200 dark:border-compass-border h-11 w-11 rounded-xl"
          >
            <Menu size={24} />
          </Button>
        )}
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "flex flex-col h-screen bg-white dark:bg-compass-sidebar border-r border-gray-200 dark:border-compass-border transition-all duration-300 fixed lg:relative z-40",
        "w-72", // Always 72 on desktop
        // Mobile positioning
        mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
      )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-compass-border h-16">
          <span className="font-bold text-xl text-blue-700 dark:text-compass-green truncate">
            MongoGUI
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button 
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 hover:bg-gray-200 dark:hover:bg-compass-border/30 rounded-lg text-gray-500"
            >
              <X size={22} />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-4 lg:py-3.5 text-gray-600 dark:text-compass-muted hover:bg-gray-100 dark:hover:bg-compass-border/30 hover:text-blue-700 dark:hover:text-compass-text transition-all group relative",
                  isActive && "bg-blue-50 dark:bg-compass-border/50 text-blue-700 dark:text-compass-green"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 dark:bg-compass-green rounded-r-full" />
                )}
                <item.icon size={22} className="min-w-[22px] group-hover:scale-110 transition-transform" />
                <span className="ml-4 font-medium transition-all duration-300 whitespace-nowrap">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-compass-border flex flex-col gap-3">
          <Button 
            variant="ghost" 
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 justify-start gap-4 px-4 h-12 lg:h-11 transition-all"
            onClick={handleLogout}
          >
            <LogOut size={22} className="min-w-[22px]" />
            <span className="transition-all duration-300">
              Logout
            </span>
          </Button>
        </div>
      </div>
    </>
  );
}
