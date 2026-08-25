"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/formatters";

/**
 * Replaces a bare `<select>` reading "Draft / Published". Those are database
 * words; this asks the question David is actually answering and says what each
 * answer means for the public site.
 */
export default function StatusChoice({
  value,
  onChange,
  publishedHint = "Anyone visiting your website can see it.",
  draftHint = "Only you can see it. Nothing appears on your website.",
}: {
  value: "draft" | "published";
  onChange: (next: "draft" | "published") => void;
  publishedHint?: string;
  draftHint?: string;
}) {
  const options = [
    {
      key: "published" as const,
      icon: Eye,
      label: "Everyone",
      hint: publishedHint,
    },
    {
      key: "draft" as const,
      icon: EyeOff,
      label: "Just me, for now",
      hint: draftHint,
    },
  ];

  return (
    <fieldset>
      <legend className="text-[15px] font-semibold text-admin-ink">
        Who can see this?
      </legend>
      <p className="mb-2.5 mt-1 text-[13px] leading-snug text-admin-muted">
        You can change this at any time.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <label
              key={opt.key}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[16px] border-[1.5px] p-4 transition-colors",
                active
                  ? "border-primary bg-sage"
                  : "border-admin-line bg-white hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name="visibility"
                checked={active}
                onChange={() => onChange(opt.key)}
                className="mt-1 h-5 w-5 shrink-0 accent-[#2D5016]"
              />
              <span>
                <span className="flex items-center gap-2 text-[15px] font-bold text-admin-ink">
                  <opt.icon size={17} className="text-primary" />
                  {opt.label}
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-admin-muted">
                  {opt.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
