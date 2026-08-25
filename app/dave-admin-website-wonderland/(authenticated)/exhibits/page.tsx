"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  ActionButton,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Spinner,
  StatusPill,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

interface Exhibit {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  event_dates: string | null;
  sort_order: number;
  created_at: string;
}

export default function ExhibitsListPage() {
  const router = useRouter();
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Exhibit | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/exhibits?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setExhibits(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...exhibits];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    const updated = reordered.map((e, i) => ({ ...e, sort_order: i }));
    setExhibits(updated);

    dragItem.current = null;
    dragOverItem.current = null;

    const res = await fetch("/api/exhibits/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: updated.map((e) => ({ id: e.id, sort_order: e.sort_order })),
      }),
    });

    // The optimistic order above is only a guess until the server confirms it.
    // On failure, re-read the authoritative order rather than leave the UI lying.
    if (!res.ok) {
      fetch("/api/exhibits?all=true")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setExhibits(data);
        });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setExhibits((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/exhibits/${id}`, { method: "DELETE" });
  };

  if (loading) return <Spinner label="Getting your exhibits…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Where your work is hanging"
        title="Exhibits"
        subtitle={
          exhibits.length
            ? "Listed in the order visitors see them. Drag a card by its handle to move an exhibit up or down."
            : "Shows, cafés and galleries where people can see your work in person."
        }
        action={
          <ActionButton
            href={`${ADMIN_BASE}/exhibits/new`}
            label="Add an exhibit"
            hint="The place, the dates and the hours."
            icon={<Plus size={20} />}
            align="end"
          />
        }
      />

      {exhibits.length === 0 ? (
        <EmptyState
          title="No exhibits yet"
          hint="Add the first place your work is hanging and it appears on your Exhibits page."
          action={
            <Button href={`${ADMIN_BASE}/exhibits/new`} size="lg">
              <Plus size={20} /> Add an exhibit
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {exhibits.map((exhibit, index) => (
            <Card
              key={exhibit.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
            >
              <span
                className="inline-flex w-fit cursor-grab items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[12.5px] font-bold text-primary active:cursor-grabbing"
                title="Drag to move this exhibit"
              >
                <GripVertical size={14} />
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[19px] font-bold leading-tight text-admin-ink">
                  {exhibit.title}
                </h2>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <StatusPill status={exhibit.status} />
                  <span className="text-[13.5px] text-admin-muted">
                    {exhibit.event_dates || "No dates set"}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`${ADMIN_BASE}/exhibits/${exhibit.id}`)
                  }
                  className="flex-1 sm:flex-none"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setPendingDelete(exhibit)}
                >
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
        body={
          pendingDelete?.status === "published"
            ? "This exhibit is on your website right now. Deleting it takes it down for good and it cannot be undone."
            : "This draft has never been published. Deleting it cannot be undone."
        }
        confirmLabel="Yes, delete it"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
