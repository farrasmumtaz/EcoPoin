"use client";

import { Building2, Mail, MapPin, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProfile, updateProfile, type Profile } from "@/app/services/profile/profile";

interface FormState { fullName: string; organizationName: string; address: string; contactPhone: string }
const empty: FormState = { fullName: "", organizationName: "", address: "", contactPhone: "" };
const roles: Record<Profile["role"], string> = { ADMIN: "Administrator", OPERATOR: "Operator", COORDINATOR: "Koordinator" };
const inputClass = "mt-2 h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

function formFrom(profile: Profile): FormState { return { fullName: profile.fullName, organizationName: profile.organization.name, address: profile.organization.address ?? "", contactPhone: profile.organization.contactPhone ?? "" }; }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void getProfile().then((result) => { setProfile(result); setForm(formFrom(result)); }).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Profil gagal dimuat.")).finally(() => setLoading(false)); }, []);
  const set = (key: keyof FormState, value: string): void => setForm((current) => ({ ...current, [key]: value }));
  const reset = (): void => { if (profile) setForm(formFrom(profile)); };
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (form.fullName.trim().length < 2) { toast.error("Nama minimal 2 karakter."); return; }
    if (profile?.role === "ADMIN" && form.organizationName.trim().length < 2) { toast.error("Nama organisasi minimal 2 karakter."); return; }
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName: form.fullName.trim(),
        ...(profile?.role === "ADMIN" ? { organizationName: form.organizationName.trim(), address: form.address.trim() || null, contactPhone: form.contactPhone.trim() || null } : {}),
      });
      setProfile(updated); setForm(formFrom(updated)); toast.success("Profil berhasil diperbarui.");
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : "Profil gagal disimpan."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Memuat profil...</div>;
  if (!profile) return <div className="p-12 text-center text-red-600">Profil tidak dapat ditampilkan.</div>;
  const admin = profile.role === "ADMIN";

  return <main className="min-h-full bg-gray-50 p-6 text-gray-900"><header><h1 className="text-2xl font-bold">Profil Pengguna</h1><p className="mt-1 text-sm text-gray-500">Kelola identitas akun dan informasi bank sampah.</p></header>
    <form onSubmit={(event) => void submit(event)} className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <section className="border-b border-gray-200 p-6"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-primary"><UserRound size={28}/></div><div><h2 className="text-lg font-bold">{profile.fullName}</h2><div className="mt-1 flex items-center gap-2 text-sm text-gray-500"><ShieldCheck size={15}/>{roles[profile.role]}</div></div></div></section>
      <section className="grid gap-5 p-6 md:grid-cols-2"><Field label="Nama Pengguna" icon={<UserRound size={17}/>}><input value={form.fullName} onChange={(event) => set("fullName", event.target.value)} maxLength={160} className={inputClass}/></Field><Field label="Email" icon={<Mail size={17}/>}><input value={profile.email} disabled className={inputClass}/></Field></section>
      <section className="border-t border-gray-200 p-6"><div className="mb-5"><h2 className="flex items-center gap-2 font-bold"><Building2 size={19}/>Informasi Organisasi</h2>{!admin && <p className="mt-1 text-sm text-gray-500">Hanya administrator yang dapat mengubah data organisasi.</p>}</div><div className="grid gap-5 md:grid-cols-2"><Field label="Nama Organisasi"><input value={form.organizationName} disabled={!admin} onChange={(event) => set("organizationName", event.target.value)} maxLength={160} className={inputClass}/></Field><Field label="Nomor Telepon" icon={<Phone size={17}/>}><input type="tel" value={form.contactPhone} disabled={!admin} onChange={(event) => set("contactPhone", event.target.value)} maxLength={32} className={inputClass}/></Field><div className="md:col-span-2"><Field label="Alamat" icon={<MapPin size={17}/>}><textarea value={form.address} disabled={!admin} onChange={(event) => set("address", event.target.value)} maxLength={500} rows={4} className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white p-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"/></Field></div></div></section>
      <footer className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4"><button type="button" onClick={reset} disabled={saving} className="cursor-pointer rounded-lg border border-gray-300 px-5 py-2.5 font-semibold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">Batal</button><button type="submit" disabled={saving} className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><Save size={17}/>{saving ? "Menyimpan..." : "Simpan"}</button></footer>
    </form></main>;
}

function Field({ label, icon, children }: { readonly label: string; readonly icon?: React.ReactNode; readonly children: React.ReactNode }) { return <label className="block text-sm font-semibold"><span className="flex items-center gap-2">{icon}{label}</span>{children}</label>; }
