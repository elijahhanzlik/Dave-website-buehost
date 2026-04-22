"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ImageCropEditor, {
  DEFAULT_CROP,
} from "@/components/admin/ImageCropEditor";
import type { CropSettings } from "@/components/admin/ImageCropEditor";

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Hero image state
  const [heroImage, setHeroImage] = useState<string[]>([]);
  const [heroCrop, setHeroCrop] = useState<CropSettings>(DEFAULT_CROP);

  // About banner state
  const [aboutBanner, setAboutBanner] = useState<string[]>([]);

  // Contact photo state
  const [contactPhoto, setContactPhoto] = useState<string[]>([]);

  // Exhibits banner state
  const [exhibitsBanner, setExhibitsBanner] = useState<string[]>([]);
  const [exhibitsIntro, setExhibitsIntro] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const existing = data as Setting[];
          const existingKeys = new Set(existing.map((s) => s.key));
          const merged = [...existing];
          for (const key of DEFAULT_KEYS) {
            if (!existingKeys.has(key)) {
              merged.push({ key, value: "" });
            }
          }
          setSettings(merged);

          // Load hero image from settings
          const heroSetting = existing.find((s) => s.key === "hero_image");
          if (heroSetting && heroSetting.value) {
            setHeroImage([heroSetting.value]);
          }
          const cropSetting = existing.find((s) => s.key === "hero_crop");
          if (cropSetting && cropSetting.value) {
            try {
              setHeroCrop(JSON.parse(cropSetting.value));
            } catch {
              // ignore
            }
          }

          // Load about banner from settings
          const aboutBannerSetting = existing.find((s) => s.key === "about_banner");
          if (aboutBannerSetting && aboutBannerSetting.value) {
            setAboutBanner([aboutBannerSetting.value]);
          }

          // Load contact photo from settings
          const contactPhotoSetting = existing.find((s) => s.key === "contact_photo");
          if (contactPhotoSetting && contactPhotoSetting.value) {
            setContactPhoto([contactPhotoSetting.value]);
          }

          // Load exhibits banner from settings
          const exhibitsBannerSetting = existing.find((s) => s.key === "exhibits_banner");
          if (exhibitsBannerSetting && exhibitsBannerSetting.value) {
            setExhibitsBanner([exhibitsBannerSetting.value]);
          }
          const exhibitsIntroSetting = existing.find((s) => s.key === "exhibits_intro");
          if (exhibitsIntroSetting) {
            setExhibitsIntro(exhibitsIntroSetting.value);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (index: number, field: "key" | "value", val: string) => {
    setSettings((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s)),
    );
  };

  const addSetting = () => {
    setSettings([...settings, { key: "", value: "" }]);
  };

  const removeSetting = (index: number) => {
    setSettings(settings.filter((_, i) => i !== index));
  };

  const MANAGED_KEYS = new Set([
    "hero_image",
    "hero_crop",
    "about_banner",
    "contact_photo",
    "exhibits_banner",
    "exhibits_intro",
  ]);

  const handleSave = async () => {
    // Merge hero settings into the settings list
    const allSettings = settings.filter(
      (s) => s.key.trim() !== "" && !MANAGED_KEYS.has(s.key),
    );
    if (heroImage[0]) {
      allSettings.push({ key: "hero_image", value: heroImage[0] });
    }
    allSettings.push({
      key: "hero_crop",
      value: JSON.stringify(heroCrop),
    });
    if (aboutBanner[0]) {
      allSettings.push({ key: "about_banner", value: aboutBanner[0] });
    }
    if (contactPhoto[0]) {
      allSettings.push({ key: "contact_photo", value: contactPhoto[0] });
    }
    if (exhibitsBanner[0]) {
      allSettings.push({ key: "exhibits_banner", value: exhibitsBanner[0] });
    }
    allSettings.push({ key: "exhibits_intro", value: exhibitsIntro });

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
            // Show first 200 chars of non-JSON response for debugging
            msg = `Server error (${res.status}): ${text.slice(0, 200)}`;
          }
        } catch {
          // couldn't read response
        }
        throw new Error(msg);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Filter out managed keys from the general settings display
  const generalSettings = settings.filter((s) => !MANAGED_KEYS.has(s.key));

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ===== HERO IMAGE SECTION ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          Hero Image
        </h2>
        <p className="text-sm text-gray-500">
          The full-bleed background photo on the homepage. Use the crop tool to position the focal point.
        </p>

        <ImageUploader
          images={heroImage}
          onChange={setHeroImage}
          multiple={false}
        />

        {heroImage[0] && (
          <ImageCropEditor
            imageUrl={heroImage[0]}
            crop={heroCrop}
            onChange={setHeroCrop}
            aspectRatio={16 / 9}
            label="Position & Zoom"
          />
        )}
      </div>

      {/* ===== ABOUT BANNER IMAGE SECTION ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          About Page Banner
        </h2>
        <p className="text-sm text-gray-500">
          Background image for the &ldquo;About David&rdquo; hero banner on the About page.
        </p>

        <ImageUploader
          images={aboutBanner}
          onChange={setAboutBanner}
          multiple={false}
        />
      </div>

      {/* ===== CONTACT PHOTO SECTION ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          Contact Page Photo
        </h2>
        <p className="text-sm text-gray-500">
          Photo displayed on the Contact page. Replaces the default quote card.
        </p>

        <ImageUploader
          images={contactPhoto}
          onChange={setContactPhoto}
          multiple={false}
        />
      </div>

      {/* ===== EXHIBITS BANNER SECTION ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          Exhibits Page Banner
        </h2>
        <p className="text-sm text-gray-500">
          Background image shown behind the &ldquo;Exhibits&rdquo; heading. Leave
          empty to use the default gradient.
        </p>

        <ImageUploader
          images={exhibitsBanner}
          onChange={setExhibitsBanner}
          multiple={false}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intro text
          </label>
          <textarea
            value={exhibitsIntro}
            onChange={(e) => setExhibitsIntro(e.target.value)}
            rows={3}
            placeholder="A record of past and present shows."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <p className="mt-1 text-xs text-gray-500">
            Short description shown under the banner.
          </p>
        </div>
      </div>

      {/* ===== GENERAL SETTINGS ===== */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          General Settings
        </h2>

        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {generalSettings.map((setting, index) => {
            // Find the real index in the full settings array
            const realIndex = settings.findIndex(
              (s) => s.key === setting.key && s.value === setting.value,
            );
            return (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Key
                  </label>
                  <input
                    type="text"
                    value={setting.key}
                    onChange={(e) =>
                      updateSetting(realIndex, "key", e.target.value)
                    }
                    placeholder="setting_key"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex-[2] min-w-0">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) =>
                      updateSetting(realIndex, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button
                  onClick={() => removeSetting(realIndex)}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 mt-5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={addSetting}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
        >
          <Plus size={16} /> Add Setting
        </button>
      </div>
    </div>
  );
}
