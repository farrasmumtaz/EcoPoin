import type { UserRole } from "@/modules/auth/auth.types";

export interface ProfileDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly address: string | null;
    readonly contactPhone: string | null;
  };
}
