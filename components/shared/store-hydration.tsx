"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

/**
 * Hydrates the Zustand store from localStorage on mount.
 * Required because Next.js SSR can cause hydration mismatches.
 */
export function StoreHydration() {
  useEffect(() => {
    // Zustand persist middleware handles hydration automatically,
    // but we trigger a rehydrate to ensure it happens on the client.
    useAppStore.persist.rehydrate();
  }, []);

  return null;
}
