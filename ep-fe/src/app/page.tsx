"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/app/services/auth/authStore"; // adjust to your actual path

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    if (isInitializing) return;

    router.replace(user ? "/dashboard" : "/login");
  }, [isInitializing, user, router]);

  return null;
}