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

// ----- Subscriptions -----
export const subscriptionSchema = z.object({
  service: z.string().min(1, "Service name is required").max(200),
  category: z.string().optional(),
  monthly_cost: z.number().min(0).default(0),
  annual_cost: z.number().min(0).default(0),
  billing_cycle: z.enum(["monthly", "annual", "weekly", "quarterly"]).default("monthly"),
  next_renewal: z.string().optional().nullable(),
  status: z.enum(["active", "paused", "cancelled"]).default("active"),
  notes: z.string().optional(),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

export interface Subscription extends SubscriptionInput {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ----- Notion Settings -----
export const notionSettingsSchema = z.object({
  database_id: z.string().optional(),
  sync_enabled: z.boolean().default(false),
});

export type NotionSettingsInput = z.infer<typeof notionSettingsSchema>;

export interface NotionSettings {
  id: string;
  user_id: string;
  access_token: string | null;
  database_id: string | null;
  workspace_name: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}
