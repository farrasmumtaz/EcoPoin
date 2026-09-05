export interface TransactionImportRowResult {
  readonly rowNumber: number;
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly memberName: string | null;
  readonly wasteTypeName: string | null;
  readonly pricePerKg: string | null;
  readonly subtotalAmount: string | null;
  readonly transactionId: string | null;
}

export interface TransactionImportResult {
  readonly batchId: string;
  readonly dryRun: boolean;
  readonly validRows: number;
  readonly invalidRows: number;
  readonly importedRows: number;
  readonly rows: readonly TransactionImportRowResult[];
}
