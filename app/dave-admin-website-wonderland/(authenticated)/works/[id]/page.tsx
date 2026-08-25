"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WorkForm from "@/components/admin/WorkForm";
import RichTitle from "@/components/RichTitle";
import {
  Button,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

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

  if (loading) return <Spinner label="Getting this piece…" />;

  if (error || !work) {
    return (
      <EmptyState
        title="That piece is not here"
        hint="It may have been deleted. Everything still on your Gallery page is on the previous screen."
        action={
          <Button href={`${ADMIN_BASE}/works`} size="lg">
            Back to my Gallery
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Editing a piece"
        title={<RichTitle text={work.title} />}
        subtitle="Everything here shows on your Gallery page the moment you save."
      />
      <WorkForm initialData={work} />
    </div>
  );
}
