import type {
  Prisma,
  WastePriceVersion,
  WasteType,
} from "@/generated/prisma/client";
import { getPrisma } from "@/infrastructure/database/prisma";
import {
  InvalidPriceRangeError,
  NoActivePriceError,
  WasteTypeNameConflictError,
  WasteTypeNotFoundError,
} from "@/modules/waste-types/waste-type.errors";
import type {
  CreatePriceVersionInput,
  CreateWasteTypeInput,
  ListPriceVersionsInput,
  ListWasteTypesInput,
  UpdateWasteTypeInput,
} from "@/modules/waste-types/waste-type.schema";
import type {
  PaginatedWastePriceVersions,
  PaginatedWasteTypes,
  WastePriceVersionDto,
  WasteTypeDto,
} from "@/modules/waste-types/waste-type.types";

function toDto(wasteType: WasteType): WasteTypeDto {
  return {
    id: wasteType.id,
    name: wasteType.name,
    category: wasteType.category,
    unit: wasteType.unit,
    isActive: wasteType.isActive,
    createdAt: wasteType.createdAt.toISOString(),
    updatedAt: wasteType.updatedAt.toISOString(),
  };
}

function toPriceVersionDto(version: WastePriceVersion): WastePriceVersionDto {
  return {
    id: version.id,
    wasteTypeId: version.wasteTypeId,
    priceScheme: version.priceScheme,
    pricePerKg: version.pricePerKg.toString(),
    effectiveFrom: version.effectiveFrom.toISOString(),
    effectiveUntil: version.effectiveUntil?.toISOString() ?? null,
    createdAt: version.createdAt.toISOString(),
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
  input: CreateWasteTypeInput,
): Promise<WasteTypeDto> {
  await assertNameAvailable(organizationId, input.name);
  const prisma = getPrisma();
  const wasteType = await prisma.wasteType.create({
    data: { organizationId, ...input },
  });
  return toDto(wasteType);
}

export async function updateWasteType(
  organizationId: string,
  id: string,
  input: UpdateWasteTypeInput,
): Promise<WasteTypeDto> {
  await getWasteType(organizationId, id);
  if (input.name) await assertNameAvailable(organizationId, input.name, id);

  const prisma = getPrisma();
  const wasteType = await prisma.wasteType.update({
    where: { id },
    data: input,
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

export async function listPriceVersions(
  organizationId: string,
  wasteTypeId: string,
  input: ListPriceVersionsInput,
): Promise<PaginatedWastePriceVersions> {
  await getWasteType(organizationId, wasteTypeId);
  const prisma = getPrisma();
  const where: Prisma.WastePriceVersionWhereInput = {
    wasteTypeId,
    ...(input.priceScheme ? { priceScheme: input.priceScheme } : {}),
  };
  const skip = (input.page - 1) * input.limit;
  const [items, total] = await prisma.$transaction([
    prisma.wastePriceVersion.findMany({
      where,
      orderBy: { effectiveFrom: "desc" },
      skip,
      take: input.limit,
    }),
    prisma.wastePriceVersion.count({ where }),
  ]);

  return {
    items: items.map(toPriceVersionDto),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

// Used both by the "active price" endpoint and by whatever eventually builds
// transaction items (still pending a team decision - see
// src/app/api/transactions/route.ts).
export async function getActivePrice(
  organizationId: string,
  wasteTypeId: string,
  priceScheme: string,
  at: Date = new Date(),
): Promise<WastePriceVersionDto> {
  await getWasteType(organizationId, wasteTypeId);
  const version = await getPrisma().wastePriceVersion.findFirst({
    where: {
      wasteTypeId,
      priceScheme,
      effectiveFrom: { lte: at },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: at } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!version) throw new NoActivePriceError();
  return toPriceVersionDto(version);
}

// Creating a new version closes whatever version was still open for that
// same (wasteTypeId, priceScheme) - prices are never edited in place so past
// transaction snapshots stay meaningful (see root README "Aturan Bisnis
// Kritis": "Perubahan daftar harga tidak mengubah transaksi lama").
export async function createPriceVersion(
  organizationId: string,
  wasteTypeId: string,
  input: CreatePriceVersionInput,
): Promise<WastePriceVersionDto> {
  await getWasteType(organizationId, wasteTypeId);
  const effectiveFrom = input.effectiveFrom ?? new Date();
  const prisma = getPrisma();

  const created = await prisma.$transaction(async (tx) => {
    const openVersion = await tx.wastePriceVersion.findFirst({
      where: {
        wasteTypeId,
        priceScheme: input.priceScheme,
        effectiveUntil: null,
      },
    });
    if (openVersion && openVersion.effectiveFrom >= effectiveFrom) {
      throw new InvalidPriceRangeError();
    }
    if (openVersion) {
      await tx.wastePriceVersion.update({
        where: { id: openVersion.id },
        data: { effectiveUntil: effectiveFrom },
      });
    }

    return tx.wastePriceVersion.create({
      data: {
        wasteTypeId,
        priceScheme: input.priceScheme,
        pricePerKg: input.pricePerKg,
        effectiveFrom,
      },
    });
  });

  return toPriceVersionDto(created);
}
