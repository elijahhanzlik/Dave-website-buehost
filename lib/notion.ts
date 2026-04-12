import { Client } from "@notionhq/client";
import type { Subscription } from "@/lib/validations";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---- Rate Limiter (3 requests/second for Notion API) ----

const NOTION_RATE_LIMIT = 3;
const NOTION_RATE_WINDOW_MS = 1000;

let requestTimestamps: number[] = [];

async function rateLimitedDelay(): Promise<void> {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(
    (t) => now - t < NOTION_RATE_WINDOW_MS,
  );

  if (requestTimestamps.length >= NOTION_RATE_LIMIT) {
    const oldestInWindow = requestTimestamps[0];
    const waitMs = NOTION_RATE_WINDOW_MS - (now - oldestInWindow) + 10;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  requestTimestamps.push(Date.now());
}

// ---- Constants ----

const SOURCE_TAG = "Subblink";

// ---- Helper: Build page properties from subscription ----

type PageProperties = NonNullable<
  Parameters<Client["pages"]["create"]>[0]["properties"]
>;

function buildPageProperties(sub: Subscription): PageProperties {
  const properties: PageProperties = {
    Service: {
      title: [{ text: { content: sub.service } }],
    },
    "Monthly Cost": { number: sub.monthly_cost },
    "Annual Cost": { number: sub.annual_cost },
    "Billing Cycle": { select: { name: sub.billing_cycle } },
    Status: { select: { name: sub.status } },
    Source: {
      rich_text: [{ text: { content: SOURCE_TAG } }],
    },
  };

  if (sub.category) {
    properties.Category = { select: { name: sub.category } };
  }

  if (sub.next_renewal) {
    properties["Next Renewal"] = { date: { start: sub.next_renewal } };
  }

  return properties;
}

// ---- Create a new Notion database (via dataSources API in v5) ----

export async function createNotionDatabase(
  accessToken: string,
  parentPageId: string,
): Promise<string> {
  const notion = new Client({ auth: accessToken });

  await rateLimitedDelay();

  // In Notion client v5, databases are created via dataSources.create
  const response = await notion.dataSources.create({
    parent: { database_id: parentPageId },
    title: [{ type: "text", text: { content: "Subblink Subscriptions" } }],
    properties: {
      Service: { title: {} },
      Category: {
        select: {
          options: [
            { name: "Entertainment", color: "blue" },
            { name: "Productivity", color: "green" },
            { name: "Finance", color: "yellow" },
            { name: "Health", color: "red" },
            { name: "Education", color: "purple" },
            { name: "Other", color: "gray" },
          ],
        },
      },
      "Monthly Cost": { number: { format: "dollar" } },
      "Annual Cost": { number: { format: "dollar" } },
      "Billing Cycle": {
        select: {
          options: [
            { name: "monthly", color: "blue" },
            { name: "annual", color: "green" },
            { name: "weekly", color: "orange" },
            { name: "quarterly", color: "purple" },
          ],
        },
      },
      "Next Renewal": { date: {} },
      Status: {
        select: {
          options: [
            { name: "active", color: "green" },
            { name: "paused", color: "yellow" },
            { name: "cancelled", color: "red" },
          ],
        },
      },
      Source: { rich_text: {} },
    },
  });

  return response.id;
}

// ---- Sync all subscriptions for a user to Notion ----

export async function syncSubscriptionsToNotion(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ synced: number; errors: string[] }> {
  // Fetch Notion settings
  const { data: settings, error: settingsError } = await supabase
    .from("notion_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (settingsError || !settings?.access_token || !settings?.database_id) {
    return { synced: 0, errors: ["Notion not configured"] };
  }

  if (!settings.sync_enabled) {
    return { synced: 0, errors: ["Notion sync is disabled"] };
  }

  const notion = new Client({ auth: settings.access_token });

  // Fetch all user subscriptions
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (subError || !subscriptions) {
    return { synced: 0, errors: ["Failed to fetch subscriptions"] };
  }

  // Fetch existing Notion pages managed by Subblink
  const existingPages = await queryManagedPages(notion, settings.database_id as string);

  const errors: string[] = [];
  let synced = 0;

  for (const sub of subscriptions) {
    try {
      const existingPage = existingPages.get(sub.service);

      if (existingPage) {
        // Update existing page
        await rateLimitedDelay();
        await notion.pages.update({
          page_id: existingPage,
          properties: buildPageProperties(sub as Subscription),
        });
      } else {
        // Create new page
        await rateLimitedDelay();
        await notion.pages.create({
          parent: { database_id: settings.database_id as string },
          properties: buildPageProperties(sub as Subscription),
        });
      }
      synced++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Failed to sync "${sub.service}": ${message}`);
    }
  }

  // Update last synced timestamp
  await supabase
    .from("notion_settings")
    .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { synced, errors };
}

// ---- Query Notion DB for pages tagged with Source: Subblink ----

async function queryManagedPages(
  notion: Client,
  databaseId: string,
): Promise<Map<string, string>> {
  const pageMap = new Map<string, string>();

  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    await rateLimitedDelay();

    // In v5, database querying is via dataSources.query
    const response = await notion.dataSources.query({
      data_source_id: databaseId,
      filter: {
        property: "Source",
        rich_text: { equals: SOURCE_TAG },
      },
      start_cursor: startCursor,
      page_size: 100,
    });

    for (const page of response.results) {
      if (page.object === "page" && "properties" in page) {
        const titleProp = page.properties.Service;
        if (titleProp && "title" in titleProp) {
          const titleArr = titleProp.title as Array<{ plain_text: string }>;
          if (titleArr.length > 0) {
            pageMap.set(titleArr[0].plain_text, page.id);
          }
        }
      }
    }

    hasMore = response.has_more;
    startCursor = response.next_cursor ?? undefined;
  }

  return pageMap;
}

// ---- Debounced sync trigger (fire-and-forget) ----

const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();
const SYNC_DEBOUNCE_MS = 5000; // 5 seconds

export function triggerDebouncedSync(
  supabase: SupabaseClient,
  userId: string,
): void {
  const existing = syncTimers.get(userId);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    syncTimers.delete(userId);
    syncSubscriptionsToNotion(supabase, userId).catch((err) => {
      console.error(`[Notion Sync] Failed for user ${userId}:`, err);
    });
  }, SYNC_DEBOUNCE_MS);

  syncTimers.set(userId, timer);
}

// ---- Fetch available databases for the user ----

export async function listNotionDatabases(
  accessToken: string,
): Promise<Array<{ id: string; title: string }>> {
  const notion = new Client({ auth: accessToken });

  await rateLimitedDelay();

  // In v5, search uses "data_source" filter instead of "database"
  const response = await notion.search({
    filter: { value: "data_source", property: "object" },
    page_size: 50,
  });

  return response.results
    .filter((r) => r.object === "data_source")
    .map((ds) => {
      const titleArr = "title" in ds
        ? (ds.title as Array<{ plain_text: string }>)
        : [];
      return {
        id: ds.id,
        title: titleArr.length > 0 ? titleArr[0].plain_text : "Untitled",
      };
    });
}
