"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  Star,
  StarOff,
} from "lucide-react";

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  category: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

export default function WorksListPage() {
  const router = useRouter();
  const [works, setWorks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWorks(data);
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

    const reordered = [...works];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    const updated = reordered.map((w, i) => ({ ...w, sort_order: i }));
    setWorks(updated);

    dragItem.current = null;
    dragOverItem.current = null;

    await fetch("/api/artworks/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: updated.map((w) => ({ id: w.id, sort_order: w.sort_order })),
      }),
    });
  };

  const toggleFeatured = async (work: Artwork) => {
    const newFeatured = !work.is_featured;
    setWorks((prev) =>
      prev.map((w) =>
        w.id === work.id ? { ...w, is_featured: newFeatured } : w,
      ),
    );

    await fetch(`/api/artworks/${work.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: newFeatured }),
    });
  };

  const deleteWork = async (id: string) => {
    if (!confirm("Delete this work?")) return;
    setWorks((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/artworks/${id}`, { method: "DELETE" });
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
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Works
        </h1>
        <Link
          href="/dave-admin-website-wonderland/works/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Add Work
        </Link>
      </div>

      {works.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No works yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-10 px-3 py-3" />
                <th
                  className="w-12 px-3 py-3 font-medium text-gray-600 text-center"
                  title="Position on the public gallery"
                >
                  #
                </th>
                <th className="w-16 px-3 py-3" />
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Title
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600 hidden sm:table-cell">
                  Category
                </th>
                <th className="w-20 px-3 py-3 font-medium text-gray-600">
                  Featured
                </th>
                <th className="w-24 px-3 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {works.map((work, index) => (
                <tr
                  key={work.id}
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
                  <td className="px-3 py-2">
                    {work.images[0] ? (
                      <img
                        src={work.images[0]}
                        alt={work.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded" />
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{work.title}</td>
                  <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">
                    {work.category || "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleFeatured(work)}
                      className="text-gray-400 hover:text-gold transition-colors"
                    >
                      {work.is_featured ? (
                        <Star size={16} className="fill-gold text-gold" />
                      ) : (
                        <StarOff size={16} />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 justify-center">
                      <button
                        onClick={() =>
                          router.push(`/dave-admin-website-wonderland/works/${work.id}`)
                        }
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteWork(work.id)}
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
