import { z } from "zod";

// ----- Shared -----
// passthrough() preserves Editor.js block metadata (id, tunes) on round-trip.
export const contentBlockSchema = z
  .object({
    type: z.string(),
    data: z.record(z.string(), z.unknown()),
  })
  .passthrough();

// ----- Artworks -----
export const artworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  year: z
    .number()
    .int()
    .min(1000)
    .max(9999)
    .optional()
    .nullable(),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  image_crops: z.record(z.string(), z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  })).optional(),
  category: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_featured: z.boolean().default(false),
});

export type ArtworkInput = z.infer<typeof artworkSchema>;

// ----- Blog Posts -----
export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  content: z.string().optional(),
  content_blocks: z.array(contentBlockSchema).default([]),
  cover_image: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().datetime().optional().nullable(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

// ----- Pages -----
export const pageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  title: z.string().min(1, "Title is required"),
  content_blocks: z.array(contentBlockSchema).default([]),
});

export type PageInput = z.infer<typeof pageSchema>;

// ----- Exhibits -----
// Accepts YYYY-MM-DD, empty string (treated as null), or null.
const optionalDateString = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

export const exhibitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  content: z.string().optional(),
  content_blocks: z.array(contentBlockSchema).default([]),
  cover_image: z.string().optional().or(z.literal("")),
  start_date: optionalDateString,
  end_date: optionalDateString,
  venue: z.string().max(300).optional().nullable(),
  link: z
    .union([z.string().url("Must be a valid URL"), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().datetime().optional().nullable(),
});

export type ExhibitInput = z.infer<typeof exhibitSchema>;

// ----- Inquiries -----
export const inquirySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required").max(5000),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const inquiryStatusSchema = z.object({
  status: z.enum(["new", "read", "replied", "archived"]),
});

// ----- Site Settings -----
export const siteSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export type SiteSettingInput = z.infer<typeof siteSettingSchema>;
