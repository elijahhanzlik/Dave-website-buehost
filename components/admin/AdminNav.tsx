"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  BookOpen,
  MapPin,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/formatters";

const ADMIN_BASE = "/dave-admin-website-wonderland";

/**
 * One line under every section saying what lives there. `Pages` is new to this
 * list — the section has always existed but was only reachable by typing the
 * URL. The labels are the words the public site uses ("Gallery", not "Works")
 * so the admin and the site agree on what things are called.
 */
const navItems = [
  {
    href: `${ADMIN_BASE}/dashboard`,
    label: "Dashboard",
    desc: "Everything at a glance",
    icon: LayoutDashboard,
  },
  {
    href: `${ADMIN_BASE}/works`,
    label: "Gallery",
    desc: "The artwork on your Gallery page",
    icon: Image,
  },
  {
    href: `${ADMIN_BASE}/blog`,
    label: "Blog",
    desc: "Your written posts",
    icon: BookOpen,
  },
  {
    href: `${ADMIN_BASE}/about`,
    label: "About",
    desc: "Your photo, bio and info cards",
    icon: User,
  },
  {
    href: `${ADMIN_BASE}/exhibits`,
    label: "Exhibits",
    desc: "Where your work is hanging",
    icon: MapPin,
  },
  {
    href: `${ADMIN_BASE}/events`,
    label: "Events",
    desc: "Open studios, talks and services",
    icon: CalendarDays,
  },
  {
    href: `${ADMIN_BASE}/pages`,
    label: "Pages",
    desc: "Extra pages you build yourself",
    icon: FileText,
  },
  {
    href: `${ADMIN_BASE}/inquiries`,
    label: "Messages",
    desc: "Sent to you through your Contact form",
    icon: MessageSquare,
  },
  {
    href: `${ADMIN_BASE}/settings`,
    label: "Settings",
    desc: "Photos and banners across the site",
    icon: Settings,
  },
];

interface AdminNavProps {
  unreadCount: number;
}

export default function AdminNav({ unreadCount }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.push(`${ADMIN_BASE}/login`);
  };

  const footerButton =
    "flex min-h-[48px] w-full items-center gap-3 rounded-full border-[1.5px] border-cream/25 " +
    "px-5 text-left text-[14.5px] font-semibold text-cream transition-colors hover:bg-cream/10";

  const sidebarContent = (
    <>
      <div className="flex items-start justify-between px-3 pb-5">
        <div>
          <p className="font-display text-[21px] font-bold text-cream">
            David Schaldach
          </p>
          <p className="mt-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold">
            Website manager
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close the menu"
          className="rounded-full p-2 text-cream/70 hover:bg-cream/10 hover:text-cream lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const showBadge = item.label === "Messages" && unreadCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-start gap-3.5 rounded-[15px] px-4 py-3 transition-colors",
                isActive ? "bg-cream/15" : "hover:bg-cream/8",
              )}
            >
              <item.icon
                size={21}
                className={cn(
                  "mt-0.5 shrink-0",
                  isActive ? "text-cream" : "text-cream/70",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[15.5px] font-semibold leading-tight",
                      isActive ? "text-cream" : "text-cream/75",
                    )}
                  >
                    {item.label}
                  </span>
                  {showBadge && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-[#3A2E14]">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-cream/50">
                  {item.desc}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 flex-col gap-2.5 border-t border-cream/15 pt-3.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={footerButton}
        >
          <ExternalLink size={17} className="shrink-0" />
          See my live website
        </a>
        <button onClick={handleLogout} className={footerButton}>
          <LogOut size={17} className="shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle. Labelled, unlike the bare icon it replaces. */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-admin-line bg-admin-surface px-4 text-sm font-semibold text-primary shadow-sm lg:hidden"
      >
        <Menu size={18} /> Menu
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-admin-ink/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "sticky top-0 z-50 h-screen w-[292px] shrink-0 flex-col bg-primary-dark px-3.5 pb-4 pt-6",
          mobileOpen
            ? "fixed inset-y-0 left-0 flex shadow-2xl"
            : "hidden lg:flex",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
