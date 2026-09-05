"use client";

import { ArrowLeft, ChevronDown, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { getWasteTypeById, updateWasteType, type WasteCategory } from "@/app/services/waste-types/waste-types";

const categories: readonly { readonly value: WasteCategory; readonly label: string }[] = [
  { value: "PLASTIC", label: "Plastik" },
  { value: "PAPER", label: "Kertas" },
  { value: "METAL", label: "Logam" },
  { value: "GLASS", label: "Kaca" },
  { value: "OTHER", label: "Lain-lain" },
];

function EditForm() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WasteCategory>("PLASTIC");
  const [unit, setUnit] = useState("kg");
  const [sortedPrice, setSortedPrice] = useState("");
  const [unsortedPrice, setUnsortedPrice] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      toast.error("ID jenis sampah tidak valid.");
      return;
    }
    void getWasteTypeById(id)
      .then((wasteType) => {
        setName(wasteType.name);
        setCategory(wasteType.category);
        setUnit(wasteType.unit);
        setSortedPrice(wasteType.prices.sorted);
        setUnsortedPrice(wasteType.prices.unsorted);
      })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Data gagal dimuat."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!id || !name.trim() || !unit.trim() || Number(sortedPrice) < 0 || Number(unsortedPrice) < 0) {
      toast.error("Lengkapi data dan pastikan harga tidak bernilai negatif.");
      return;
    }
    setIsSaving(true);
    try {
      await updateWasteType(id, {
        name: name.trim(),
        category,
        unit: unit.trim(),
        sortedPricePerKg: Number(sortedPrice),
        unsortedPricePerKg: Number(unsortedPrice),
      });
      toast.success("Jenis sampah berhasil diperbarui.");
      router.push("/jenis-sampah");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Data gagal diperbarui.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-gray-100";
  const labelClass = "mb-2 block text-sm font-semibold text-gray-800";

  if (isLoading) {
    return <div className="p-8 text-sm font-medium text-gray-500">Memuat data jenis sampah...</div>;
  }

  return (
    <div className="min-h-full bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <button type="button" onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-primary cursor-pointer">
            <ArrowLeft size={18} /> Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Jenis Sampah</h1>
          <p className="mt-1 text-sm text-gray-500">Perbarui kategori, satuan, dan harga beli berdasarkan kondisi pemilahan.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <label className={labelClass}>Nama Jenis Sampah</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Contoh: Botol Plastik PET" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Kategori</label>
            <div className="relative">
              <select value={category} onChange={(event) => setCategory(event.target.value as WasteCategory)} className={`${inputClass} appearance-none pr-10`}>
                {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
            <div><label className={labelClass}>Satuan</label><input value={unit} onChange={(event) => setUnit(event.target.value)} className={inputClass} placeholder="kg" /></div>
          </div>

          <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="mb-1 font-bold text-gray-900">Harga beli per kilogram</h2>
            <p className="mb-5 text-sm text-gray-500">Isi 0 apabila jenis sampah belum memiliki harga pada kondisi tersebut.</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div><label className={labelClass}>Sudah Dipilah</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Rp</span><input type="number" min="0" step="1" value={sortedPrice} onChange={(event) => setSortedPrice(event.target.value)} className={`${inputClass} pl-11 pr-14`} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">/kg</span></div></div>
              <div><label className={labelClass}>Belum Dipilah</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Rp</span><input type="number" min="0" step="1" value={unsortedPrice} onChange={(event) => setUnsortedPrice(event.target.value)} className={`${inputClass} pl-11 pr-14`} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">/kg</span></div></div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => router.back()} className="h-11 rounded-lg border border-gray-300 bg-white px-6 font-semibold text-gray-700 transition hover:bg-gray-50 cursor-pointer">Batal</button>
            <button type="submit" disabled={isSaving} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-white transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"><Save size={18} />{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditJenisSampah() {
  return <Suspense fallback={<div className="p-8 text-sm text-gray-500">Memuat halaman...</div>}><EditForm /></Suspense>;
}
