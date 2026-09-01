"use client";

import { ChevronDown } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    void getWasteTypeById(id)
      .then((wasteType) => {
        setName(wasteType.name);
        setCategory(wasteType.category);
        setUnit(wasteType.unit);
        setSortedPrice(wasteType.prices.sorted);
        setUnsortedPrice(wasteType.prices.unsorted);
      })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Data gagal dimuat."));
  }, [id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!id || !name.trim() || Number(sortedPrice) <= 0 || Number(unsortedPrice) <= 0) {
      toast.error("Lengkapi data dan pastikan kedua harga lebih dari nol.");
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

  const inputClass = "w-full rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font outline-none focus:ring-2 focus:ring-primary";
  return (
    <div className="min-h-full rounded-md bg-white p-6">
      <form onSubmit={handleSubmit}>
        <label className="mb-2 block text-sm font-bold">Nama Jenis Sampah</label>
        <input value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} mb-6`} />
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-bold">Kategori</label>
            <div className="relative">
              <select value={category} onChange={(event) => setCategory(event.target.value as WasteCategory)} className={`${inputClass} appearance-none pr-10`}>
                {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div><label className="mb-2 block text-sm font-bold">Satuan</label><input value={unit} onChange={(event) => setUnit(event.target.value)} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-bold">Harga Dipilah/Kg</label><input type="number" min="1" value={sortedPrice} onChange={(event) => setSortedPrice(event.target.value)} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-bold">Harga Belum Dipilah/Kg</label><input type="number" min="1" value={unsortedPrice} onChange={(event) => setUnsortedPrice(event.target.value)} className={inputClass} /></div>
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={() => router.back()} className="rounded-md bg-placeholder px-8 py-3 font-semibold text-white">Kembali</button>
          <button type="submit" disabled={isSaving} className="rounded-md bg-primary px-8 py-3 font-semibold text-white disabled:opacity-50">{isSaving ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </form>
    </div>
  );
}

export default function EditJenisSampah() {
  return <Suspense fallback={null}><EditForm /></Suspense>;
}
