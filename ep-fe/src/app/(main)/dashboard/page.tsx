"use client";

import { Banknote, Recycle, Receipt, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getDashboard, type DashboardData } from "@/app/services/dashboard/dashboard";

const money = (value: string): string => `Rp${Number(value).toLocaleString("id-ID")}`;
const kilos = (value: string): string => `${Number(value).toLocaleString("id-ID", { maximumFractionDigits: 3 })} kg`;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { let active = true; void getDashboard().then((result) => { if (active) setData(result); }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Dashboard gagal dimuat.")); return () => { active = false; }; }, []);
  if (!data) return <div className="p-8 text-sm text-gray-500">Memuat dashboard...</div>;
  const cards = [
    { label: "Total Berat", value: kilos(data.metrics.totalWeightKg), icon: <Recycle size={19} />, color: "text-emerald-700" },
    { label: "Nilai Setoran", value: money(data.metrics.totalAmount), icon: <Banknote size={19} />, color: "text-blue-700" },
    { label: "Transaksi Selesai", value: data.metrics.transactionCount.toLocaleString("id-ID"), icon: <Receipt size={19} />, color: "text-violet-700" },
    { label: "Nasabah Aktif", value: data.metrics.activeMemberCount.toLocaleString("id-ID"), icon: <Users size={19} />, color: "text-amber-700" },
  ];
  return <div className="min-h-full bg-gray-50 p-6">
    <div><h1 className="text-2xl font-bold text-gray-900">Dashboard EcoPoin</h1><p className="mt-1 text-sm text-gray-500">Ringkasan operasional berdasarkan transaksi yang tersimpan.</p></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className={`flex items-center gap-2 text-sm font-semibold ${card.color}`}>{card.icon}{card.label}</div><div className="mt-3 text-2xl font-bold text-gray-900">{card.value}</div></div>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-3"><section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-gray-900"><Wallet size={18} /> Metode Pencairan</h2><div className="mt-5 space-y-4"><Value label="Masuk tabungan" value={money(data.metrics.savingsAmount)} /><Value label="Tunai langsung" value={money(data.metrics.cashAmount)} /></div></section>
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2"><h2 className="border-b border-gray-200 px-6 py-4 font-bold text-gray-900">Komposisi Sampah</h2><div className="overflow-x-auto"><table className="w-full text-sm text-gray-800"><thead className="bg-gray-50"><tr className="border-b border-gray-200 text-left text-gray-600"><th className="px-6 py-3">Jenis</th><th className="px-6 py-3 text-right">Berat</th><th className="px-6 py-3 text-right">Nilai</th></tr></thead><tbody>{data.wasteComposition.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-gray-500">Belum ada transaksi selesai.</td></tr> : data.wasteComposition.map((row) => <tr key={row.name} className="border-b border-gray-100 transition-colors hover:bg-emerald-50/50"><td className="px-6 py-3 font-semibold text-gray-900">{row.name}</td><td className="px-6 py-3 text-right font-medium text-gray-700">{kilos(row.weightKg)}</td><td className="px-6 py-3 text-right font-semibold text-gray-900">{money(row.amount)}</td></tr>)}</tbody></table></div></section></div>
    <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm"><h2 className="border-b border-gray-200 px-6 py-4 font-bold text-gray-900">Transaksi Terbaru</h2><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm text-gray-800"><thead className="bg-gray-50"><tr className="border-b border-gray-200 text-left text-gray-600"><th className="px-6 py-3">Tanggal</th><th className="px-6 py-3">Nasabah/Unit</th><th className="px-6 py-3 text-right">Berat</th><th className="px-6 py-3 text-right">Nilai</th><th className="px-6 py-3 text-right">Pencairan</th></tr></thead><tbody>{data.recentTransactions.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada transaksi.</td></tr> : data.recentTransactions.map((transaction) => <tr key={transaction.id} className="border-b border-gray-100 transition-colors hover:bg-emerald-50/50"><td className="px-6 py-3 text-gray-700">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(transaction.createdAt))}</td><td className="px-6 py-3 font-semibold text-gray-900">{transaction.memberName}</td><td className="px-6 py-3 text-right font-medium text-gray-700">{kilos(transaction.totalWeightKg)}</td><td className="px-6 py-3 text-right font-semibold text-gray-900">{money(transaction.totalAmount)}</td><td className="px-6 py-3 text-right text-gray-700">{transaction.payoutMethod === "SAVINGS" ? "Tabungan" : transaction.payoutMethod === "DIRECT_CASH" ? "Tunai" : "Belum dipilih"}</td></tr>)}</tbody></table></div></section>
  </div>;
}

function Value({ label, value }: { readonly label: string; readonly value: string }) { return <div className="rounded-lg bg-gray-50 p-4"><div className="text-sm text-gray-500">{label}</div><div className="mt-1 text-xl font-bold text-gray-900">{value}</div></div>; }
