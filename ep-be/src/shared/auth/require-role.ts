import { ForbiddenError } from "@/modules/auth/auth.errors";
import type {
  AuthenticatedUser,
  UserRole,
} from "@/modules/auth/auth.types";
import { requireAuth } from "@/shared/auth/require-auth";

export async function requireRole(
  allowedRoles: readonly UserRole[],
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}
