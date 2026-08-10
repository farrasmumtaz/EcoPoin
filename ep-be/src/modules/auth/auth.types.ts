import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "OPERATOR", "COORDINATOR"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly organizationId: string;
  readonly role: UserRole;
}
