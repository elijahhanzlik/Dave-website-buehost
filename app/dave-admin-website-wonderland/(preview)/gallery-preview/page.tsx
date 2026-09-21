import GalleryLivePreview from "@/components/admin/GalleryLivePreview";

/**
 * The Gallery exactly as visitors see it, with drag-to-reorder. Loaded inside
 * the admin Gallery screen's "Live view" iframe at whatever device size David
 * picks, and also usable on its own in a tab.
 */
export default function GalleryPreviewPage() {
  return <GalleryLivePreview />;
}
