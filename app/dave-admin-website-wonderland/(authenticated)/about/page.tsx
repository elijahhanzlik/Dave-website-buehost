"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import {
  ActionButton,
  Card,
  Field,
  PageHeader,
  Spinner,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [profilePhoto, setProfilePhoto] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("Boulder, CO");
  const [background, setBackground] = useState("Certified Arborist");
  const [focus, setFocus] = useState("Ceramics & Painting");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const get = (key: string) =>
            data.find((s: { key: string; value: string }) => s.key === key)
              ?.value ?? "";
          setProfilePhoto(get("about_photo") ? [get("about_photo")] : []);
          setBio(get("about_bio") || "");
          setTagline(get("about_tagline") || "");
          setLocation(get("about_location") || "Boulder, CO");
          setBackground(get("about_background") || "Certified Arborist");
          setFocus(get("about_focus") || "Ceramics & Painting");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const settings = [
      { key: "about_photo", value: profilePhoto[0] || "" },
      { key: "about_bio", value: bio },
      { key: "about_tagline", value: tagline },
      { key: "about_location", value: location },
      { key: "about_background", value: background },
      { key: "about_focus", value: focus },
    ];

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        let msg = `Failed to save (${res.status})`;
        try {
          const data = await res.json();
          msg = data.error?.toString() ?? msg;
        } catch {
          /* */
        }
        throw new Error(msg);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Getting your About page…" />;

  return (
    <div>
      <PageHeader
        eyebrow="About"
        title="Your About page"
        subtitle="Your photo, who you are and the three small cards underneath. Everything here is public the moment you save."
      />

      {error && (
        <Card className="mb-6 border-admin-danger/30 bg-admin-danger/5 px-5 py-4">
          <p className="text-[15px] font-semibold text-admin-danger">
            That did not save.
          </p>
          <p className="mt-1 text-sm text-admin-muted">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="h-fit p-7">
          <Field
            label="Your photo"
            hint="Shown beside your bio at the top of the About page."
          >
            <ImageUploader
              images={profilePhoto}
              onChange={setProfilePhoto}
              multiple={false}
            />
          </Field>

          <Field
            label="Tagline"
            hint="One line, set in italics above your bio."
            htmlFor="about-tagline"
          >
            <input
              id="about-tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. A unique perspective shaped by nature"
              className={inputClass}
            />
          </Field>

          <Field
            label="Your bio"
            hint="Your story, in your own words. Leave a blank line between paragraphs."
            htmlFor="about-bio"
          >
            <textarea
              id="about-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={10}
              placeholder="Write your bio here…"
              className={textareaClass}
            />
          </Field>

          <p className="text-[15px] font-semibold text-admin-ink">
            The three cards
          </p>
          <p className="mb-4 mt-1 text-[13px] leading-snug text-admin-muted">
            The small boxes under your bio. Short answers work best.
          </p>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <Field label="Based in" htmlFor="about-location">
              <input
                id="about-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Background" htmlFor="about-background">
              <input
                id="about-background"
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Focus" htmlFor="about-focus">
              <input
                id="about-focus"
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card className="h-fit p-7">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
            What visitors will see
          </p>

          <div className="mt-5 flex flex-col gap-6 sm:flex-row">
            {profilePhoto[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profilePhoto[0]}
                alt="You"
                className="h-40 w-40 shrink-0 rounded-[20px] object-cover"
              />
            )}
            <div>
              {tagline && (
                <p className="font-display text-[19px] italic text-primary">
                  {tagline}
                </p>
              )}
              {bio ? (
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-admin-muted">
                  {bio}
                </p>
              ) : (
                <p className="mt-3 text-[15px] italic text-admin-muted/60">
                  No bio yet
                </p>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {[
              { label: "Based in", value: location },
              { label: "Background", value: background },
              { label: "Focus", value: focus },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-[16px] bg-sage p-4 text-center"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-dark">
                  {card.label}
                </p>
                <p className="mt-1.5 font-display text-[16px] font-bold text-admin-ink">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <ActionButton
          onClick={handleSave}
          disabled={saving}
          label={saving ? "Saving…" : saved ? "Saved" : "Save my About page"}
          hint="Your changes go live straight away."
          icon={
            saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : saved ? (
              <Check size={18} />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
