export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cream font-body text-admin-ink">
      {children}
    </div>
  );
}
