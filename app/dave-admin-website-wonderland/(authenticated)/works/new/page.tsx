import WorkForm from "@/components/admin/WorkForm";

export default function NewWorkPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">
        Add New Work
      </h1>
      <WorkForm />
    </div>
  );
}
