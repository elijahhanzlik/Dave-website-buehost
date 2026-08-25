"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { formatApiError, slugify } from "@/lib/formatters";
import StatusChoice from "@/components/admin/StatusChoice";
import {
  ActionButton,
  Card,
  Field,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

export interface EventData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: "draft" | "published";
  start_date: string | null;
  end_date: string | null;
}

/** One form for adding an event and for editing one. */
export default function EventForm({
  initialData,
}: {
  initialData?: EventData;
}) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status ?? "draft",
  );
  const [startDate, setStartDate] = useState(initialData?.start_date ?? "");
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Follow the title only while the web address has not been edited by hand;
    // changing a published event's address would break links people have.
    if (!isEditing || slug === slugify(initialData.title)) {
      setSlug(slugify(val));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("An event needs a title before it can be saved.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(
        isEditing ? `/api/events/${initialData.id}` : "/api/events",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug: slug || slugify(title),
            content,
            status,
            start_date: startDate || null,
            end_date: endDate || null,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(formatApiError(data.error, "Failed to save"));
      }

      if (isEditing) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      } else {
        router.push(`${ADMIN_BASE}/events`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <Card className="mb-6 border-admin-danger/30 bg-admin-danger/5 px-5 py-4">
          <p className="text-[15px] font-semibold text-admin-danger">
            That did not save.
          </p>
          <p className="mt-1 text-sm text-admin-muted">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-7">
          <Field
            label="Title"
            hint="What this is called on your Events page."
            htmlFor="event-title"
          >
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Web address"
            hint="The end of the link people share. It fills itself in from the title — only change it if you need to."
            htmlFor="event-slug"
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-mono text-[13px] text-admin-muted">
                /events/
              </span>
              <input
                id="event-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className={inputClass}
              />
            </div>
          </Field>

          <Field
            label="Details"
            hint="What is happening, and anything people should know before coming."
            htmlFor="event-content"
          >
            <textarea
              id="event-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Write the event or service details…"
              className={textareaClass}
            />
          </Field>
        </Card>

        <Card className="h-fit p-7">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
            When
          </p>
          <p className="mb-5 mt-1.5 text-[13px] leading-snug text-admin-muted">
            Leave the end date empty for something that happens on one day.
          </p>

          <Field
            label="First day"
            hint="The day it starts."
            htmlFor="event-start"
          >
            <input
              id="event-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Last day"
            hint="Only needed if it runs over more than one day."
            htmlFor="event-end"
          >
            <input
              id="event-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          <StatusChoice
            value={status}
            onChange={setStatus}
            publishedHint="It appears on your Events page for everyone."
            draftHint="It stays off your Events page until you change this."
          />
        </Card>
      </div>

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start">
        <ActionButton
          onClick={handleSave}
          disabled={saving}
          label={
            saving
              ? "Saving…"
              : saved
                ? "Saved"
                : isEditing
                  ? "Save this event"
                  : "Add this event"
          }
          hint={
            status === "published"
              ? "It goes on your Events page straight away."
              : "It is kept as a draft — nothing appears on your website."
          }
          icon={
            saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : saved ? (
              <Check size={18} />
            ) : undefined
          }
        />
        <ActionButton
          variant="secondary"
          size="lg"
          label="Cancel"
          hint="Goes back without saving anything."
          onClick={() => router.push(`${ADMIN_BASE}/events`)}
        />
      </div>
    </div>
  );
}
