"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ImageCropEditor, {
  DEFAULT_CROP,
} from "@/components/admin/ImageCropEditor";
import type { CropSettings } from "@/components/admin/ImageCropEditor";
import {
  ActionButton,
  Button,
  Card,
  ConfirmDialog,
  Field,
  PageHeader,
  Spinner,
  inputClass,
} from "@/components/admin/ui";

interface Setting {
  key: string;
  value: string;
}

const DEFAULT_KEYS = [
  "site_title",
  "tagline",
  "contact_email",
  "instagram_url",
  "twitter_url",
  "linkedin_url",
];

// Keys managed by dedicated sections below — kept out of the general list.
const SPECIAL_KEYS = new Set([
  "hero_image",
  "hero_crop",
  "about_banner",
  "contact_photo",
  "exhibits_banner",
  "home_exhibit_title",
  "home_exhibit_dates",
  "home_exhibit_time",
  "home_exhibit_address",
]);

/** The photos each have their own card, so their copy lives here. */
const PHOTOS = [
  {
    id: "about_banner",
    title: "The banner across your About page",
    hint: "The wide picture behind “About David” at the top of that page.",
  },
  {
    id: "contact_photo",
    title: "The photo on your Contact page",
    hint: "Shown beside the contact form. Without one, visitors see a quote card instead.",
  },
  {
    id: "exhibits_banner",
    title: "The banner across your Exhibits page",
    hint: "Leave this empty and the page uses the plain green background.",
  },
] as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const [heroImage, setHeroImage] = useState<string[]>([]);
  const [heroCrop, setHeroCrop] = useState<CropSettings>(DEFAULT_CROP);
  const [aboutBanner, setAboutBanner] = useState<string[]>([]);
  const [contactPhoto, setContactPhoto] = useState<string[]>([]);
  const [exhibitsBanner, setExhibitsBanner] = useState<string[]>([]);

  // Home badge — standalone, not read from the exhibits table.
  const [homeExhibit, setHomeExhibit] = useState({
    title: "",
    dates: "",
    time: "",
    address: "",
  });

  const photoState = {
    about_banner: [aboutBanner, setAboutBanner],
    contact_photo: [contactPhoto, setContactPhoto],
    exhibits_banner: [exhibitsBanner, setExhibitsBanner],
  } as const;

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const existing = data as Setting[];
          const existingKeys = new Set(existing.map((s) => s.key));
          const merged = [...existing];
          for (const key of DEFAULT_KEYS) {
            if (!existingKeys.has(key)) merged.push({ key, value: "" });
          }
          setSettings(merged);

          const val = (k: string) =>
            existing.find((s) => s.key === k)?.value ?? "";

          if (val("hero_image")) setHeroImage([val("hero_image")]);
          if (val("hero_crop")) {
            try {
              setHeroCrop(JSON.parse(val("hero_crop")));
            } catch {
              // A malformed crop just means the default framing.
            }
          }
          if (val("about_banner")) setAboutBanner([val("about_banner")]);
          if (val("contact_photo")) setContactPhoto([val("contact_photo")]);
          if (val("exhibits_banner")) setExhibitsBanner([val("exhibits_banner")]);

          setHomeExhibit({
            title: val("home_exhibit_title"),
            dates: val("home_exhibit_dates"),
            time: val("home_exhibit_time"),
            address: val("home_exhibit_address"),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (index: number, field: "key" | "value", val: string) => {
    setSettings((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s)),
    );
  };

  const addSetting = () => setSettings([...settings, { key: "", value: "" }]);

  const confirmRemove = () => {
    if (pendingRemove === null) return;
    setSettings(settings.filter((_, i) => i !== pendingRemove));
    setPendingRemove(null);
  };

  const handleSave = async () => {
    const allSettings = settings.filter(
      (s) => s.key.trim() !== "" && !SPECIAL_KEYS.has(s.key),
    );
    if (heroImage[0]) allSettings.push({ key: "hero_image", value: heroImage[0] });
    allSettings.push({ key: "hero_crop", value: JSON.stringify(heroCrop) });
    if (aboutBanner[0])
      allSettings.push({ key: "about_banner", value: aboutBanner[0] });
    if (contactPhoto[0])
      allSettings.push({ key: "contact_photo", value: contactPhoto[0] });
    if (exhibitsBanner[0])
      allSettings.push({ key: "exhibits_banner", value: exhibitsBanner[0] });
    // Pushed even when blank so the fields can be cleared.
    allSettings.push({ key: "home_exhibit_title", value: homeExhibit.title });
    allSettings.push({ key: "home_exhibit_dates", value: homeExhibit.dates });
    allSettings.push({ key: "home_exhibit_time", value: homeExhibit.time });
    allSettings.push({ key: "home_exhibit_address", value: homeExhibit.address });

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: allSettings }),
      });

      if (!res.ok) {
        let msg = `Failed to save (${res.status})`;
        try {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            msg = data.error?.toString() ?? msg;
          } catch {
            msg = `Server error (${res.status}): ${text.slice(0, 200)}`;
          }
        } catch {
          // couldn't read response
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

  if (loading) return <Spinner label="Getting your settings…" />;

  const generalSettings = settings.filter((s) => !SPECIAL_KEYS.has(s.key));

  const saveButton = (
    <ActionButton
      onClick={handleSave}
      disabled={saving}
      align="end"
      label={saving ? "Saving…" : saved ? "Saved" : "Save everything"}
      hint="All the changes on this screen go live at once."
      icon={
        saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : saved ? (
          <Check size={18} />
        ) : undefined
      }
    />
  );

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Photos and banners"
        subtitle="The big pictures across your website, and the card on your homepage. Nothing changes until you press save."
        action={saveButton}
      />

      {error && (
        <Card className="mb-6 border-admin-danger/30 bg-admin-danger/5 px-5 py-4">
          <p className="text-[15px] font-semibold text-admin-danger">
            That did not save.
          </p>
          <p className="mt-1 text-sm text-admin-muted">{error}</p>
        </Card>
      )}

      <div className="flex flex-col gap-6">
        {/* ------------------------------------------------ hero photo --- */}
        <Card className="p-7">
          <h2 className="font-display text-[21px] font-bold text-admin-ink">
            The big photo on your homepage
          </h2>
          <p className="mb-5 mt-1.5 max-w-[60ch] text-[13.5px] leading-relaxed text-admin-muted">
            The picture visitors see first, filling the whole screen. Drag it
            inside the frame below to choose what stays in view on a phone as
            well as a computer.
          </p>

          <ImageUploader
            images={heroImage}
            onChange={setHeroImage}
            multiple={false}
          />

          {heroImage[0] && (
            <div className="mt-5 rounded-[16px] border border-admin-line bg-sage/50 p-4">
              <ImageCropEditor
                imageUrl={heroImage[0]}
                crop={heroCrop}
                onChange={setHeroCrop}
                aspectRatio={16 / 9}
                label="Move and zoom the photo"
              />
            </div>
          )}
        </Card>

        {/* --------------------------------------------- other pictures -- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PHOTOS.map((photo) => {
            const [images, setImages] = photoState[photo.id];
            return (
              <Card key={photo.id} className="p-7">
                <h2 className="font-display text-[19px] font-bold leading-tight text-admin-ink">
                  {photo.title}
                </h2>
                <p className="mb-4 mt-1.5 text-[13px] leading-snug text-admin-muted">
                  {photo.hint}
                </p>
                <ImageUploader
                  images={images}
                  onChange={setImages}
                  multiple={false}
                />
              </Card>
            );
          })}
        </div>

        {/* ------------------------------------------------ home badge --- */}
        <Card className="p-7">
          <h2 className="font-display text-[21px] font-bold text-admin-ink">
            The card on your homepage
          </h2>
          <p className="mb-6 mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-admin-muted">
            The small panel over your homepage photo, usually pointing at
            wherever your work is hanging now. You write it here by hand — it
            does not read from your Exhibits page, so if you change one you
            need to change the other. Clear the title to hide the card
            altogether.
          </p>

          <Field
            label="Title"
            hint="Usually the place. Leave this empty to hide the card."
            htmlFor="badge-title"
          >
            <input
              id="badge-title"
              type="text"
              value={homeExhibit.title}
              onChange={(e) =>
                setHomeExhibit((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Logan's Espresso Cafe"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
            <Field
              label="Dates"
              hint="Written however you like."
              htmlFor="badge-dates"
            >
              <input
                id="badge-dates"
                type="text"
                value={homeExhibit.dates}
                onChange={(e) =>
                  setHomeExhibit((p) => ({ ...p, dates: e.target.value }))
                }
                placeholder="Aug 1 – 31, 2026"
                className={inputClass}
              />
            </Field>
            <Field
              label="Hours"
              hint="When people can turn up."
              htmlFor="badge-time"
            >
              <input
                id="badge-time"
                type="text"
                value={homeExhibit.time}
                onChange={(e) =>
                  setHomeExhibit((p) => ({ ...p, time: e.target.value }))
                }
                placeholder="7am – 9pm"
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Address"
            hint="Put a · between the street and the city so it splits onto two lines."
            htmlFor="badge-address"
          >
            <input
              id="badge-address"
              type="text"
              value={homeExhibit.address}
              onChange={(e) =>
                setHomeExhibit((p) => ({ ...p, address: e.target.value }))
              }
              placeholder="4790 Broadway, Unit 101 · Boulder, CO 80304"
              className={inputClass}
            />
          </Field>
        </Card>

        {/* -------------------------------------------------- key/value -- */}
        <Card className="p-7">
          <h2 className="font-display text-[21px] font-bold text-admin-ink">
            Everything else
          </h2>
          <p className="mb-5 mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed text-admin-muted">
            Small pieces of text used across the site — your site title, your
            contact email, your social links. Change a value on the right;
            leave the name on the left alone unless you know what it does.
          </p>

          <div className="flex flex-col gap-3">
            {generalSettings.map((setting, index) => {
              const realIndex = settings.findIndex(
                (s) => s.key === setting.key && s.value === setting.value,
              );
              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-[16px] border border-admin-line-soft p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 sm:w-[15rem]">
                    <label
                      htmlFor={`setting-key-${index}`}
                      className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.08em] text-admin-muted"
                    >
                      Name
                    </label>
                    <input
                      id={`setting-key-${index}`}
                      type="text"
                      value={setting.key}
                      onChange={(e) =>
                        updateSetting(realIndex, "key", e.target.value)
                      }
                      placeholder="setting_key"
                      className={`${inputClass} min-h-[48px] font-mono text-[14px]`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`setting-value-${index}`}
                      className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.08em] text-admin-muted"
                    >
                      Value
                    </label>
                    <input
                      id={`setting-value-${index}`}
                      type="text"
                      value={setting.value}
                      onChange={(e) =>
                        updateSetting(realIndex, "value", e.target.value)
                      }
                      placeholder="Value"
                      className={`${inputClass} min-h-[48px]`}
                    />
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => setPendingRemove(realIndex)}
                    className="shrink-0 sm:mt-5"
                  >
                    <Trash2 size={17} /> Remove
                  </Button>
                </div>
              );
            })}
          </div>

          <Button variant="secondary" onClick={addSetting} className="mt-4">
            <Plus size={17} /> Add another
          </Button>
        </Card>
      </div>

      <div className="mt-8">{saveButton}</div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={`Remove “${pendingRemove !== null ? (settings[pendingRemove]?.key ?? "") : ""}”?`}
        body="It disappears from this screen and stops being saved, so whatever uses it falls back to its built-in wording. The old value is kept in the database, not deleted."
        confirmLabel="Yes, remove it"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
