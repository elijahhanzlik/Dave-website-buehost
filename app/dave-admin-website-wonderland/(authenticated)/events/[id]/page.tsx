"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EventForm from "@/components/admin/EventForm";
import type { EventData } from "@/components/admin/EventForm";
import {
  Button,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

export default function EditEventPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Spinner label="Getting this event…" />;

  if (!event) {
    return (
      <EmptyState
        title="That event is not here"
        hint="It may have been deleted. Everything still listed is on the previous screen."
        action={
          <Button href={`${ADMIN_BASE}/events`} size="lg">
            Back to my events
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Editing an event"
        title={event.title || "Untitled event"}
        subtitle={
          event.status === "published"
            ? "This event is on your website. Saving replaces what visitors see right now."
            : "This event is a draft. Nobody can see it until you change that below."
        }
      />
      <EventForm initialData={event} />
    </div>
  );
}
