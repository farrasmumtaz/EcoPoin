"use client";

import { ArrowLeft, Home, Phone, Save, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { getMemberById, updateMember } from "@/app/services/members/members";

function EditWargaForm() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const [fullName, setFullName] = useState("");
  const [rt, setRt] = useState("");
  const [phone, setPhone] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) { toast.error("ID warga tidak valid."); return; }
    let active = true;
    void getMemberById(id).then((member) => {
      if (!active) return;
      setFullName(member.fullName);
      setRt(member.rt ?? "");
      setPhone(member.phone ?? "");
      setMemberNumber(member.memberNumber);
    }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Data warga gagal dimuat."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!id || fullName.trim().length < 2) { toast.error("Nama warga minimal 2 karakter."); return; }
    setSaving(true);
    try {
      await updateMember(id, { fullName: fullName.trim(), rt: rt.trim() || null, phone: phone.trim() || null });
      toast.success("Data warga berhasil diperbarui.");
      router.push("/data-warga");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Data warga gagal diperbarui.");
    } finally { setSaving(false); }
  };

  const inputClass = "h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-gray-100";
  if (loading) return <div className="p-8 text-sm text-gray-500">Memuat data warga...</div>;

  return <div className="min-h-full bg-gray-50 p-6 md:p-8"><div className="mx-auto max-w-4xl">
    <button type="button" onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary cursor-pointer"><ArrowLeft size={18} /> Kembali</button>
    <h1 className="text-2xl font-bold text-gray-900">Edit Data Warga</h1><p className="mt-1 text-sm text-gray-500">Perbarui identitas dan kontak warga tanpa mengubah nomor nasabah.</p>
    <form onSubmit={submit} className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"><Users size={17} /> Nama Warga</label><input value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
      <div className="mt-5 grid gap-5 md:grid-cols-3"><div><label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"><Home size={17} /> RT</label><input value={rt} onChange={(event) => setRt(event.target.value)} className={inputClass} placeholder="Contoh: RT 02" /></div><div><label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"><Phone size={17} /> Nomor telepon</label><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} /></div><div><label className="mb-2 block text-sm font-semibold text-gray-800">Nomor nasabah</label><input value={memberNumber} disabled className={inputClass} /></div></div>
      <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6"><button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700">Batal</button><button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white disabled:opacity-50"><Save size={17} />{saving ? "Menyimpan..." : "Simpan Perubahan"}</button></div>
    </form>
  </div></div>;
}

export default function EditWarga() { return <Suspense fallback={<div className="p-8 text-sm text-gray-500">Memuat halaman...</div>}><EditWargaForm /></Suspense>; }
