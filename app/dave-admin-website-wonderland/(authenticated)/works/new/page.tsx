import WorkForm from "@/components/admin/WorkForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewWorkPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Gallery"
        title="Add a piece of artwork"
        subtitle="Upload the photos, give it a title and a category. Nothing appears on your website until you press save at the bottom."
      />
      <WorkForm />
    </div>
  );
}
