import Link from "next/link";

interface Artwork {
  id: string;
  title: string;
  description?: string | null;
  images: string[];
  category?: string | null;
}

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const hasImage = artwork.images.length > 0;

  return (
    <Link
      href={`/works/${artwork.id}`}
      className="group relative block overflow-hidden rounded-xl"
    >
      {/* Image / Placeholder */}
      <div className="aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary-dark/30">
        {hasImage ? (
          <img
            src={artwork.images[0]}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sage to-primary/10">
            <svg
              className="h-16 w-16 text-primary/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="w-full p-5">
          <h3 className="font-display text-lg font-semibold text-white">
            {artwork.title}
          </h3>
          {artwork.category && (
            <p className="mt-1 text-sm text-white/70">{artwork.category}</p>
          )}
        </div>
      </div>

      {/* Always-visible title on mobile */}
      <div className="mt-3 md:hidden">
        <h3 className="font-display text-base font-medium text-primary-dark">
          {artwork.title}
        </h3>
        {artwork.category && (
          <p className="text-sm text-text-muted">{artwork.category}</p>
        )}
      </div>
    </Link>
  );
}
