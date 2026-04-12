import { z } from "zod";

// ----- Artworks -----
export const artworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  images: z.array(z.string().url()).default([]),
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
  cover_image: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().datetime().optional().nullable(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

// ----- Pages -----
export const contentBlockSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export const pageSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  title: z.string().min(1, "Title is required"),
  content_blocks: z.array(contentBlockSchema).default([]),
});

export type PageInput = z.infer<typeof pageSchema>;

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
