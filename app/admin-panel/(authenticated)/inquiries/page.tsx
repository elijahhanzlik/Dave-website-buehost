"use client";

import { useEffect, useState } from "react";
import { Archive, Mail, MailOpen, Trash2 } from "lucide-react";
import { formatDate, cn } from "@/lib/formatters";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);

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
    }
  };

  const archiveInquiry = async (id: string) => {
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
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
    await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      read: "bg-gray-100 text-gray-600",
      replied: "bg-green-100 text-green-700",
      archived: "bg-yellow-100 text-yellow-700",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${styles[status] ?? styles.read}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">
        Inquiries
      </h1>

      {inquiries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No inquiries yet.
        </div>
      ) : (
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* List panel */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg border border-gray-200 overflow-y-auto">
            {inquiries.map((inquiry) => (
              <button
                key={inquiry.id}
                onClick={() => selectInquiry(inquiry)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors",
                  selected?.id === inquiry.id && "bg-primary/5",
                  inquiry.status === "new" && "font-semibold",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm truncate flex items-center gap-1.5">
                    {inquiry.status === "new" ? (
                      <Mail size={14} className="text-blue-500 shrink-0" />
                    ) : (
                      <MailOpen
                        size={14}
                        className="text-gray-400 shrink-0"
                      />
                    )}
                    {inquiry.name}
                  </span>
                  {statusBadge(inquiry.status)}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {inquiry.email}
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {inquiry.message}
                </p>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="hidden lg:flex flex-1 bg-white rounded-lg border border-gray-200">
            {selected ? (
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div>
                    <h2 className="font-semibold text-lg">{selected.name}</h2>
                    <a
                      href={`mailto:${selected.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selected.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(selected.status)}
                    <button
                      onClick={() => archiveInquiry(selected.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      onClick={() => deleteInquiry(selected.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 px-6 py-4 overflow-y-auto">
                  <p className="text-xs text-gray-400 mb-4">
                    {formatDate(selected.created_at)}
                  </p>
                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {selected.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full text-gray-400 text-sm">
                Select an inquiry to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
