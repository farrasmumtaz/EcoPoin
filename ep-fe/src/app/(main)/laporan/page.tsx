"use client";

import { Calendar, Download, FileText, Filter, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getTransactionReport, type ReportFilters, type TransactionReport } from "@/app/services/reports/reports";
import { getWasteTypes, type WasteType } from "@/app/services/waste-types/waste-types";

const money = (value: string): string => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
const number = (value: string): string => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(value));
const initial: TransactionReport = { rows: [], summary: { transactionCount: 0, totalWeightKg: "0", totalAmount: "0" }, options: { rt: [] } };
const fieldClass = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function csvCell(value: string): string { return `"${value.replaceAll('"', '""')}"`; }

export default function LaporanPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rt, setRt] = useState("");
  const [wasteTypeId, setWasteTypeId] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"" | "DIRECT_CASH" | "SAVINGS">("");
  const [wasteTypes, setWasteTypes] = useState<readonly WasteType[]>([]);
  const [report, setReport] = useState<TransactionReport>(initial);
  const [loading, setLoading] = useState(true);

  const filters = useCallback((): ReportFilters => ({
    ...(dateFrom ? { dateFrom: `${dateFrom}T00:00:00+07:00` } : {}),
    ...(dateTo ? { dateTo: `${dateTo}T23:59:59.999+07:00` } : {}),
    ...(rt ? { rt } : {}), ...(wasteTypeId ? { wasteTypeId } : {}),
    ...(payoutMethod ? { payoutMethod } : {}),
  }), [dateFrom, dateTo, rt, wasteTypeId, payoutMethod]);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try { setReport(await getTransactionReport(filters())); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Laporan gagal dimuat."); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { void Promise.all([getTransactionReport(), getWasteTypes({ limit: 100 })]).then(([data, types]) => { setReport(data); setWasteTypes(types.items); }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Data laporan gagal dimuat.")).finally(() => setLoading(false)); }, []);

  const reset = (): void => { setDateFrom(""); setDateTo(""); setRt(""); setWasteTypeId(""); setPayoutMethod(""); };
  const exportCsv = (): void => {
    if (report.rows.length === 0) { toast.error("Tidak ada data untuk diekspor."); return; }
    const header = ["Tanggal", "No Nota", "No Nasabah", "Nama", "RT", "Jenis Sampah", "Kondisi", "Berat (kg)", "Harga/kg", "Subtotal", "Pencairan"];
    const lines = report.rows.map((row) => [new Date(row.completedAt).toLocaleString("id-ID"), row.receiptNumber ?? "-", row.memberNumber, row.memberName, row.rt ?? "-", row.wasteTypeName, row.condition === "SORTED" ? "Dipilah" : "Belum dipilah", row.weightKg, row.pricePerKg, row.subtotalAmount, row.payoutMethod === "SAVINGS" ? "Tabungan" : "Tunai"].map(csvCell).join(","));
    const blob = new Blob(["\uFEFF", header.map(csvCell).join(","), "\r\n", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(blob); anchor.download = `laporan-ecopoin-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(anchor.href);
    toast.success("Laporan CSV berhasil dibuat.");
  };

  return <main className="min-h-full bg-gray-50 p-6 text-gray-900 print:bg-white print:p-0">
    <header className="print:hidden"><h1 className="text-2xl font-bold">Laporan Transaksi</h1><p className="mt-1 text-sm text-gray-500">Rekap transaksi selesai berdasarkan filter operasional.</p></header>
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:hidden">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-sm font-semibold"><span className="mb-2 flex items-center gap-2"><Calendar size={16}/>Dari</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={fieldClass}/></label>
        <label className="text-sm font-semibold"><span className="mb-2 flex items-center gap-2"><Calendar size={16}/>Sampai</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={fieldClass}/></label>
        <label className="text-sm font-semibold"><span className="mb-2 block">RT</span><select value={rt} onChange={(event) => setRt(event.target.value)} className={fieldClass}><option value="">Semua RT</option>{report.options.rt.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-semibold"><span className="mb-2 block">Jenis Sampah</span><select value={wasteTypeId} onChange={(event) => setWasteTypeId(event.target.value)} className={fieldClass}><option value="">Semua jenis</option>{wasteTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-sm font-semibold"><span className="mb-2 block">Pencairan</span><select value={payoutMethod} onChange={(event) => setPayoutMethod(event.target.value as typeof payoutMethod)} className={fieldClass}><option value="">Semua metode</option><option value="SAVINGS">Tabungan</option><option value="DIRECT_CASH">Tunai</option></select></label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void load()} disabled={loading} className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><Filter size={17}/>Terapkan</button><button type="button" onClick={reset} className="cursor-pointer rounded-lg border border-gray-300 px-5 py-2.5 font-semibold transition hover:bg-gray-100">Reset</button><button type="button" onClick={exportCsv} className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg border border-primary px-5 py-2.5 font-semibold text-primary transition hover:bg-emerald-50"><Download size={17}/>CSV</button><button type="button" onClick={() => window.print()} disabled={loading || report.rows.length === 0} title={report.rows.length === 0 ? "Tidak ada data untuk dicetak" : "Cetak atau simpan laporan sebagai PDF"} className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"><Printer size={17}/>Cetak / PDF</button></div>
    </section>
    <section className="mt-5 grid gap-4 sm:grid-cols-3 print:grid-cols-3"><Summary label="Transaksi" value={String(report.summary.transactionCount)} icon={<FileText size={18}/>} /><Summary label="Total Berat" value={`${number(report.summary.totalWeightKg)} kg`} /><Summary label="Total Nilai" value={money(report.summary.totalAmount)} /></section>
    <section className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:overflow-visible print:shadow-none"><div className="hidden border-b p-5 print:block"><h1 className="text-xl font-bold">Laporan Transaksi EcoPoin</h1><p className="text-sm text-gray-600">Dicetak {new Date().toLocaleString("id-ID")}</p></div><div className="overflow-auto print:overflow-visible"><table className="w-full min-w-[1000px] text-sm print:min-w-0 print:table-fixed print:text-[9px]"><thead className="bg-gray-100 text-gray-700"><tr>{["Tanggal", "Nota", "Nasabah", "RT", "Jenis", "Kondisi", "Berat", "Harga/kg", "Subtotal", "Pencairan"].map((label) => <th key={label} className="px-4 py-3 text-left font-bold print:px-2 print:py-2">{label}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={10} className="p-12 text-center text-gray-500">Memuat laporan...</td></tr> : report.rows.length === 0 ? <tr><td colSpan={10} className="p-12 text-center text-gray-500">Tidak ada transaksi sesuai filter.</td></tr> : report.rows.map((row) => <tr key={`${row.transactionId}-${row.wasteTypeName}-${row.condition}`} className="border-t border-gray-100"><td className="px-4 py-3 print:px-2 print:py-2">{new Date(row.completedAt).toLocaleDateString("id-ID")}</td><td className="break-all px-4 py-3 font-mono text-xs print:px-2 print:py-2 print:text-[8px]">{row.receiptNumber ?? "-"}</td><td className="px-4 py-3 print:px-2 print:py-2"><strong className="block">{row.memberName}</strong><span className="text-xs text-gray-500 print:text-[8px]">{row.memberNumber}</span></td><td className="px-4 py-3 print:px-2 print:py-2">{row.rt ?? "-"}</td><td className="px-4 py-3 font-semibold print:px-2 print:py-2">{row.wasteTypeName}</td><td className="px-4 py-3 print:px-2 print:py-2">{row.condition === "SORTED" ? "Dipilah" : "Belum dipilah"}</td><td className="px-4 py-3 text-right print:px-2 print:py-2">{number(row.weightKg)} kg</td><td className="px-4 py-3 text-right print:px-2 print:py-2">{money(row.pricePerKg)}</td><td className="px-4 py-3 text-right font-bold print:px-2 print:py-2">{money(row.subtotalAmount)}</td><td className="px-4 py-3 print:px-2 print:py-2">{row.payoutMethod === "SAVINGS" ? "Tabungan" : "Tunai"}</td></tr>)}</tbody></table></div></section>
  </main>;
}

function Summary({ label, value, icon }: { readonly label: string; readonly value: string; readonly icon?: React.ReactNode }) { return <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold text-gray-500">{icon}{label}</div><div className="mt-2 text-2xl font-bold text-gray-900">{value}</div></article>; }
