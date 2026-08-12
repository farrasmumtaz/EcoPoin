import type { WasteCategory } from "@/generated/prisma/enums";

export interface WasteTypeDto {
  readonly id: string;
  readonly name: string;
  readonly category: WasteCategory;
  readonly unit: string;
  readonly pointsPerKg: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginatedWasteTypes {
  readonly items: readonly WasteTypeDto[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}
