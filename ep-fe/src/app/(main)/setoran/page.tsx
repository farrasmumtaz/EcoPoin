"use client";

import { Check, ChevronDown, ChevronUp, FileText, Pencil, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { cancelTransaction, completeTransaction, finalizeTransaction, getTransactions, type Transaction, type TransactionStatus } from "@/app/services/transactions/transactions";

const PAGE_SIZE = 9;
const STATUS_LABELS: Record<TransactionStatus, string> = { DRAFT: "Draft", FINALIZED: "Menunggu Pencairan", COMPLETED: "Selesai", CANCELLED: "Dibatalkan", VOIDED: "Void" };
const STATUS_STYLES: Record<TransactionStatus, string> = { DRAFT: "bg-amber-50 text-amber-700", FINALIZED: "bg-blue-50 text-blue-700", COMPLETED: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-red-50 text-red-700", VOIDED: "bg-gray-100 text-gray-600" };
const currency = (value: string): string => Number(value).toLocaleString("id-ID");
const weight = (value: string): string => Number(value).toLocaleString("id-ID", { maximumFractionDigits: 3 });
type TransactionDialog =
  | { readonly type: "finalize"; readonly transaction: Transaction }
  | { readonly type: "complete"; readonly transaction: Transaction }
  | { readonly type: "cancel"; readonly transaction: Transaction }
  | null;

export default function Setoran() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<readonly Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<TransactionDialog>(null);
  const [payoutMethod, setPayoutMethod] = useState<"DIRECT_CASH" | "SAVINGS">("SAVINGS");
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 400);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const result = await getTransactions({ search: query || undefined, status: status || undefined, page, limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(result.items);
        setTotalPages(Math.max(result.pagination.totalPages, 1));
      } catch (error: unknown) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Setoran gagal dimuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [page, query, refreshKey, status]);

  const pages = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  const run = async (transactionId: string, action: () => Promise<Transaction>, message: string): Promise<void> => {
    setProcessingId(transactionId);
    try { await action(); toast.success(message); setLoading(true); setRefreshKey((current) => current + 1); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Aksi transaksi gagal."); }
    finally { setProcessingId(null); }
  };

  const submitDialog = async (): Promise<void> => {
    if (!dialog) return;
    if (dialog.type === "cancel" && cancellationReason.trim().length < 3) {
      toast.error("Alasan pembatalan minimal 3 karakter.");
      return;
    }
    const currentDialog = dialog;
    setDialog(null);
    if (currentDialog.type === "finalize") {
      await run(currentDialog.transaction.id, () => finalizeTransaction(currentDialog.transaction.id), "Setoran berhasil difinalisasi.");
    } else if (currentDialog.type === "complete") {
      await run(currentDialog.transaction.id, () => completeTransaction(currentDialog.transaction.id, payoutMethod), "Setoran berhasil diselesaikan.");
    } else {
      await run(currentDialog.transaction.id, () => cancelTransaction(currentDialog.transaction.id, cancellationReason.trim()), "Setoran berhasil dibatalkan.");
      setCancellationReason("");
    }
  };

  return <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-6">
    <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center">
      <div className="relative flex-1"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama warga atau jenis sampah" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none focus:border-primary" /></div>
      <select value={status} onChange={(event) => { setStatus(event.target.value as TransactionStatus | ""); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-primary"><option value="">Semua status</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <button type="button" onClick={() => router.push("/setoran/tambah-setoran")} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/80 cursor-pointer">Tambah Setoran <Plus size={16} /></button>
    </div>

    <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white">
      <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="sticky top-0 z-10 bg-white"><tr className="border-b border-gray-200 text-gray-800"><th className="px-5 py-4">Tanggal</th><th className="px-5 py-4">Nasabah/Unit</th><th className="px-5 py-4">Item</th><th className="px-5 py-4 text-right">Berat</th><th className="px-5 py-4 text-right">Total</th><th className="px-5 py-4 text-center">Status</th><th className="px-5 py-4 text-right">Aksi</th></tr></thead>
      <tbody>{loading ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Memuat data setoran...</td></tr> : items.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Belum ada setoran yang sesuai.</td></tr> : items.map((transaction) => <Rows key={transaction.id} transaction={transaction} expanded={expandedId === transaction.id} processing={processingId === transaction.id} onToggle={() => setExpandedId((current) => current === transaction.id ? null : transaction.id)} onEdit={() => router.push(`/setoran/tambah-setoran?id=${encodeURIComponent(transaction.id)}`)} onFinalize={() => setDialog({ type: "finalize", transaction })} onComplete={() => setDialog({ type: "complete", transaction })} onCancel={() => setDialog({ type: "cancel", transaction })} />)}</tbody></table></div>
      {totalPages > 1 && <div className="flex justify-center gap-2 border-t border-gray-200 py-4 text-sm">{pages.map((number) => <button type="button" key={number} onClick={() => setPage(number)} className={`h-8 min-w-8 rounded-md px-2 cursor-pointer ${page === number ? "bg-primary font-bold text-white" : "text-gray-600 hover:bg-gray-100"}`}>{number}</button>)}</div>}
    </div>
    {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold text-gray-900">{dialog.type === "complete" ? "Selesaikan Setoran" : dialog.type === "finalize" ? "Finalisasi Setoran" : "Batalkan Setoran"}</h2><p className="mt-1 text-sm text-gray-500">{dialog.transaction.memberName} · Rp{currency(dialog.transaction.totalAmount)}</p>{dialog.type === "complete" ? <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => setPayoutMethod("SAVINGS")} className={`rounded-lg border p-4 text-left ${payoutMethod === "SAVINGS" ? "border-primary bg-primary/5 text-primary" : "border-gray-200"}`}><strong className="block">Tabungan</strong><span className="text-xs">Tambahkan ke saldo nasabah</span></button><button type="button" onClick={() => setPayoutMethod("DIRECT_CASH")} className={`rounded-lg border p-4 text-left ${payoutMethod === "DIRECT_CASH" ? "border-primary bg-primary/5 text-primary" : "border-gray-200"}`}><strong className="block">Tunai</strong><span className="text-xs">Tidak menambah saldo</span></button></div> : dialog.type === "cancel" ? <div className="mt-5"><label className="mb-2 block text-sm font-semibold text-gray-800">Alasan pembatalan</label><textarea value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-primary" placeholder="Tuliskan alasan pembatalan" /></div> : <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Setelah difinalisasi, data nasabah, item, dan harga tidak dapat diedit langsung.</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDialog(null)} className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700">Kembali</button><button type="button" onClick={() => void submitDialog()} className={`rounded-lg px-5 py-2.5 font-semibold text-white ${dialog.type === "cancel" ? "bg-danger" : "bg-primary"}`}>{dialog.type === "complete" ? "Selesaikan" : dialog.type === "finalize" ? "Finalisasi" : "Batalkan Setoran"}</button></div></div></div>}
  </div>;
}

interface RowsProps { readonly transaction: Transaction; readonly expanded: boolean; readonly processing: boolean; readonly onToggle: () => void; readonly onEdit: () => void; readonly onFinalize: () => void; readonly onComplete: () => void; readonly onCancel: () => void; }

function Rows({ transaction, expanded, processing, onToggle, onEdit, onFinalize, onComplete, onCancel }: RowsProps) {
  const names = transaction.items.map((item) => item.wasteTypeName).join(", ");
  const cancellable = transaction.status === "DRAFT" || transaction.status === "FINALIZED";
  return <>
    <tr className="border-b border-gray-100 text-gray-800 hover:bg-gray-50"><td className="px-5 py-4">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(transaction.createdAt))}</td><td className="px-5 py-4 font-semibold">{transaction.memberName}</td><td className="max-w-56 truncate px-5 py-4" title={names}>{names || "-"}</td><td className="px-5 py-4 text-right font-semibold">{weight(transaction.totalWeightKg)} kg</td><td className="px-5 py-4 text-right font-semibold">Rp{currency(transaction.totalAmount)}</td><td className="px-5 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[transaction.status]}`}>{STATUS_LABELS[transaction.status]}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2">
      {transaction.status === "DRAFT" && <button type="button" disabled={processing} onClick={onEdit} title="Edit draft" className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white disabled:opacity-50 cursor-pointer"><Pencil size={16} /></button>}
      {transaction.status === "DRAFT" && <button type="button" disabled={processing} onClick={onFinalize} title="Finalisasi" className="flex h-9 w-9 items-center justify-center rounded-md border border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50 cursor-pointer"><Check size={16} /></button>}
      {transaction.status === "FINALIZED" && <button type="button" disabled={processing} onClick={onComplete} className="rounded-md border border-primary px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white disabled:opacity-50 cursor-pointer">Cairkan</button>}
      {transaction.status === "COMPLETED" && <button type="button" onClick={() => window.open(`/receipt/${transaction.receiptToken}`, "_blank", "noopener,noreferrer")} title="Buka nota" className="flex h-9 w-9 items-center justify-center rounded-md border border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white cursor-pointer"><FileText size={16} /></button>}
      {cancellable && <button type="button" disabled={processing} onClick={onCancel} title="Batalkan" className="flex h-9 w-9 items-center justify-center rounded-md border border-danger text-danger hover:bg-danger hover:text-white disabled:opacity-50 cursor-pointer"><X size={16} /></button>}
      <button type="button" onClick={onToggle} title="Detail" className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:border-primary hover:text-primary cursor-pointer">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
    </div></td></tr>
    {expanded && <tr className="border-b border-gray-200 bg-gray-50"><td colSpan={7} className="px-6 py-5"><div className="mb-3 flex flex-wrap gap-5 text-xs text-gray-500"><span>ID: {transaction.id}</span><span>Sumber: {transaction.source === "IMPORT" ? "Impor" : "Input langsung"}</span><span>Pencairan: {transaction.payoutMethod === "SAVINGS" ? "Tabungan" : transaction.payoutMethod === "DIRECT_CASH" ? "Tunai" : "Belum dipilih"}</span></div><div className="overflow-hidden rounded-lg border border-gray-200 bg-white"><table className="w-full text-xs"><thead className="bg-gray-100"><tr><th className="px-4 py-2 text-left">Jenis</th><th className="px-4 py-2 text-left">Kondisi</th><th className="px-4 py-2 text-right">Berat</th><th className="px-4 py-2 text-right">Harga/kg</th><th className="px-4 py-2 text-right">Subtotal</th></tr></thead><tbody>{transaction.items.map((item) => <tr key={item.id} className="border-t border-gray-100"><td className="px-4 py-2 font-semibold">{item.wasteTypeName}</td><td className="px-4 py-2">{item.condition === "SORTED" ? "Dipilah" : "Belum dipilah"}</td><td className="px-4 py-2 text-right">{weight(item.weightKg)} kg</td><td className="px-4 py-2 text-right">Rp{currency(item.pricePerKg)}</td><td className="px-4 py-2 text-right font-semibold">Rp{currency(item.subtotalAmount)}</td></tr>)}</tbody></table></div></td></tr>}
  </>;
}
