import { getCurrentUser } from "@/modules/auth/auth.service";
import type { AuthenticatedUser } from "@/modules/auth/auth.types";

export async function requireAuth(): Promise<AuthenticatedUser> {
  return getCurrentUser();
}
