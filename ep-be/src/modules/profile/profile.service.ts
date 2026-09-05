import { getPrisma } from "@/infrastructure/database/prisma";
import type { AuthenticatedUser } from "@/modules/auth/auth.types";
import type { UpdateProfileInput } from "@/modules/profile/profile.schema";
import type { ProfileDto } from "@/modules/profile/profile.types";
import { AppError } from "@/shared/errors/app-error";

const select = {
  id: true, fullName: true, role: true,
  organization: { select: { id: true, name: true, address: true, contactPhone: true } },
} as const;

export async function getProfile(user: AuthenticatedUser): Promise<ProfileDto> {
  const profile = await getPrisma().profile.findFirst({
    where: { id: user.id, organizationId: user.organizationId, isActive: true }, select,
  });
  if (!profile) throw new AppError({ code: "PROFILE_NOT_FOUND", message: "Profil pengguna tidak ditemukan.", statusCode: 404 });
  return { ...profile, email: user.email };
}

export async function updateProfile(user: AuthenticatedUser, input: UpdateProfileInput): Promise<ProfileDto> {
  const changesOrganization = input.organizationName !== undefined || input.address !== undefined || input.contactPhone !== undefined;
  if (changesOrganization && user.role !== "ADMIN") {
    throw new AppError({ code: "FORBIDDEN", message: "Hanya admin yang dapat mengubah data organisasi.", statusCode: 403 });
  }
  await getPrisma().$transaction(async (tx) => {
    if (input.fullName !== undefined) await tx.profile.update({ where: { id: user.id }, data: { fullName: input.fullName } });
    if (changesOrganization) await tx.organization.update({ where: { id: user.organizationId }, data: {
      ...(input.organizationName !== undefined ? { name: input.organizationName } : {}),
      ...(input.address !== undefined ? { address: input.address || null } : {}),
      ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone || null } : {}),
    } });
    await tx.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.id, action: "PROFILE_UPDATED", entityType: "profile", entityId: user.id } });
  });
  return getProfile(user);
}
