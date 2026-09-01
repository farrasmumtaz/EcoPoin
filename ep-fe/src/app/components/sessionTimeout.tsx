"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

import { useAuthStore } from "@/app/services/auth/authStore";

const DEFAULT_TIMEOUT_MINUTES = 30;
const configuredMinutes = Number(
  process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES ?? DEFAULT_TIMEOUT_MINUTES,
);
const timeoutMilliseconds =
  (Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : DEFAULT_TIMEOUT_MINUTES) *
  60 *
  1000;

export function SessionTimeout(): null {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!user) return;

    let timerId: ReturnType<typeof setTimeout>;
    const expireSession = (): void => {
      void logout().finally(() => {
        toast.error("Sesi berakhir karena tidak ada aktivitas.");
        window.location.replace("/login");
      });
    };
    const resetTimer = (): void => {
      clearTimeout(timerId);
      timerId = setTimeout(expireSession, timeoutMilliseconds);
    };
    const events: readonly (keyof WindowEventMap)[] = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    resetTimer();
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    return () => {
      clearTimeout(timerId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [logout, user]);

  return null;
}
