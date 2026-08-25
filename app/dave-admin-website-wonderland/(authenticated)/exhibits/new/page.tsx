import ExhibitForm from "@/components/admin/ExhibitForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewExhibitPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Exhibits"
        title="Add an exhibit"
        subtitle="Where your work is hanging — the place, the dates and the hours. You choose at the bottom whether it goes on your website now."
      />
      <ExhibitForm />
    </div>
  );
}
