import type { Prisma } from "@/generated/prisma/client";
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

function getActivePriceInclude() {
  const now = new Date();
  return {
    priceVersions: {
      where: {
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      },
      orderBy: { effectiveFrom: "desc" },
    },
  } satisfies Prisma.WasteTypeInclude;
}

type WasteTypeWithPrice = Prisma.WasteTypeGetPayload<{
  include: ReturnType<typeof getActivePriceInclude>;
}>;

function toDto(wasteType: WasteTypeWithPrice): WasteTypeDto {
  const sortedPrice = wasteType.priceVersions.find((price) => price.condition === "SORTED");
  const unsortedPrice = wasteType.priceVersions.find((price) => price.condition === "UNSORTED");
  return {
    id: wasteType.id,
    name: wasteType.name,
    category: wasteType.category,
    unit: wasteType.unit,
    prices: {
      sorted: sortedPrice?.pricePerKg.toString() ?? "0",
      unsorted: unsortedPrice?.pricePerKg.toString() ?? "0",
    },
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
      include: getActivePriceInclude(),
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
    include: getActivePriceInclude(),
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
      name: input.name,
      category: input.category,
      unit: input.unit,
      priceVersions: {
        create: [
          { organizationId, condition: "SORTED", pricePerKg: input.sortedPricePerKg, effectiveFrom: new Date(), createdBy: actorId },
          { organizationId, condition: "UNSORTED", pricePerKg: input.unsortedPricePerKg, effectiveFrom: new Date(), createdBy: actorId },
        ],
      },
    },
    include: getActivePriceInclude(),
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
    const changedConditions = [
      ...(input.sortedPricePerKg !== undefined ? ["SORTED" as const] : []),
      ...(input.unsortedPricePerKg !== undefined ? ["UNSORTED" as const] : []),
    ];
    if (changedConditions.length > 0) {
      await tx.wastePriceVersion.updateMany({
        where: { organizationId, wasteTypeId: id, condition: { in: changedConditions }, effectiveUntil: null },
        data: { effectiveUntil: changedAt },
      });
    }
    const { sortedPricePerKg, unsortedPricePerKg, ...wasteTypeData } = input;
    const newPrices = [
      ...(sortedPricePerKg !== undefined
        ? [{ organizationId, condition: "SORTED" as const, pricePerKg: sortedPricePerKg, effectiveFrom: changedAt, createdBy: actorId }]
        : []),
      ...(unsortedPricePerKg !== undefined
        ? [{ organizationId, condition: "UNSORTED" as const, pricePerKg: unsortedPricePerKg, effectiveFrom: changedAt, createdBy: actorId }]
        : []),
    ];
    return tx.wasteType.update({
      where: { id },
      data: {
        ...wasteTypeData,
        ...(newPrices.length > 0 ? { priceVersions: { create: newPrices } } : {}),
      },
      include: getActivePriceInclude(),
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
    include: getActivePriceInclude(),
  });
  return toDto(wasteType);
}
