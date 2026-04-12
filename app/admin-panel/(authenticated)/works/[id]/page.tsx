"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WorkForm from "@/components/admin/WorkForm";

export default function EditWorkPage() {
  const params = useParams();
  const [work, setWork] = useState<{
    id: string;
    title: string;
    description: string | null;
    images: string[];
    category: string | null;
    is_featured: boolean;
    sort_order: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/artworks/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setWork)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="text-center py-12 text-red-500">
        Work not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">
        Edit Work
      </h1>
      <WorkForm initialData={work} />
    </div>
  );
}
