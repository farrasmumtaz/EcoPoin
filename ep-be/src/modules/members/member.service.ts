import { randomUUID } from "node:crypto";

import type { Member, Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import {
  InvalidMemberRelationshipError,
  MemberNotFoundError,
} from "@/modules/members/member.errors";
import type {
  CreateMemberInput,
  ListMembersInput,
  UpdateMemberInput,
} from "@/modules/members/member.schema";
import type {
  MemberActivityStatus,
  MemberDto,
  PaginatedMembers,
  RelatedMemberDto,
} from "@/modules/members/member.types";

const memberRelations = {
  organization: { select: { activityThresholdDays: true } },
  individualRelationships: {
    where: { isActive: true },
    include: { unit: true },
  },
  unitRelationships: {
    where: { isActive: true },
    include: { individual: true },
  },
} satisfies Prisma.MemberInclude;

type MemberWithRelations = Prisma.MemberGetPayload<{
  include: typeof memberRelations;
}>;

function toRelatedMember(member: Member): RelatedMemberDto {
  return {
    id: member.id,
    memberNumber: member.memberNumber,
    fullName: member.fullName,
    type: member.type,
  };
}

function getActivityStatus(
  member: Member,
  thresholdDays: number,
): MemberActivityStatus {
  if (!member.lastActivityAt) return "NEVER_ACTIVE";

  const threshold = new Date();
  threshold.setUTCDate(threshold.getUTCDate() - thresholdDays);
  return member.lastActivityAt >= threshold ? "ACTIVE" : "INACTIVE";
}

function toDto(member: MemberWithRelations): MemberDto {
  return {
    id: member.id,
    memberNumber: member.memberNumber,
    fullName: member.fullName,
    type: member.type,
    rt: member.rt,
    phone: member.phone,
    picName: member.picName,
    picPhone: member.picPhone,
    isActive: member.isActive,
    activityStatus: getActivityStatus(
      member,
      member.organization.activityThresholdDays,
    ),
    lastActivityAt: member.lastActivityAt?.toISOString() ?? null,
    relatedUnits: member.individualRelationships.map(({ unit }) =>
      toRelatedMember(unit),
    ),
    relatedIndividuals: member.unitRelationships.map(({ individual }) =>
      toRelatedMember(individual),
    ),
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}

function createMemberNumber(): string {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `NSB-${new Date().getUTCFullYear()}-${suffix}`;
}

async function validateUnits(
  organizationId: string,
  unitIds: readonly string[],
): Promise<void> {
  if (unitIds.length === 0) return;

  const uniqueIds = [...new Set(unitIds)];
  const count = await getPrisma().member.count({
    where: {
      organizationId,
      id: { in: uniqueIds },
      type: "UNIT",
      isActive: true,
    },
  });

  if (count !== uniqueIds.length) throw new InvalidMemberRelationshipError();
}

export async function listMembers(
  organizationId: string,
  input: ListMembersInput,
): Promise<PaginatedMembers> {
  const prisma = getPrisma();
  const where: Prisma.MemberWhereInput = {
    organizationId,
    ...(input.type ? { type: input.type } : {}),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    ...(input.unitId
      ? {
          individualRelationships: {
            some: { unitId: input.unitId, isActive: true },
          },
        }
      : {}),
    ...(input.search
      ? {
          OR: [
            { fullName: { contains: input.search, mode: "insensitive" } },
            { memberNumber: { contains: input.search, mode: "insensitive" } },
            { phone: { contains: input.search, mode: "insensitive" } },
            { picName: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [items, total] = await prisma.$transaction([
    prisma.member.findMany({
      where,
      include: memberRelations,
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      skip,
      take: input.limit,
    }),
    prisma.member.count({ where }),
  ]);

  return {
    items: items.map(toDto),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function getMember(
  organizationId: string,
  id: string,
): Promise<MemberDto> {
  const member = await getPrisma().member.findFirst({
    where: { id, organizationId },
    include: memberRelations,
  });
  if (!member) throw new MemberNotFoundError();
  return toDto(member);
}

export async function createMember(
  organizationId: string,
  input: CreateMemberInput,
): Promise<MemberDto> {
  await validateUnits(organizationId, input.unitIds);
  const { unitIds, ...profile } = input;
  const prisma = getPrisma();
  const member = await prisma.$transaction(async (transaction) => {
    const created = await transaction.member.create({
      data: {
        organizationId,
        memberNumber: createMemberNumber(),
        ...profile,
      },
    });

    if (created.type === "INDIVIDUAL" && unitIds.length > 0) {
      await transaction.memberRelationship.createMany({
        data: [...new Set(unitIds)].map((unitId) => ({
          organizationId,
          individualId: created.id,
          unitId,
        })),
      });
    }

    return transaction.member.findUniqueOrThrow({
      where: { id: created.id },
      include: memberRelations,
    });
  });
  return toDto(member);
}

export async function updateMember(
  organizationId: string,
  id: string,
  input: UpdateMemberInput,
): Promise<MemberDto> {
  const current = await getPrisma().member.findFirst({
    where: { id, organizationId },
  });
  if (!current) throw new MemberNotFoundError();
  if (current.type === "UNIT" && input.unitIds) {
    throw new InvalidMemberRelationshipError(
      "Only individual members can be linked to units.",
    );
  }
  if (
    current.type === "UNIT" &&
    input.picName !== undefined &&
    input.picName === null
  ) {
    throw new InvalidMemberRelationshipError(
      "PIC name is required for a unit.",
    );
  }
  if (current.type === "INDIVIDUAL" && (input.picName || input.picPhone)) {
    throw new InvalidMemberRelationshipError(
      "PIC fields are only valid for a unit.",
    );
  }

  const { unitIds, ...profile } = input;
  if (unitIds) await validateUnits(organizationId, unitIds);
  const prisma = getPrisma();
  const member = await prisma.$transaction(async (transaction) => {
    await transaction.member.update({ where: { id }, data: profile });

    if (unitIds) {
      await transaction.memberRelationship.deleteMany({
        where: { organizationId, individualId: id },
      });
      if (unitIds.length > 0) {
        await transaction.memberRelationship.createMany({
          data: [...new Set(unitIds)].map((unitId) => ({
            organizationId,
            individualId: id,
            unitId,
          })),
        });
      }
    }

    return transaction.member.findUniqueOrThrow({
      where: { id },
      include: memberRelations,
    });
  });
  return toDto(member);
}

export async function deactivateMember(
  organizationId: string,
  id: string,
): Promise<MemberDto> {
  await getMember(organizationId, id);
  const member = await getPrisma().member.update({
    where: { id },
    data: { isActive: false },
    include: memberRelations,
  });
  return toDto(member);
}
