"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Image,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface Stats {
  totalWorks: number;
  totalPosts: number;
  unreadInquiries: number;
  recentWorks: Array<{ id: string; title: string; created_at: string }>;
  recentInquiries: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

        setStats({
          totalWorks: Array.isArray(works) ? works.length : 0,
          totalPosts: Array.isArray(posts) ? posts.length : 0,
          unreadInquiries: Array.isArray(inquiries)
            ? inquiries.filter(
                (i: { status: string }) => i.status === "new",
              ).length
            : 0,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-bold text-gray-900">
        Dashboard
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Image size={20} className="text-primary" />}
          value={stats?.totalWorks ?? 0}
          label="Total Works"
        />
        <StatCard
          icon={<BookOpen size={20} className="text-primary" />}
          value={stats?.totalPosts ?? 0}
          label="Blog Posts"
        />
        <StatCard
          icon={<MessageSquare size={20} className="text-primary" />}
          value={stats?.unreadInquiries ?? 0}
          label="Unread Inquiries"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dave-admin-website-wonderland/works/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Add Work
        </Link>
        <Link
          href="/dave-admin-website-wonderland/blog/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> New Blog Post
        </Link>
      </div>

      {/* Recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={16} /> Recent Works
          </h2>
          {stats?.recentWorks.length ? (
            <ul className="divide-y divide-gray-100">
              {stats.recentWorks.map((w) => (
                <li
                  key={w.id}
                  className="py-2 flex items-center justify-between"
                >
                  <Link
                    href={`/dave-admin-website-wonderland/works/${w.id}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {w.title}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {formatDate(w.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No works yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare size={16} /> Recent Inquiries
          </h2>
          {stats?.recentInquiries.length ? (
            <ul className="divide-y divide-gray-100">
              {stats.recentInquiries.map((inq) => (
                <li
                  key={inq.id}
                  className="py-2 flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-medium">{inq.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {inq.email}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      inq.status === "new"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {inq.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No inquiries yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
