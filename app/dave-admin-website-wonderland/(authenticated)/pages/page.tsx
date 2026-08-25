"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatDate, slugify } from "@/lib/formatters";
import {
  ActionButton,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Spinner,
  inputClass,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

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
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PageItem | null>(null);

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
          slug: slugify(newTitle),
          content_blocks: [],
        }),
      });
      if (res.ok) {
        const page = await res.json();
        router.push(`${ADMIN_BASE}/pages/${page.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setPages((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
  };

  if (loading) return <Spinner label="Getting your pages…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Extra pages"
        title="Pages"
        subtitle="Pages you build yourself out of blocks of text and pictures — anything that is not your Gallery, Blog, Exhibits or Events."
        action={
          <ActionButton
            label="Add a page"
            hint="Give it a name and start building."
            icon={<Plus size={20} />}
            align="end"
            onClick={() => setShowNew((v) => !v)}
          />
        }
      />

      {showNew && (
        <Card className="mb-6 p-6">
          <form onSubmit={handleCreate}>
            <label
              htmlFor="new-page-title"
              className="block text-[15px] font-semibold text-admin-ink"
            >
              What is this page called?
            </label>
            <span className="mb-2.5 mt-1 block text-[13px] leading-snug text-admin-muted">
              This becomes the heading and the web address. You can change it
              later.
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="new-page-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                placeholder="e.g. Commissions"
                className={inputClass}
              />
              <Button type="submit" disabled={creating} size="lg">
                {creating ? "Creating…" : "Create it"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowNew(false)}
              >
                Cancel
              </Button>
            </div>
            {newTitle && (
              <p className="mt-2.5 font-mono text-[12.5px] text-admin-muted">
                Web address: /{slugify(newTitle)}
              </p>
            )}
          </form>
        </Card>
      )}

      {pages.length === 0 ? (
        <EmptyState
          title="No extra pages yet"
          hint="Build a page out of text, pictures and galleries — a commissions page, a press page, whatever you need."
          action={
            <Button size="lg" onClick={() => setShowNew(true)}>
              <Plus size={20} /> Add a page
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[19px] font-bold leading-tight text-admin-ink">
                  {page.title}
                </h2>
                <p className="mt-1.5 font-mono text-[12.5px] text-admin-muted">
                  yoursite.com/{page.slug}
                </p>
                <p className="mt-1.5 text-[13.5px] text-admin-muted">
                  {page.content_blocks.length} block
                  {page.content_blocks.length === 1 ? "" : "s"} · last changed{" "}
                  {formatDate(page.updated_at)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`${ADMIN_BASE}/pages/${page.id}`)}
                  className="flex-1 sm:flex-none"
                >
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setPendingDelete(page)}>
                  <Trash2 size={17} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete “${pendingDelete?.title ?? ""}”?`}
        body={`This takes the page at /${pendingDelete?.slug ?? ""} off your website for good, along with everything on it. It cannot be undone.`}
        confirmLabel="Yes, delete it"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
