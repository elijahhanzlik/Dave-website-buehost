"use client";

import {
  useCallback,
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { Eye, GripVertical, LayoutGrid, Plus, Star, Trash2 } from "lucide-react";
import RichTitle, { stripRichTitle } from "@/components/RichTitle";
import GalleryPreviewFrame from "@/components/admin/GalleryPreviewFrame";
import {
  ActionButton,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Pill,
  Spinner,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";
const VIEW_STORAGE_KEY = "admin:gallery-view";

type View = "cards" | "live";

/* Remember which view he last used, across visits. localStorage can be
   unavailable (private mode, blocked storage) — the default is fine then.
   A tiny external store keeps this out of an effect and hydration-safe:
   the server renders "cards", the client swaps to the saved view. */
const viewListeners = new Set<() => void>();
function subscribeView(cb: () => void) {
  viewListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    viewListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readStoredView(): View {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === "live"
      ? "live"
      : "cards";
  } catch {
    return "cards";
  }
}
function writeStoredView(next: View) {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  viewListeners.forEach((cb) => cb());
}

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  category: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

export default function WorksListPage() {
  const router = useRouter();
  const [works, setWorks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Artwork | null>(null);
  const view = useSyncExternalStore(
    subscribeView,
    readStoredView,
    () => "cards" as View,
  );
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const load = useCallback(() => {
    return fetch("/api/artworks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWorks(data);
      });
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const changeView = (next: View) => {
    writeStoredView(next);
    // Coming back from the live view: re-read so the cards show the order
    // he just set inside the frame.
    if (next === "cards") load();
  };

  // The live view saves its own reorders and tells us; keep the cards in step.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "artworks:reordered") load();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [load]);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const reordered = [...works];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    const updated = reordered.map((w, i) => ({ ...w, sort_order: i }));
    setWorks(updated);

    dragItem.current = null;
    dragOverItem.current = null;

    const res = await fetch("/api/artworks/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: updated.map((w) => ({ id: w.id, sort_order: w.sort_order })),
      }),
    });

    // The order above is optimistic. If the server refused it, re-read rather
    // than leave the grid showing an order the Gallery page does not have.
    if (!res.ok) load();
  };

  const toggleFeatured = async (work: Artwork) => {
    const newFeatured = !work.is_featured;
    setWorks((prev) =>
      prev.map((w) =>
        w.id === work.id ? { ...w, is_featured: newFeatured } : w,
      ),
    );

    await fetch(`/api/artworks/${work.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: newFeatured }),
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setWorks((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/artworks/${id}`, { method: "DELETE" });
  };

  if (loading) return <Spinner label="Getting your artwork…" />;

  return (
    <div>
      <PageHeader
        eyebrow="Your work"
        title="Gallery"
        subtitle={
          view === "live"
            ? "Exactly what visitors see. Drag a piece to move it; the order saves when you let go. Pick a screen size to check phones and laptops."
            : works.length
              ? `${works.length} piece${works.length === 1 ? "" : "s"}, in the order visitors see them. Drag a card by its handle to move a piece.`
              : "The artwork on your Gallery page."
        }
        action={
          <div className="flex flex-col gap-4 sm:items-end">
            <ActionButton
              href={`${ADMIN_BASE}/works/new`}
              label="Add a piece"
              hint="Photos, a title and a category."
              icon={<Plus size={20} />}
              align="end"
            />
            <div
              role="group"
              aria-label="How to show the gallery"
              className="inline-flex rounded-full border-[1.5px] border-admin-line bg-admin-surface p-1"
            >
              <Button
                size="sm"
                variant={view === "cards" ? "primary" : "ghost"}
                onClick={() => changeView("cards")}
                aria-pressed={view === "cards"}
                title="Cards with Edit, Homepage and Delete"
              >
                <LayoutGrid size={16} />
                Cards
              </Button>
              <Button
                size="sm"
                variant={view === "live" ? "primary" : "ghost"}
                onClick={() => changeView("live")}
                aria-pressed={view === "live"}
                title="See it as visitors do and drag pieces there"
              >
                <Eye size={16} />
                Live view
              </Button>
            </div>
          </div>
        }
      />

      {view === "live" ? (
        <GalleryPreviewFrame />
      ) : works.length === 0 ? (
        <EmptyState
          title="No artwork yet"
          hint="Add your first piece and it appears on your Gallery page straight away."
          action={
            <Button href={`${ADMIN_BASE}/works/new`} size="lg">
              <Plus size={20} /> Add a piece
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {works.map((work, index) => (
            <Card
              key={work.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="relative overflow-hidden"
            >
              <div className="relative aspect-square bg-sage">
                {work.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={work.images[0]}
                    alt={stripRichTitle(work.title)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-admin-muted">
                    No photo yet
                  </div>
                )}

                {work.is_featured && (
                  <Pill tone="new" className="absolute left-3.5 top-3.5">
                    On the homepage
                  </Pill>
                )}

                <span
                  className="absolute right-3.5 top-3.5 inline-flex cursor-grab items-center gap-1 rounded-full bg-admin-ink/55 px-3 py-1.5 text-[12px] font-bold text-cream active:cursor-grabbing"
                  title="Drag to move this piece"
                >
                  <GripVertical size={14} />
                  {index + 1}
                </span>
              </div>

              <div className="p-5">
                <h2 className="font-display text-[19px] font-bold leading-tight text-admin-ink">
                  <RichTitle text={work.title} />
                </h2>
                <p className="mt-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
                  {work.category || "No category"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`${ADMIN_BASE}/works/${work.id}`)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant={work.is_featured ? "gold" : "secondary"}
                    onClick={() => toggleFeatured(work)}
                    aria-pressed={work.is_featured}
                    title={
                      work.is_featured
                        ? "Take this off the homepage"
                        : "Also show this on the homepage"
                    }
                  >
                    <Star
                      size={17}
                      className={work.is_featured ? "fill-current" : ""}
                    />
                    <span className="sr-only sm:not-sr-only">Homepage</span>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setPendingDelete(work)}
                  >
                    <Trash2 size={17} />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete “${stripRichTitle(pendingDelete?.title ?? "")}”?`}
        body="This takes the piece off your Gallery page for good, along with its photos and description. It cannot be undone."
        confirmLabel="Yes, delete it"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
