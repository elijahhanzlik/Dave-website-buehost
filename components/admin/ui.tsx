"use client";

/**
 * The admin's shared vocabulary — "warm cards".
 *
 * Before this file every button, card, input and status pill in the admin was a
 * hand-written Tailwind string copied between ~15 screens, in stock grays that
 * matched nothing on the public site. Everything visual now comes from here, so
 * a change to a control is one edit rather than fifteen.
 *
 * Two rules the whole admin leans on:
 *   1. Every action carries a plain sentence saying what it does. That is the
 *      point of `ActionButton` and of `Field`'s `hint` — not decoration.
 *   2. Touch targets are large enough to use on a phone (48px minimum, 58px for
 *      the primary action on a screen).
 */

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/formatters";

/* ------------------------------------------------------------------ buttons */

type Variant = "primary" | "secondary" | "gold" | "danger" | "ghost";
type Size = "lg" | "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-cream border-transparent hover:bg-primary-dark",
  secondary:
    "bg-transparent text-primary border-primary/25 hover:bg-sage",
  gold: "bg-gold text-[#3A2E14] border-transparent hover:bg-gold-dark",
  danger:
    "bg-transparent text-admin-danger border-admin-danger/25 hover:bg-admin-danger/8",
  ghost:
    "bg-transparent text-admin-muted border-transparent hover:bg-sage hover:text-primary",
};

const SIZES: Record<Size, string> = {
  lg: "min-h-[58px] px-6 text-base gap-3",
  md: "min-h-[48px] px-5 text-[15px] gap-2.5",
  sm: "min-h-[40px] px-4 text-sm gap-2",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-full border-[1.5px] font-body font-semibold " +
  "transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-dark";

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Renders a Next `<Link>` instead of a `<button>`. */
  href?: string;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", href, full, className, children, ...rest },
    ref,
  ) {
    const cls = buttonClass(variant, size, cn(full && "w-full", className));
    if (href) {
      return (
        <Link href={href} className={cls}>
          {children}
        </Link>
      );
    }
    return (
      <button ref={ref} type="button" className={cls} {...rest}>
        {children}
      </button>
    );
  },
);

/**
 * A button with a sentence under it explaining what pressing it does.
 * `align="end"` is for the action that sits in a page header, right-aligned.
 */
export function ActionButton({
  label,
  hint,
  icon,
  href,
  onClick,
  variant = "primary",
  size = "lg",
  align = "start",
  disabled,
  type,
  full,
}: {
  label: string;
  hint: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  align?: "start" | "end" | "stretch";
  disabled?: boolean;
  type?: "button" | "submit";
  full?: boolean;
}) {
  const cls = buttonClass(variant, size, cn(full && "w-full"));
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "end"
          ? "items-stretch sm:items-end"
          : align === "stretch"
            ? "items-stretch"
            : "items-start",
      )}
    >
      {href ? (
        <Link href={href} className={cls}>
          {icon}
          {label}
        </Link>
      ) : (
        <button
          type={type ?? "button"}
          onClick={onClick}
          disabled={disabled}
          className={cls}
        >
          {icon}
          {label}
        </button>
      )}
      <span
        className={cn(
          "max-w-[34ch] text-[13.5px] leading-snug text-admin-muted",
          align === "end" && "sm:text-right",
        )}
      >
        {hint}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------- page header */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-[64ch]">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 font-display text-[30px] font-bold leading-tight tracking-[-0.015em] text-admin-ink sm:text-[36px]">
          {title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-admin-muted">
          {subtitle}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/* --------------------------------------------------------------- containers */

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-admin-line bg-admin-surface",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-8 py-16 text-center">
      <p className="font-display text-[22px] font-bold text-admin-ink">
        {title}
      </p>
      <p className="max-w-[46ch] text-[15px] leading-relaxed text-admin-muted">
        {hint}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </Card>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-admin-line border-t-primary" />
      <p className="text-sm text-admin-muted">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------- fields */

export const inputClass =
  "w-full min-h-[56px] rounded-[14px] border-[1.5px] border-admin-line bg-white px-[18px] py-[15px] " +
  "font-body text-base text-admin-ink placeholder:text-admin-muted/70 " +
  "focus:border-primary focus:outline-none";

export const textareaClass = cn(inputClass, "leading-relaxed");

/** Label + explanatory sentence + control. The sentence is the whole point. */
export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[15px] font-semibold text-admin-ink"
      >
        {label}
      </label>
      {hint ? (
        <span className="mb-2.5 mt-1 block text-[13px] leading-snug text-admin-muted">
          {hint}
        </span>
      ) : (
        <span className="mb-2.5 block" />
      )}
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------- pills */

type Tone = "published" | "draft" | "new" | "neutral";

const TONES: Record<Tone, string> = {
  published: "bg-sage text-primary",
  draft: "bg-[#F3E7C9] text-[#7A5E12]",
  new: "bg-gold/20 text-gold-dark",
  neutral: "bg-admin-line-soft text-admin-muted",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Turns a raw DB status into something readable. The admin used to render
 * `draft` / `new` / `replied` exactly as stored, in lowercase.
 */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    published: { tone: "published", label: "On the website" },
    draft: { tone: "draft", label: "Draft — only you" },
    new: { tone: "new", label: "Unread" },
    read: { tone: "neutral", label: "Read" },
    replied: { tone: "published", label: "Replied" },
    archived: { tone: "neutral", label: "Archived" },
  };
  const hit = map[status] ?? { tone: "neutral" as Tone, label: status };
  return <Pill tone={hit.tone}>{hit.label}</Pill>;
}

/* ----------------------------------------------------------- confirm dialog */

/**
 * Replaces `window.confirm`, which said "Delete this work?" and gave no way to
 * tell which work. This names the thing and says what happens to the public
 * site. Two admin actions previously had no confirmation at all.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Keep it",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-admin-ink/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-[460px] p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-[23px] font-bold text-admin-ink">
          {title}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-admin-muted">
          {body}
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
