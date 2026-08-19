import type { MemberType } from "@/generated/prisma/enums";

export type MemberActivityStatus = "ACTIVE" | "INACTIVE" | "NEVER_ACTIVE";

export interface RelatedMemberDto {
  readonly id: string;
  readonly memberNumber: string;
  readonly fullName: string;
  readonly type: MemberType;
}

export interface MemberDto {
  readonly id: string;
  readonly memberNumber: string;
  readonly fullName: string;
  readonly type: MemberType;
  readonly rt: string | null;
  readonly phone: string | null;
  readonly picName: string | null;
  readonly picPhone: string | null;
  readonly isActive: boolean;
  readonly activityStatus: MemberActivityStatus;
  readonly lastActivityAt: string | null;
  readonly relatedUnits: readonly RelatedMemberDto[];
  readonly relatedIndividuals: readonly RelatedMemberDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginatedMembers {
  readonly items: readonly MemberDto[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}
