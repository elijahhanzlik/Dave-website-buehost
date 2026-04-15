"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";

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
          const get = (key: string) => data.find((s: { key: string; value: string }) => s.key === key)?.value ?? "";
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
        } catch { /* */ }
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

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          About Page
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
          {saved ? "Saved!" : "Save"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Profile Photo */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          Profile Photo
        </h2>
        <ImageUploader
          images={profilePhoto}
          onChange={setProfilePhoto}
          multiple={false}
        />
      </div>

      {/* Bio */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          Bio
        </h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={8}
          placeholder="Write your bio here..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Tagline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          Tagline
        </h2>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g., A unique perspective shaped by nature"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Info Cards */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold text-gray-900">
          Info Cards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
            <input
              type="text"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Focus</label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Preview</p>
        <div className="flex flex-col sm:flex-row gap-6">
          {profilePhoto[0] && (
            <div className="shrink-0">
              <img
                src={profilePhoto[0]}
                alt="Profile"
                className="w-40 h-40 object-cover rounded-2xl"
              />
            </div>
          )}
          <div className="space-y-3">
            {tagline && (
              <p className="font-display text-lg italic text-primary">{tagline}</p>
            )}
            {bio ? (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{bio}</p>
            ) : (
              <p className="text-sm text-gray-300 italic">No bio yet</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Based in</p>
            <p className="mt-1 font-display font-semibold">{location}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Background</p>
            <p className="mt-1 font-display font-semibold">{background}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Focus</p>
            <p className="mt-1 font-display font-semibold">{focus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
