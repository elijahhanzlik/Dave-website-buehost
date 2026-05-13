"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, GripVertical, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface Exhibit {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  sort_order: number;
  created_at: string;
}

export default function ExhibitsListPage() {
  const router = useRouter();
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loading, setLoading] = useState(true);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/exhibits?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setExhibits(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...exhibits];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    const updated = reordered.map((e, i) => ({ ...e, sort_order: i }));
    setExhibits(updated);

    dragItem.current = null;
    dragOverItem.current = null;

    const res = await fetch("/api/exhibits/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: updated.map((e) => ({ id: e.id, sort_order: e.sort_order })),
      }),
    });

    if (!res.ok) {
      fetch("/api/exhibits?all=true")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setExhibits(data); });
    }
  };

  const deleteExhibit = async (id: string) => {
    if (!confirm("Delete this exhibit?")) return;
    setExhibits((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/exhibits/${id}`, { method: "DELETE" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Exhibits</h1>
        <Link
          href="/dave-admin-website-wonderland/exhibits/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> New Exhibit
        </Link>
      </div>

      {exhibits.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No exhibits yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 px-3 py-3" />
                <th
                  className="w-12 px-3 py-3 font-medium text-gray-600 text-center"
                  title="Position on the public exhibits page"
                >
                  #
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                  Slug
                </th>
                <th className="w-28 px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="w-32 px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                  Date
                </th>
                <th className="w-24 px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {exhibits.map((exhibit, index) => (
                <tr
                  key={exhibit.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                >
                  <td className="px-3 py-2 text-gray-400">
                    <GripVertical size={16} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium tabular-nums">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{exhibit.title}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {exhibit.slug}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                        exhibit.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {exhibit.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                    {formatDate(exhibit.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-center">
                      <button
                        onClick={() =>
                          router.push(`/dave-admin-website-wonderland/exhibits/${exhibit.id}`)
                        }
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteExhibit(exhibit.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
