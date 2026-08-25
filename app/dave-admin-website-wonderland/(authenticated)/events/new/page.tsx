import EventForm from "@/components/admin/EventForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewEventPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Events"
        title="Add an event"
        subtitle="Open studios, talks, workshops and services. You choose at the bottom whether it goes on your website now."
      />
      <EventForm />
    </div>
  );
}
