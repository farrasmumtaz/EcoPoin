import type { MemberType } from "@/generated/prisma/enums";

export interface PassbookHistoryEntryDto {
  readonly type: "DEPOSIT" | "WITHDRAWAL";
  // Signed decimal as a string: positive for a savings deposit, negative for
  // a paid withdrawal.
  readonly amountRupiah: string;
  readonly description: string;
  readonly occurredAt: string;
}

// Intentionally privacy-filtered: no phone numbers, no organizationId, no
// staff/creator identities, no unrelated members. Only what the member
// themselves should see on their own public receipt link.
export interface PassbookDto {
  readonly memberNumber: string;
  readonly fullName: string;
  readonly memberType: MemberType;
  readonly balanceRupiah: string;
  readonly history: readonly PassbookHistoryEntryDto[];
}
