"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

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

  const handleSave = async () => {
    const valid = settings.filter((s) => s.key.trim() !== "");
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: valid }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Failed to save");
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
    <div className="space-y-6 max-w-2xl">
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

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {settings.map((setting, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Key
              </label>
              <input
                type="text"
                value={setting.key}
                onChange={(e) => updateSetting(index, "key", e.target.value)}
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
                onChange={(e) => updateSetting(index, "value", e.target.value)}
                placeholder="Value"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              onClick={() => removeSetting(index)}
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 mt-5"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addSetting}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
      >
        <Plus size={16} /> Add Setting
      </button>
    </div>
  );
}
