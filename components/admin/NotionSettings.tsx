"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Unlink, ExternalLink, Database, Check } from "lucide-react";

interface NotionDatabase {
  id: string;
  title: string;
}

interface NotionState {
  connected: boolean;
  workspace_name: string | null;
  databases: NotionDatabase[];
  current_database_id: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
}

export default function NotionSettings() {
  const [state, setState] = useState<NotionState>({
    connected: false,
    workspace_name: null,
    databases: [],
    current_database_id: null,
    sync_enabled: false,
    last_synced_at: null,
    loading: true,
    syncing: false,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/notion/sync");
      if (res.status === 400) {
        // Not connected
        setState((prev) => ({ ...prev, connected: false, loading: false }));
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch status");

      const data = await res.json();
      setState((prev) => ({
        ...prev,
        connected: true,
        workspace_name: data.workspace_name,
        databases: data.databases ?? [],
        current_database_id: data.current_database_id,
        sync_enabled: data.sync_enabled,
        last_synced_at: data.last_synced_at,
        loading: false,
        error: null,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Check URL params for OAuth callback results
    const params = new URLSearchParams(window.location.search);
    if (params.get("notion_connected") === "true") {
      fetchStatus();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("notion_error")) {
      setState((prev) => ({
        ...prev,
        error: `Connection failed: ${params.get("notion_error")}`,
        loading: false,
      }));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchStatus]);

  async function handleConnect() {
    try {
      const res = await fetch("/api/integrations/notion/connect");
      if (!res.ok) throw new Error("Failed to start connection");
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to initiate Notion connection",
      }));
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Notion? Syncing will stop.")) return;

    try {
      const res = await fetch("/api/integrations/notion/disconnect", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      setState((prev) => ({
        ...prev,
        connected: false,
        workspace_name: null,
        databases: [],
        current_database_id: null,
        sync_enabled: false,
        last_synced_at: null,
        error: null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to disconnect Notion",
      }));
    }
  }

  async function handleDatabaseChange(databaseId: string) {
    try {
      const res = await fetch("/api/integrations/notion/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database_id: databaseId }),
      });
      if (!res.ok) throw new Error("Failed to update database");
      setState((prev) => ({
        ...prev,
        current_database_id: databaseId,
        error: null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to update database selection",
      }));
    }
  }

  async function handleToggleSync() {
    const newEnabled = !state.sync_enabled;
    try {
      const res = await fetch("/api/integrations/notion/sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_enabled: newEnabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle sync");
      setState((prev) => ({ ...prev, sync_enabled: newEnabled, error: null }));
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to toggle sync",
      }));
    }
  }

  async function handleManualSync() {
    setState((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const res = await fetch("/api/integrations/notion/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");

      setState((prev) => ({
        ...prev,
        syncing: false,
        last_synced_at: new Date().toISOString(),
        error:
          data.errors?.length > 0
            ? `Synced ${data.synced} items with ${data.errors.length} error(s)`
            : null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        syncing: false,
        error: err instanceof Error ? err.message : "Sync failed",
      }));
    }
  }

  if (state.loading) {
    return (
      <div className="rounded-lg border border-[#C4A265]/20 bg-white p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 rounded bg-[#E8EDE2]" />
          <div className="h-4 w-32 rounded bg-[#E8EDE2]" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#C4A265]/20 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F0E8]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h16v16H4V4z"
                stroke="#2D5016"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M8 8h8M8 12h8M8 16h4" stroke="#2D5016" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2D5016]">Notion</h3>
            <p className="text-sm text-[#2D5016]/60">
              Sync subscriptions to a Notion database
            </p>
          </div>
        </div>

        {state.connected && (
          <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            <Check className="h-3 w-3" />
            Connected
          </span>
        )}
      </div>

      {state.error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {!state.connected ? (
        <button
          onClick={handleConnect}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D5016] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2D5016]/90"
        >
          <ExternalLink className="h-4 w-4" />
          Connect Notion
        </button>
      ) : (
        <div className="space-y-4">
          {/* Workspace info */}
          {state.workspace_name && (
            <p className="text-sm text-[#2D5016]/70">
              Workspace: <strong>{state.workspace_name}</strong>
            </p>
          )}

          {/* Database selector */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2D5016]">
              <Database className="mr-1 inline h-4 w-4" />
              Target Database
            </label>
            <select
              value={state.current_database_id ?? ""}
              onChange={(e) => handleDatabaseChange(e.target.value)}
              className="w-full rounded-lg border border-[#C4A265]/30 bg-[#F5F0E8] px-3 py-2 text-sm text-[#2D5016]"
            >
              <option value="">Select a database...</option>
              {state.databases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.title}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-sync toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#2D5016]">
                Auto-sync
              </p>
              <p className="text-xs text-[#2D5016]/60">
                Automatically sync when subscriptions change
              </p>
            </div>
            <button
              onClick={handleToggleSync}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                state.sync_enabled ? "bg-[#2D5016]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  state.sync_enabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Last synced */}
          {state.last_synced_at && (
            <p className="text-xs text-[#2D5016]/50">
              Last synced:{" "}
              {new Date(state.last_synced_at).toLocaleString()}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 border-t border-[#C4A265]/10 pt-4">
            <button
              onClick={handleManualSync}
              disabled={state.syncing || !state.current_database_id}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2D5016] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2D5016]/90 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${state.syncing ? "animate-spin" : ""}`}
              />
              {state.syncing ? "Syncing..." : "Sync Now"}
            </button>

            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
