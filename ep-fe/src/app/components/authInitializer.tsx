"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/app/services/auth/authStore"; // adjust path to match where authStore.ts actually lives

/**
 * Restores the session (via /auth/me) once when the app mounts.
 * Render this once near the root layout, e.g.:
 *
 *   <body>
 *     <AuthInitializer />
 *     {children}
 *   </body>
 */
export function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null;
}