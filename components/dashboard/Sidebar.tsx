"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  LayoutDashboard,
  Users,
  Send,
  Calendar,
  FileText,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Shield,
  Smartphone,
} from "lucide-react";

const WA_REQUIRED_LINKS = [
  "/dashboard/contacts",
  "/dashboard/blast",
  "/dashboard/schedule",
  "/dashboard/templates",
  "/dashboard/logs",
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [waConnected, setWaConnected] = useState<boolean | null>(null);
  const statusChecked = useRef(false);

  const role = session?.user?.role;
  const isAdmin = role === "admin";

  useEffect(() => {
    if (isAdmin) return;

    const check = () => {
      fetch("/api/wa/status")
        .then((r) => r.json())
        .then((data) => {
          setWaConnected(data.connected);
        })
        .catch(() => {
          setWaConnected(false);
        });
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Pengguna", icon: Shield },
  ];

  const staffNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/contacts", label: "Kontak", icon: Users },
    { href: "/dashboard/blast", label: "Blast", icon: Send },
    { href: "/dashboard/schedule", label: "Jadwal", icon: Calendar },
    { href: "/dashboard/templates", label: "Template", icon: FileText },
    { href: "/dashboard/logs", label: "Logs", icon: ClipboardList },
  ];

  const navItems = isAdmin ? adminNavItems : staffNavItems;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isWALocked = (href: string) => {
    if (isAdmin) return false;
    if (waConnected === null || waConnected) return false;
    return WA_REQUIRED_LINKS.includes(href);
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (isWALocked(href)) {
      e.preventDefault();
      router.push("/dashboard/connect");
    } else {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className={cn("flex h-full flex-col", collapsed && "items-center")}>
      <div className={cn(
        "flex items-center border-b border-slate-800 p-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-whatsapp">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">
              WA Blast <span className="text-whatsapp">UPJ</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden text-slate-400 hover:text-white lg:block"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            isAdmin
              ? "bg-blue-500/10 text-blue-400"
              : "bg-emerald-500/10 text-emerald-400"
          )}>
            {isAdmin ? "Admin" : "Staff"}
          </span>

          {!isAdmin && waConnected === false && (
            <Link
              href="/dashboard/connect"
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20"
            >
              <Smartphone className="h-3.5 w-3.5 shrink-0" />
              Hubungkan WhatsApp
            </Link>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const locked = isWALocked(item.href);
          return (
            <Link
              key={item.href}
              href={locked ? "/dashboard/connect" : item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                locked
                  ? "cursor-not-allowed text-slate-600"
                  : isActive(item.href)
                    ? "bg-whatsapp/10 text-whatsapp"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={locked ? "Hubungkan WhatsApp terlebih dahulu" : collapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", locked && "opacity-50")} />
              {!collapsed && (
                <span className={cn(locked && "opacity-50")}>{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-slate-800 p-3", collapsed && "flex justify-center")}>
        {!collapsed && role && (
          <div className="mb-2 px-3 py-2 text-xs text-slate-500">
            <span className="font-medium capitalize text-slate-400">{session?.user?.name || role}</span>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center px-2"
          )}
          title="Keluar"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );

  const mobileOverlay = mobileOpen && (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-800 bg-slate-950 transition-transform duration-300 lg:hidden">
        {sidebarContent}
      </aside>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-slate-900 p-2 text-slate-400 shadow-lg lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOverlay}

      <aside className={cn(
        "hidden border-r border-slate-800 bg-slate-950 transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
