import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  IncompleteAccountError,
  InvalidCredentialsError,
  UnauthorizedError,
} from "@/modules/auth/auth.errors";
import type { LoginInput } from "@/modules/auth/auth.schema";
import {
  type AuthenticatedUser,
  userRoleSchema,
} from "@/modules/auth/auth.types";

const appMetadataSchema = z.object({
  organization_id: z.uuid(),
  role: userRoleSchema,
});

function toAuthenticatedUser(user: User): AuthenticatedUser {
  const metadata = appMetadataSchema.safeParse(user.app_metadata);

  if (!user.email || !metadata.success) {
    throw new IncompleteAccountError();
  }

  return {
    id: user.id,
    email: user.email,
    organizationId: metadata.data.organization_id,
    role: metadata.data.role,
  };
}

export async function login(input: LoginInput): Promise<AuthenticatedUser> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error || !data.user || !data.session) {
    throw new InvalidCredentialsError();
  }

  try {
    return toAuthenticatedUser(data.user);
  } catch (error: unknown) {
    await supabase.auth.signOut({ scope: "local" });
    throw error;
  }
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    throw new UnauthorizedError();
  }
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new UnauthorizedError();
  }

  return toAuthenticatedUser(data.user);
}
