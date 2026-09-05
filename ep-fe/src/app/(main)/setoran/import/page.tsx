"use client";

import { ArrowLeft, Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import toast from "react-hot-toast";

import {
  importTransactions,
  type TransactionImportResult,
  type TransactionImportRow,
} from "@/app/services/transactions/transactions";

const REQUIRED_HEADERS = ["memberNumber", "wasteTypeName", "condition", "weightKg", "payoutMethod"] as const;
const TEMPLATE = "memberNumber,wasteTypeName,condition,weightKg,payoutMethod,notes\nNSB-001,Botol Plastik,SORTED,2.5,SAVINGS,Setoran Agustus\n";

function parseCsvLine(line: string): readonly string[] {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  fields.push(value.trim());
  return fields;
}

function parseCsv(content: string): readonly TransactionImportRow[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV harus memiliki header dan minimal satu baris data.");
  const headers = parseCsvLine(lines[0]);
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) throw new Error(`Kolom '${required}' tidak ditemukan.`);
  }
  const indexOf = (header: string): number => headers.indexOf(header);
  return lines.slice(1).map((line, index) => {
    const fields = parseCsvLine(line);
    const condition = fields[indexOf("condition")]?.toUpperCase();
    const payoutMethod = fields[indexOf("payoutMethod")]?.toUpperCase();
    const weightKg = Number(fields[indexOf("weightKg")]?.replace(",", "."));
    if (condition !== "SORTED" && condition !== "UNSORTED") throw new Error(`Baris ${index + 2}: condition harus SORTED atau UNSORTED.`);
    if (payoutMethod !== "DIRECT_CASH" && payoutMethod !== "SAVINGS") throw new Error(`Baris ${index + 2}: payoutMethod harus DIRECT_CASH atau SAVINGS.`);
    if (!Number.isFinite(weightKg) || weightKg <= 0) throw new Error(`Baris ${index + 2}: weightKg harus lebih dari 0.`);
    const notes = fields[indexOf("notes")]?.trim();
    return {
      rowNumber: index + 2,
      memberNumber: fields[indexOf("memberNumber")] ?? "",
      wasteTypeName: fields[indexOf("wasteTypeName")] ?? "",
      condition,
      weightKg,
      payoutMethod,
      ...(notes ? { notes } : {}),
    };
  });
}

export default function ImportSetoranPage() {
  const router = useRouter();
  const [batchId, setBatchId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<readonly TransactionImportRow[]>([]);
  const [preview, setPreview] = useState<TransactionImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const downloadTemplate = (): void => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "template-import-setoran.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selectFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Pilih file dengan ekstensi .csv.");
      event.target.value = "";
      return;
    }
    try {
      const parsedRows = parseCsv(await file.text());
      const nextBatchId = crypto.randomUUID();
      setLoading(true);
      const result = await importTransactions(nextBatchId, parsedRows, true);
      setRows(parsedRows);
      setBatchId(nextBatchId);
      setFileName(file.name);
      setPreview(result);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "CSV tidak dapat dibaca.");
      setPreview(null);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const commit = async (): Promise<void> => {
    if (!batchId || !preview || preview.invalidRows > 0) return;
    setLoading(true);
    try {
      const result = await importTransactions(batchId, rows, false);
      toast.success(`${result.importedRows} setoran berhasil diimpor.`);
      router.push("/setoran");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Impor setoran gagal.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-full bg-gray-50 p-6 text-gray-900">
    <div className="mx-auto max-w-6xl">
      <button type="button" onClick={() => router.push("/setoran")} className="mb-5 flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary"><ArrowLeft size={18} /> Kembali ke Setoran</button>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div><h1 className="text-2xl font-bold">Impor Setoran CSV</h1><p className="mt-1 text-sm text-gray-500">Unggah, periksa hasil validasi, lalu konfirmasi impor.</p></div>
          <button type="button" onClick={downloadTemplate} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"><Download size={17} /> Unduh Template</button>
        </div>
        <label className="mt-6 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center hover:border-primary hover:bg-primary/5">
          <FileSpreadsheet size={38} className="text-primary" />
          <span className="mt-3 font-semibold">{loading ? "Memvalidasi CSV..." : fileName || "Pilih file CSV"}</span>
          <span className="mt-1 text-xs text-gray-500">Maksimal 500 baris. Gunakan header dari template.</span>
          <input type="file" accept=".csv,text/csv" disabled={loading} onChange={(event) => void selectFile(event)} className="sr-only" />
        </label>
      </div>

      {preview && <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
          <div><h2 className="font-bold">Preview Validasi</h2><p className="text-sm text-gray-500">{preview.validRows} valid · {preview.invalidRows} bermasalah</p></div>
          <button type="button" disabled={loading || preview.invalidRows > 0} onClick={() => void commit()} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-gray-300"><Upload size={17} /> Konfirmasi Impor</button>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="bg-gray-50 text-left"><tr><th className="px-5 py-3">Baris</th><th className="px-5 py-3">Nasabah</th><th className="px-5 py-3">Jenis</th><th className="px-5 py-3">Kondisi</th><th className="px-5 py-3 text-right">Berat</th><th className="px-5 py-3 text-right">Subtotal</th><th className="px-5 py-3">Status</th></tr></thead>
          <tbody>{preview.rows.map((result, index) => <tr key={result.rowNumber} className="border-t border-gray-100"><td className="px-5 py-3">{result.rowNumber}</td><td className="px-5 py-3">{result.memberName ?? rows[index]?.memberNumber}</td><td className="px-5 py-3">{result.wasteTypeName ?? rows[index]?.wasteTypeName}</td><td className="px-5 py-3">{rows[index]?.condition === "SORTED" ? "Dipilah" : "Belum dipilah"}</td><td className="px-5 py-3 text-right">{rows[index]?.weightKg.toLocaleString("id-ID")} kg</td><td className="px-5 py-3 text-right">{result.subtotalAmount ? `Rp${Number(result.subtotalAmount).toLocaleString("id-ID")}` : "-"}</td><td className="px-5 py-3">{result.valid ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Valid</span> : <span className="text-xs font-semibold text-red-600">{result.errors.join(" ")}</span>}</td></tr>)}</tbody>
        </table></div>
      </div>}
    </div>
  </div>;
}
