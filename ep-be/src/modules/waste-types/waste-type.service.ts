import type { Prisma, WasteType } from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import {
  WasteTypeNameConflictError,
  WasteTypeNotFoundError,
} from "@/modules/waste-types/waste-type.errors";
import type {
  CreateWasteTypeInput,
  ListWasteTypesInput,
  UpdateWasteTypeInput,
} from "@/modules/waste-types/waste-type.schema";
import type {
  PaginatedWasteTypes,
  WasteTypeDto,
} from "@/modules/waste-types/waste-type.types";

function toDto(wasteType: WasteType): WasteTypeDto {
  return {
    id: wasteType.id,
    name: wasteType.name,
    category: wasteType.category,
    unit: wasteType.unit,
    pointsPerKg: wasteType.pointsPerKg.toString(),
    isActive: wasteType.isActive,
    createdAt: wasteType.createdAt.toISOString(),
    updatedAt: wasteType.updatedAt.toISOString(),
  };
}

async function assertNameAvailable(
  organizationId: string,
  name: string,
  excludeId?: string,
): Promise<void> {
  const prisma = getPrisma();
  const existing = await prisma.wasteType.findFirst({
    where: {
      organizationId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) throw new WasteTypeNameConflictError();
}

export async function listWasteTypes(
  organizationId: string,
  input: ListWasteTypesInput,
): Promise<PaginatedWasteTypes> {
  const prisma = getPrisma();
  const where: Prisma.WasteTypeWhereInput = {
    organizationId,
    ...(input.category ? { category: input.category } : {}),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    ...(input.search
      ? { name: { contains: input.search, mode: "insensitive" } }
      : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [items, total] = await prisma.$transaction([
    prisma.wasteType.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip,
      take: input.limit,
    }),
    prisma.wasteType.count({ where }),
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

export async function getWasteType(
  organizationId: string,
  id: string,
): Promise<WasteTypeDto> {
  const prisma = getPrisma();
  const wasteType = await prisma.wasteType.findFirst({
    where: { id, organizationId },
  });
  if (!wasteType) throw new WasteTypeNotFoundError();
  return toDto(wasteType);
}

export async function createWasteType(
  organizationId: string,
  actorId: string,
  input: CreateWasteTypeInput,
): Promise<WasteTypeDto> {
  await assertNameAvailable(organizationId, input.name);
  const prisma = getPrisma();
  const wasteType = await prisma.wasteType.create({
    data: {
      organizationId,
      ...input,
      priceVersions: { create: { organizationId, pricePerKg: input.pointsPerKg, effectiveFrom: new Date(), createdBy: actorId } },
    },
  });
  return toDto(wasteType);
}

export async function updateWasteType(
  organizationId: string,
  actorId: string,
  id: string,
  input: UpdateWasteTypeInput,
): Promise<WasteTypeDto> {
  await getWasteType(organizationId, id);
  if (input.name) await assertNameAvailable(organizationId, input.name, id);

  const prisma = getPrisma();
  const wasteType = await prisma.$transaction(async (tx) => {
    const changedAt = new Date();
    if (input.pointsPerKg !== undefined) {
      await tx.wastePriceVersion.updateMany({
        where: { organizationId, wasteTypeId: id, effectiveUntil: null },
        data: { effectiveUntil: changedAt },
      });
    }
    return tx.wasteType.update({
      where: { id },
      data: {
        ...input,
        ...(input.pointsPerKg !== undefined
          ? { priceVersions: { create: { organizationId, pricePerKg: input.pointsPerKg, effectiveFrom: changedAt, createdBy: actorId } } }
          : {}),
      },
    });
  });
  return toDto(wasteType);
}

export async function deactivateWasteType(
  organizationId: string,
  id: string,
): Promise<WasteTypeDto> {
  await getWasteType(organizationId, id);
  const prisma = getPrisma();
  const wasteType = await prisma.wasteType.update({
    where: { id },
    data: { isActive: false },
  });
  return toDto(wasteType);
}
