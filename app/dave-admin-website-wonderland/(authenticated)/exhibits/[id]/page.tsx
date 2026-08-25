"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ExhibitForm from "@/components/admin/ExhibitForm";
import type { ExhibitData } from "@/components/admin/ExhibitForm";
import {
  Button,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

export default function EditExhibitPage() {
  const params = useParams();
  const [exhibit, setExhibit] = useState<ExhibitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/exhibits/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setExhibit)
      .catch(() => setExhibit(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Spinner label="Getting this exhibit…" />;

  if (!exhibit) {
    return (
      <EmptyState
        title="That exhibit is not here"
        hint="It may have been deleted. Everything still listed is on the previous screen."
        action={
          <Button href={`${ADMIN_BASE}/exhibits`} size="lg">
            Back to my exhibits
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Editing an exhibit"
        title={exhibit.title || "Untitled exhibit"}
        subtitle={
          exhibit.status === "published"
            ? "This exhibit is on your website. Saving replaces what visitors see right now."
            : "This exhibit is a draft. Nobody can see it until you change that below."
        }
      />
      <ExhibitForm initialData={exhibit} />
    </div>
  );
}
