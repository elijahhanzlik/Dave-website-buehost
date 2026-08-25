"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { formatDate, cn } from "@/lib/formatters";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Spinner,
  StatusPill,
} from "@/components/admin/ui";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
}

export default function InquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Inquiry | null>(null);

  useEffect(() => {
    fetch("/api/inquiries")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInquiries(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectInquiry = async (inquiry: Inquiry) => {
    setSelected(inquiry);

    if (inquiry.status === "new") {
      setInquiries((prev) =>
        prev.map((i) => (i.id === inquiry.id ? { ...i, status: "read" } : i)),
      );
      await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      router.refresh();
    }
  };

  const archiveInquiry = async (id: string) => {
    const wasNew = inquiries.find((i) => i.id === id)?.status === "new";
    setInquiries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "archived" } : i)),
    );
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status: "archived" } : s));
    }
    await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    if (wasNew) router.refresh();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    const wasNew = inquiries.find((i) => i.id === id)?.status === "new";
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
    await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
    if (wasNew) router.refresh();
  };

  if (loading) return <Spinner label="Getting your messages…" />;

  const unread = inquiries.filter((i) => i.status === "new").length;

  const reader = selected && (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b border-admin-line p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(null)}
            className="-ml-4 mb-2 lg:hidden"
          >
            <ArrowLeft size={16} /> Back to messages
          </Button>
          <h2 className="font-display text-[23px] font-bold text-admin-ink">
            {selected.name}
          </h2>
          <a
            href={`mailto:${selected.email}`}
            className="break-all text-[15px] text-primary hover:underline"
          >
            {selected.email}
          </a>
          <p className="mt-1.5 text-[13px] text-admin-muted">
            Sent {formatDate(selected.created_at)}
          </p>
        </div>
        <StatusPill status={selected.status} />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <p className="whitespace-pre-wrap text-[15.5px] leading-relaxed text-admin-ink">
          {selected.message}
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 border-t border-admin-line p-6">
        <a
          href={`mailto:${selected.email}`}
          className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full border-[1.5px] border-transparent bg-primary px-5 text-[15px] font-semibold text-cream transition-colors hover:bg-primary-dark"
        >
          <Reply size={17} /> Write back
        </a>
        {selected.status !== "archived" && (
          <Button
            variant="secondary"
            onClick={() => archiveInquiry(selected.id)}
          >
            <Archive size={17} /> Archive
          </Button>
        )}
        <Button variant="danger" onClick={() => setPendingDelete(selected)}>
          <Trash2 size={17} /> Delete
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Your inbox"
        title="Messages"
        subtitle={
          inquiries.length === 0
            ? "Anything sent through the Contact form on your website arrives here."
            : unread === 0
              ? "Everything sent through your Contact form. Nothing waiting to be read."
              : `Everything sent through your Contact form. ${unread} still to read.`
        }
      />

      {inquiries.length === 0 ? (
        <EmptyState
          title="No messages yet"
          hint="When somebody writes to you through the Contact form on your website, it lands here and you get an email."
        />
      ) : (
        <div className="grid gap-5 lg:h-[calc(100vh-15rem)] lg:grid-cols-[minmax(0,22rem)_1fr]">
          {/* The list hides on a phone once a message is open, so the reader
              gets the whole screen. It used to be desktop-only entirely. */}
          <Card
            className={cn(
              "overflow-y-auto p-0",
              selected ? "hidden lg:block" : "block",
            )}
          >
            {inquiries.map((inquiry) => (
              <button
                key={inquiry.id}
                onClick={() => selectInquiry(inquiry)}
                className={cn(
                  "w-full border-b border-admin-line-soft px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-sage/50",
                  selected?.id === inquiry.id && "bg-sage",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    {inquiry.status === "new" ? (
                      <Mail size={15} className="shrink-0 text-gold-dark" />
                    ) : (
                      <MailOpen
                        size={15}
                        className="shrink-0 text-admin-muted"
                      />
                    )}
                    <span
                      className={cn(
                        "truncate text-[15px] text-admin-ink",
                        inquiry.status === "new" ? "font-bold" : "font-medium",
                      )}
                    >
                      {inquiry.name}
                    </span>
                  </span>
                  {inquiry.status === "new" && (
                    <span className="shrink-0 rounded-full bg-gold/20 px-2.5 py-1 text-[11.5px] font-bold text-gold-dark">
                      Unread
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[13px] text-admin-muted">
                  {inquiry.email}
                </p>
                <p className="mt-1 truncate text-[13px] text-admin-muted/80">
                  {inquiry.message}
                </p>
              </button>
            ))}
          </Card>

          <Card className={cn("p-0", selected ? "block" : "hidden lg:block")}>
            {selected ? (
              reader
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-center text-[15px] text-admin-muted">
                Pick a message on the left to read it.
              </div>
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete the message from ${pendingDelete?.name ?? ""}?`}
        body="This removes it from your inbox for good. If you only want it out of the way, archive it instead."
        confirmLabel="Yes, delete it"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
