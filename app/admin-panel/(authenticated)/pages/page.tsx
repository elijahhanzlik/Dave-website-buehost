"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface PageItem {
  id: string;
  slug: string;
  title: string;
  content_blocks: unknown[];
  updated_at: string;
}

export default function PagesListPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPages(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug,
          content_blocks: [],
        }),
      });
      if (res.ok) {
        const page = await res.json();
        router.push(`/admin-panel/pages/${page.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Delete this page?")) return;
    setPages((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Pages
        </h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> New Page
        </button>
      </div>

      {showNew && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                setNewSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, ""),
                );
              }}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowNew(false)}
            className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
        </form>
      )}

      {pages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No pages yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                  Slug
                </th>
                <th className="w-20 px-4 py-3 font-medium text-gray-600">
                  Blocks
                </th>
                <th className="w-36 px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Updated
                </th>
                <th className="w-24 px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin-panel/pages/${page.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {page.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">
                    /{page.slug}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {page.content_blocks.length}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                    {formatDate(page.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-center">
                      <button
                        onClick={() =>
                          router.push(`/admin-panel/pages/${page.id}`)
                        }
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deletePage(page.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
