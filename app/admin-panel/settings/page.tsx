import NotionSettings from "@/components/admin/NotionSettings";
import ExportButton from "@/components/admin/ExportButton";

export default function AdminSettingsPage() {
  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2D5016]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[#2D5016]/60">
            Manage integrations and export your data.
          </p>
        </div>

        {/* Export Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2D5016]">
                Export Data
              </h2>
              <p className="text-sm text-[#2D5016]/60">
                Download your subscriptions in various formats.
              </p>
            </div>
            <ExportButton />
          </div>
        </section>

        {/* Integrations Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#2D5016]">
            Integrations
          </h2>
          <NotionSettings />
        </section>

        {/* Environment Variables Reference */}
        <section className="rounded-lg border border-[#C4A265]/10 bg-[#F5F0E8]/50 p-4">
          <h3 className="mb-2 text-sm font-medium text-[#2D5016]/70">
            Required Environment Variables
          </h3>
          <ul className="space-y-1 text-xs font-mono text-[#2D5016]/50">
            <li>NOTION_CLIENT_ID</li>
            <li>NOTION_CLIENT_SECRET</li>
            <li>NOTION_REDIRECT_URI</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
