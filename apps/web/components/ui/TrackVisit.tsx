"use client";

import { useEffect } from "react";

export type RecentlyViewedType = "expediente" | "client" | "document" | "analysis";

export interface RecentlyViewedItem {
  id: string;
  type: RecentlyViewedType;
  label: string;
  sublabel?: string;
  href: string;
  visitedAt: string; // ISO
}

const STORAGE_KEY = "docufy_recently_viewed";
const MAX_ITEMS = 10;

/**
 * Invisible component that records a page visit to localStorage on mount.
 * Drop it anywhere in a detail page JSX and it will track the visit.
 *
 * Usage:
 *   <TrackVisit id={client.id} type="client" label={client.name} href={`/clients/${client.id}`} />
 */
export function TrackVisit({
  id,
  type,
  label,
  sublabel,
  href,
}: {
  id: string;
  type: RecentlyViewedType;
  label: string;
  sublabel?: string;
  href: string;
}) {
  useEffect(() => {
    if (!id || !label) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
      // Remove existing entry with same id + type
      const filtered = items.filter(
        (i) => !(i.id === id && i.type === type)
      );
      // Prepend new entry
      const updated: RecentlyViewedItem[] = [
        { id, type, label, sublabel, href, visitedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage might be unavailable (SSR, private mode, etc.)
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
