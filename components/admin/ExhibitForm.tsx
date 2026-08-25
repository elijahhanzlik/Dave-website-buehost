"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { formatApiError, slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import StatusChoice from "@/components/admin/StatusChoice";
import {
  ActionButton,
  Card,
  Field,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

export interface ExhibitData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: "draft" | "published";
  event_dates: string | null;
  event_time: string | null;
  address: string | null;
  cover_image: string | null;
}

/**
 * One form for adding an exhibit and for editing one. They used to be two
 * separate screens that had drifted apart; anything added to one had to be
 * remembered for the other.
 */
export default function ExhibitForm({
  initialData,
}: {
  initialData?: ExhibitData;
}) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status ?? "draft",
  );
  const [eventDates, setEventDates] = useState(initialData?.event_dates ?? "");
  const [eventTime, setEventTime] = useState(initialData?.event_time ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [featureImage, setFeatureImage] = useState<string[]>(
    initialData?.cover_image ? [initialData.cover_image] : [],
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("An exhibit needs a title before it can be saved.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(
        isEditing ? `/api/exhibits/${initialData.id}` : "/api/exhibits",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug: slugify(title),
            content,
            status,
            event_dates: eventDates || null,
            event_time: eventTime || null,
            address: address || null,
            cover_image: featureImage[0] || null,
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
        router.push(`${ADMIN_BASE}/exhibits`);
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
            hint="The name of the show, café or gallery, as visitors will read it."
            htmlFor="exhibit-title"
          >
            <input
              id="exhibit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
            {title && (
              <p className="mt-2 font-mono text-[12.5px] text-admin-muted">
                Web address: /exhibits/{slugify(title)}
              </p>
            )}
          </Field>

          <Field
            label="Description"
            hint="What people will see, and anything they should know before going."
            htmlFor="exhibit-content"
          >
            <textarea
              id="exhibit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Describe the exhibit…"
              className={textareaClass}
            />
          </Field>

          <StatusChoice
            value={status}
            onChange={setStatus}
            publishedHint="It appears on your Exhibits page for everyone."
            draftHint="It stays off your Exhibits page until you change this."
          />
        </Card>

        <Card className="h-fit p-7">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
            Where and when
          </p>
          <p className="mb-5 mt-1.5 text-[13px] leading-snug text-admin-muted">
            All optional. Whatever you fill in shows on the exhibit&rsquo;s own
            page.
          </p>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Field
              label="Dates"
              hint="Written however you like."
              htmlFor="exhibit-dates"
            >
              <input
                id="exhibit-dates"
                type="text"
                value={eventDates}
                onChange={(e) => setEventDates(e.target.value)}
                placeholder="Aug 1 – 31, 2026"
                className={inputClass}
              />
            </Field>

            <Field
              label="Hours"
              hint="When people can turn up."
              htmlFor="exhibit-time"
            >
              <input
                id="exhibit-time"
                type="text"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="7am – 9pm"
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Address"
            hint="Put a · between the street and the city — it splits onto two lines and turns on the Get Directions link."
            htmlFor="exhibit-address"
          >
            <input
              id="exhibit-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="4790 Broadway, Unit 101 · Boulder, CO 80304"
              className={inputClass}
            />
          </Field>

          <Field
            label="Photo"
            hint="Shown at the top of the exhibit's page and beside it in the list."
          >
            <ImageUploader
              images={featureImage}
              onChange={setFeatureImage}
              multiple={false}
            />
          </Field>
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
                  ? "Save this exhibit"
                  : "Add this exhibit"
          }
          hint={
            status === "published"
              ? "It goes on your Exhibits page straight away."
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
          onClick={() => router.push(`${ADMIN_BASE}/exhibits`)}
        />
      </div>
    </div>
  );
}
