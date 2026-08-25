"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatDateRange } from "@/lib/formatters";
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

interface EventItem {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export default function EventsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<EventItem | null>(null);

  useEffect(() => {
    fetch("/api/events?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/events/${id}`, { method: "DELETE" });
  };

  if (loading) return <Spinner label="Getting your events…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Coming up"
        title="Events"
        subtitle="Open studios, talks, workshops and services. Drafts stay private until you publish them."
        action={
          <ActionButton
            href={`${ADMIN_BASE}/events/new`}
            label="Add an event"
            hint="Anything people should turn up to."
            icon={<Plus size={20} />}
            align="end"
          />
        }
      />

      {events.length === 0 ? (
        <EmptyState
          title="Nothing scheduled yet"
          hint="Add an open studio, a talk or a workshop and it appears on your Events page."
          action={
            <Button href={`${ADMIN_BASE}/events/new`} size="lg">
              <Plus size={20} /> Add an event
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {events.map((event) => (
            <Card
              key={event.id}
              className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[19px] font-bold leading-tight text-admin-ink">
                  {event.title}
                </h2>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <StatusPill status={event.status} />
                  <span className="text-[13.5px] text-admin-muted">
                    {formatDateRange(event.start_date, event.end_date) ||
                      "No dates set"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`${ADMIN_BASE}/events/${event.id}`)}
                  className="flex-1 sm:flex-none"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setPendingDelete(event)}
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
            ? "This event is on your website right now. Deleting it takes it down for good and it cannot be undone."
            : "This draft has never been published. Deleting it cannot be undone."
        }
        confirmLabel="Yes, delete it"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
