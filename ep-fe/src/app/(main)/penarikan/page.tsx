"use client";

import { Check, Search, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMembers, type Member } from "@/app/services/members/members";
import { approveWithdrawal, createWithdrawal, getWithdrawals, payWithdrawal, rejectWithdrawal, type Withdrawal, type WithdrawalStatus } from "@/app/services/withdrawals/withdrawals";

type DialogAction = "APPROVE" | "REJECT" | "PAY";
interface DialogState { readonly action: DialogAction; readonly withdrawal: Withdrawal }
const LABELS: Record<WithdrawalStatus, string> = { REQUESTED: "Menunggu", APPROVED: "Disetujui", PAID: "Dibayar", REJECTED: "Ditolak" };
const STATUS_CLASS: Record<WithdrawalStatus, string> = { REQUESTED: "bg-amber-50 text-amber-700", APPROVED: "bg-blue-50 text-blue-700", PAID: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700" };
const money = (value: string): string => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
const control = "h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function PenarikanPage() {
  const [items, setItems] = useState<readonly Withdrawal[]>([]);
  const [members, setMembers] = useState<readonly Member[]>([]);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState<WithdrawalStatus | "">("");
  const [memberId, setMemberId] = useState(""); const [amount, setAmount] = useState(""); const [notes, setNotes] = useState("");
  const [refresh, setRefresh] = useState(0); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogState | null>(null); const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([getWithdrawals({ search: search || undefined, status: status || undefined, limit: 100 }), getMembers({ limit: 100 })])
      .then(([withdrawals, memberResult]) => { if (active) { setItems(withdrawals.items); setMembers(memberResult.items.filter((member) => member.isActive)); } })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Data penarikan gagal dimuat."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, search, status]);

  const run = async (action: () => Promise<Withdrawal>, success: string): Promise<boolean> => {
    setBusy(true);
    try { await action(); toast.success(success); setRefresh((value) => value + 1); return true; }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Proses gagal."); return false; }
    finally { setBusy(false); }
  };
  const submit = async (): Promise<void> => {
    if (!memberId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) { toast.error("Pilih nasabah dan isi nominal yang valid."); return; }
    if (await run(() => createWithdrawal({ memberId, amount: Number(amount), notes: notes.trim() || undefined }), "Permintaan penarikan dibuat.")) { setMemberId(""); setAmount(""); setNotes(""); }
  };
  const executeDialog = async (): Promise<void> => {
    if (!dialog) return;
    if (dialog.action === "REJECT" && rejectionReason.trim().length < 3) { toast.error("Alasan penolakan minimal 3 karakter."); return; }
    const successful = dialog.action === "APPROVE"
      ? await run(() => approveWithdrawal(dialog.withdrawal.id), "Penarikan disetujui.")
      : dialog.action === "PAY"
        ? await run(() => payWithdrawal(dialog.withdrawal.id), "Penarikan dibayar dan saldo berhasil didebit.")
        : await run(() => rejectWithdrawal(dialog.withdrawal.id, rejectionReason.trim()), "Penarikan ditolak.");
    if (successful) { setDialog(null); setRejectionReason(""); }
  };
  const openDialog = (action: DialogAction, withdrawal: Withdrawal): void => { setRejectionReason(""); setDialog({ action, withdrawal }); };

  return <main className="min-h-full bg-gray-50 p-6 text-gray-900"><header><h1 className="text-2xl font-bold">Penarikan Tabungan</h1><p className="mt-1 text-sm text-gray-500">Kelola permintaan, persetujuan, dan pembayaran penarikan.</p></header>
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-bold"><WalletCards size={19}/>Buat Permintaan</h2><div className="mt-4 grid gap-3 md:grid-cols-4"><select value={memberId} onChange={(event) => setMemberId(event.target.value)} className={control}><option value="">Pilih nasabah/unit</option>{members.map((member) => <option key={member.id} value={member.id}>{member.memberNumber} - {member.fullName}</option>)}</select><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Rp</span><input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Nominal" className={`${control} w-full pl-10`}/></div><input value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} placeholder="Catatan opsional" className={control}/><button type="button" disabled={busy} onClick={() => void submit()} className="h-11 cursor-pointer rounded-lg bg-primary px-5 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">Buat Permintaan</button></div></section>
    <div className="mt-5 flex gap-3"><div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau nomor nasabah" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"/></div><select value={status} onChange={(event) => setStatus(event.target.value as WithdrawalStatus | "")} className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-sm"><option value="">Semua status</option>{Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <section className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="overflow-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-gray-50 text-gray-700"><tr><th className="px-5 py-4 text-left">Tanggal</th><th className="px-5 py-4 text-left">Nasabah</th><th className="px-5 py-4 text-right">Nominal</th><th className="px-5 py-4 text-center">Status</th><th className="px-5 py-4 text-right">Aksi</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="p-10 text-center text-gray-500">Memuat penarikan...</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-gray-500">Belum ada permintaan penarikan.</td></tr> : items.map((item) => <tr key={item.id} className="border-t border-gray-100"><td className="px-5 py-4">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.createdAt))}</td><td className="px-5 py-4"><strong className="block">{item.memberName}</strong><span className="text-xs text-gray-500">{item.memberNumber}</span></td><td className="px-5 py-4 text-right font-bold">{money(item.amount)}</td><td className="px-5 py-4 text-center"><span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASS[item.status]}`}>{LABELS[item.status]}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{item.status === "REQUESTED" && <><button disabled={busy} type="button" onClick={() => openDialog("APPROVE", item)} title="Setujui penarikan" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-primary text-primary transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"><Check size={16}/></button><button disabled={busy} type="button" onClick={() => openDialog("REJECT", item)} title="Tolak penarikan" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-danger text-danger transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"><X size={16}/></button></>}{item.status === "APPROVED" && <button disabled={busy} type="button" onClick={() => openDialog("PAY", item)} className="cursor-pointer rounded-md bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">Bayar</button>}</div></td></tr>)}</tbody></table></div></section>
    {dialog && <ActionDialog state={dialog} reason={rejectionReason} busy={busy} onReasonChange={setRejectionReason} onClose={() => !busy && setDialog(null)} onConfirm={() => void executeDialog()}/>} </main>;
}

function ActionDialog({ state, reason, busy, onReasonChange, onClose, onConfirm }: { readonly state: DialogState; readonly reason: string; readonly busy: boolean; readonly onReasonChange: (value: string) => void; readonly onClose: () => void; readonly onConfirm: () => void }) {
  const content = state.action === "APPROVE" ? { title: "Setujui Penarikan", message: "Permintaan akan masuk tahap menunggu pembayaran.", button: "Setujui", style: "bg-primary hover:bg-primary/90" } : state.action === "PAY" ? { title: "Konfirmasi Pembayaran", message: "Pastikan uang sudah diserahkan. Saldo nasabah akan langsung didebit.", button: "Konfirmasi Bayar", style: "bg-primary hover:bg-primary/90" } : { title: "Tolak Penarikan", message: "Berikan alasan yang jelas agar keputusan dapat diaudit.", button: "Tolak Penarikan", style: "bg-danger hover:bg-red-700" };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="withdrawal-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="withdrawal-dialog-title" className="text-xl font-bold">{content.title}</h2><p className="mt-2 text-sm leading-6 text-gray-500">{content.message}</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Tutup modal" className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed"><X size={20}/></button></div><div className="mt-5 rounded-xl bg-gray-50 p-4"><div className="text-sm text-gray-500">Nasabah</div><div className="font-bold">{state.withdrawal.memberName}</div><div className="mt-3 text-sm text-gray-500">Nominal</div><div className="text-xl font-bold">{money(state.withdrawal.amount)}</div></div>{state.action === "REJECT" && <label className="mt-5 block text-sm font-semibold">Alasan penolakan<textarea autoFocus value={reason} onChange={(event) => onReasonChange(event.target.value)} maxLength={500} rows={4} placeholder="Minimal 3 karakter" className="mt-2 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-danger focus:ring-2 focus:ring-red-100"/></label>}<div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">Batal</button><button type="button" disabled={busy} onClick={onConfirm} className={`cursor-pointer rounded-lg px-4 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${content.style}`}>{busy ? "Memproses..." : content.button}</button></div></section></div>;
}
