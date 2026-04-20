"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  BookOpen,
  MapPin,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/formatters";

const ADMIN_BASE = "/admin-panel";

const navItems = [
  { href: `${ADMIN_BASE}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { href: `${ADMIN_BASE}/works`, label: "Works", icon: Image },
  { href: `${ADMIN_BASE}/blog`, label: "Blogs", icon: BookOpen },
  { href: `${ADMIN_BASE}/about`, label: "About", icon: User },
  { href: `${ADMIN_BASE}/exhibits`, label: "Exhibits", icon: MapPin },
  { href: `${ADMIN_BASE}/inquiries`, label: "Inquiries", icon: MessageSquare },
  { href: `${ADMIN_BASE}/settings`, label: "Settings", icon: Settings },
];

interface AdminNavProps {
  unreadCount: number;
}

export default function AdminNav({ unreadCount }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.push(`${ADMIN_BASE}/login`);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
        {!collapsed && (
          <span className="font-display text-primary font-semibold text-lg truncate">
            Admin
          </span>
        )}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
          className="p-1 rounded hover:bg-gray-100 hidden lg:block"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.label === "Inquiries" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-2 space-y-1 shrink-0">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          <ExternalLink size={18} className="shrink-0" />
          {!collapsed && <span>View Site</span>}
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all z-50",
          collapsed ? "w-16" : "w-60",
          mobileOpen
            ? "fixed inset-y-0 left-0 w-60 shadow-xl"
            : "hidden lg:flex",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
