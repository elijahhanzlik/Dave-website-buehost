"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Image,
  MapPin,
  Mail,
  Settings,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { Button, Card, PageHeader, Spinner } from "@/components/admin/ui";
import RichTitle from "@/components/RichTitle";

const ADMIN_BASE = "/dave-admin-website-wonderland";

interface Stats {
  totalWorks: number;
  totalPosts: number;
  unreadInquiries: number;
  latestUnread: { id: string; name: string; created_at: string } | null;
  recentWorks: Array<{ id: string; title: string; created_at: string }>;
  recentInquiries: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    status: string;
  }>;
}

/**
 * Every tile is a whole sentence about what happens if you press it. This is
 * the screen David lands on, so it answers "what do you want to do?" rather
 * than showing him three numbers and two icon buttons.
 */
const TILES = [
  {
    href: `${ADMIN_BASE}/works/new`,
    icon: Image,
    title: "Add a piece of artwork",
    hint: "Upload photos, give it a title and a category. It appears on your Gallery page straight away.",
  },
  {
    href: `${ADMIN_BASE}/exhibits/new`,
    icon: MapPin,
    title: "Add an exhibit",
    hint: "Where your work is hanging — the place, the dates and the opening hours.",
  },
  {
    href: `${ADMIN_BASE}/blog/new`,
    icon: BookOpen,
    title: "Write a blog post",
    hint: "Write it now, publish it now, or leave it as a draft only you can see.",
  },
  {
    href: `${ADMIN_BASE}/events/new`,
    icon: CalendarDays,
    title: "Add an event",
    hint: "Open studios, talks, workshops. Anything people should turn up to.",
  },
  {
    href: `${ADMIN_BASE}/inquiries`,
    icon: Mail,
    title: "Read your messages",
    hint: "Everything sent through your contact form lands here.",
  },
  {
    href: `${ADMIN_BASE}/settings`,
    icon: Settings,
    title: "Change a photo on the site",
    hint: "The homepage picture, the About banner and the Contact photo.",
  },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning, David";
  if (hour < 18) return "Good afternoon, David";
  return "Good evening, David";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState("");

  // Formatted after mount: the server and the browser can sit in different
  // time zones, and a mismatched date is a hydration error.
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [worksRes, postsRes, inquiriesRes] = await Promise.all([
          fetch("/api/artworks"),
          fetch("/api/blog?all=true"),
          fetch("/api/inquiries"),
        ]);

        const works = worksRes.ok ? await worksRes.json() : [];
        const posts = postsRes.ok ? await postsRes.json() : [];
        const inquiries = inquiriesRes.ok ? await inquiriesRes.json() : [];

        const unread = Array.isArray(inquiries)
          ? inquiries.filter((i: { status: string }) => i.status === "new")
          : [];

        setStats({
          totalWorks: Array.isArray(works) ? works.length : 0,
          totalPosts: Array.isArray(posts) ? posts.length : 0,
          unreadInquiries: unread.length,
          latestUnread: unread[0] ?? null,
          recentWorks: Array.isArray(works) ? works.slice(0, 5) : [],
          recentInquiries: Array.isArray(inquiries)
            ? inquiries.slice(0, 5)
            : [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner label="Getting your website…" />;

  const unread = stats?.unreadInquiries ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow={today || "Your website"}
        title={greeting()}
        subtitle="Everything on your website starts here. Nothing goes public until you press save."
      />

      {stats?.latestUnread && (
        <Card className="mb-6 flex flex-col gap-4 border-[#D3DCC5] bg-sage p-6 sm:flex-row sm:items-center">
          <Mail size={24} className="shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-[17px] font-bold text-admin-ink">
              {stats.latestUnread.name}
              {unread > 1
                ? ` and ${unread - 1} other${unread > 2 ? "s" : ""} sent you a message.`
                : " sent you a message."}
            </p>
            <p className="mt-1 text-[13.5px] leading-snug text-admin-muted">
              Through your contact form on{" "}
              {formatDate(stats.latestUnread.created_at)}.
            </p>
          </div>
          <Button href={`${ADMIN_BASE}/inquiries`} className="shrink-0">
            Read {unread > 1 ? "your messages" : "the message"}
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="flex items-start gap-[18px] rounded-[20px] border border-admin-line bg-admin-surface p-6 transition-colors hover:border-primary/30 hover:bg-sage/40"
          >
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage">
              <tile.icon size={26} className="text-primary" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-[21px] font-bold leading-tight text-admin-ink">
                {tile.title}
              </span>
              <span className="mt-1.5 block max-w-[38ch] text-[13.5px] leading-snug text-admin-muted">
                {tile.hint}
              </span>
            </span>
            <ArrowRight size={20} className="mt-4 shrink-0 text-gold-dark" />
          </Link>
        ))}
      </div>

      <div className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-[19px] font-bold text-admin-ink">
            Recently added artwork
          </h2>
          <p className="mt-1 text-[13px] text-admin-muted">
            {stats?.totalWorks ?? 0} piece
            {stats?.totalWorks === 1 ? "" : "s"} on your Gallery page in total.
          </p>
          {stats?.recentWorks.length ? (
            <ul className="mt-4 divide-y divide-admin-line-soft">
              {stats.recentWorks.map((w) => (
                <li key={w.id} className="flex items-center gap-3 py-2.5">
                  <Link
                    href={`${ADMIN_BASE}/works/${w.id}`}
                    className="flex-1 text-[15px] font-medium text-admin-ink hover:text-primary"
                  >
                    <RichTitle text={w.title} />
                  </Link>
                  <span className="text-xs text-admin-muted">
                    {formatDate(w.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-admin-muted">Nothing here yet.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-[19px] font-bold text-admin-ink">
            Recent messages
          </h2>
          <p className="mt-1 text-[13px] text-admin-muted">
            {unread === 0
              ? "Nothing waiting to be read."
              : `${unread} still to read.`}
          </p>
          {stats?.recentInquiries.length ? (
            <ul className="mt-4 divide-y divide-admin-line-soft">
              {stats.recentInquiries.map((inq) => (
                <li key={inq.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-admin-ink">
                      {inq.name}
                    </span>
                    <span className="block truncate text-xs text-admin-muted">
                      {inq.email}
                    </span>
                  </span>
                  {inq.status === "new" && (
                    <span className="shrink-0 rounded-full bg-gold/20 px-3 py-1 text-[12px] font-bold text-gold-dark">
                      Unread
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-admin-muted">
              No one has written to you yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
