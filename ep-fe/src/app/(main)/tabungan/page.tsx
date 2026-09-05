"use client";

import { ArrowDownCircle, ArrowUpCircle, Search, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getLedger, type LedgerEntry, type LedgerEntryType } from "@/app/services/ledger/ledger";

const LABELS: Record<LedgerEntryType, string> = { DEPOSIT: "Kredit Setoran", WITHDRAWAL: "Penarikan", REVERSAL: "Reversal", ADJUSTMENT: "Penyesuaian" };
const PAGE_SIZE = 9;
const money = (value: string): string => `Rp${Number(value).toLocaleString("id-ID")}`;

export default function Tabungan() {
  const [search, setSearch] = useState(""); const [query, setQuery] = useState("");
  const [type, setType] = useState<LedgerEntryType | "">(""); const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<readonly LedgerEntry[]>([]); const [pages, setPages] = useState(1);
  const [summary, setSummary] = useState({ totalCredit: "0", totalDebit: "0", balance: "0" }); const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 400); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => { let active = true; async function load() { try { const result = await getLedger({ search: query || undefined, entryType: type || undefined, page, limit: PAGE_SIZE }); if (!active) return; setEntries(result.items); setPages(Math.max(result.pagination.totalPages, 1)); setSummary(result.summary); } catch (error: unknown) { if (active) toast.error(error instanceof Error ? error.message : "Mutasi gagal dimuat."); } finally { if (active) setLoading(false); } } void load(); return () => { active = false; }; }, [page, query, type]);
  const visiblePages = useMemo(() => Array.from({ length: pages }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.max(5, page + 2)), [page, pages]);
  return <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-6">
    <div className="grid gap-4 md:grid-cols-3"><Summary title="Saldo Tabungan" value={summary.balance} icon={<Wallet size={19} />} color="text-primary" /><Summary title="Total Kredit" value={summary.totalCredit} icon={<ArrowDownCircle size={19} />} color="text-emerald-600" /><Summary title="Total Debit" value={summary.totalDebit} icon={<ArrowUpCircle size={19} />} color="text-red-600" /></div>
    <div className="mt-5 flex gap-3"><div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau nomor nasabah" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-primary" /></div><select value={type} onChange={(event) => { setType(event.target.value as LedgerEntryType | ""); setPage(1); }} className="rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"><option value="">Semua mutasi</option>{Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white"><div className="overflow-auto"><table className="w-full min-w-[850px] text-sm"><thead className="sticky top-0 bg-white"><tr className="border-b border-gray-200 text-left"><th className="px-5 py-4">Tanggal</th><th className="px-5 py-4">Nomor Nasabah</th><th className="px-5 py-4">Nama</th><th className="px-5 py-4">Jenis Mutasi</th><th className="px-5 py-4">Referensi</th><th className="px-5 py-4 text-right">Nominal</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-12 text-center text-gray-500">Memuat mutasi...</td></tr> : entries.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-gray-500">Belum ada mutasi tabungan.</td></tr> : entries.map((entry) => { const credit = entry.entryType === "DEPOSIT" || entry.entryType === "ADJUSTMENT"; return <tr key={entry.id} className="border-b border-gray-100"><td className="px-5 py-4">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}</td><td className="px-5 py-4 font-medium">{entry.memberNumber}</td><td className="px-5 py-4 font-semibold">{entry.memberName}</td><td className="px-5 py-4">{LABELS[entry.entryType]}</td><td className="px-5 py-4 text-xs text-gray-500">{entry.referenceKey}</td><td className={`px-5 py-4 text-right font-bold ${credit ? "text-emerald-600" : "text-red-600"}`}>{credit ? "+" : "-"}{money(entry.amount)}</td></tr>; })}</tbody></table></div>{pages > 1 && <div className="flex justify-center gap-2 border-t border-gray-200 py-4">{visiblePages.map((number) => <button key={number} type="button" onClick={() => setPage(number)} className={`h-8 min-w-8 rounded-md text-sm ${number === page ? "bg-primary text-white" : "hover:bg-gray-100"}`}>{number}</button>)}</div>}</div>
  </div>;
}

function Summary({ title, value, icon, color }: { readonly title: string; readonly value: string; readonly icon: React.ReactNode; readonly color: string }) { return <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className={`flex items-center gap-2 text-sm font-semibold ${color}`}>{icon}{title}</div><div className="mt-2 text-2xl font-bold text-gray-900">{money(value)}</div></div>; }
