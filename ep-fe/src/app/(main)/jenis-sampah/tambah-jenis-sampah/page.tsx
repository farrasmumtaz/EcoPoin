"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import toast from "react-hot-toast";

import { addWasteType } from "@/app/services/waste-types/waste-types"; // adjust to your actual path

interface FormFieldLabelProps {
  children: React.ReactNode;
}

function FormFieldLabel({ children }: FormFieldLabelProps) {
  return (
    <label className="mb-2 block text-sm font-bold text-font">{children}</label>
  );
}

// ---------- Category options ----------
// Mapped to the WasteCategory values wasteTypes.ts actually sends.
// NOTE: "B3" was in the original mock options but has no confirmed backend
// value yet — removed rather than risk a rejected request. Add it back
// (and to WasteCategory in wasteTypes.ts) once confirmed.
const kategoriOptions: { label: string; value: "ORGANIC" | "INORGANIC" }[] = [
  { label: "Organik", value: "ORGANIC" },
  { label: "Anorganik", value: "INORGANIC" },
];

export default function TambahJenisSampah() {
  const [namaJenisSampah, setNamaJenisSampah] = useState("");
  const [kategori, setKategori] = useState<"ORGANIC" | "INORGANIC" | "">("");
  const [satuanUnit, setSatuanUnit] = useState("");
  const [hargaPerKg, setHargaPerKg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const resetForm = () => {
    setNamaJenisSampah("");
    setKategori("");
    setSatuanUnit("");
    setHargaPerKg("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!namaJenisSampah.trim() || !kategori || !satuanUnit.trim() || !hargaPerKg) {
      toast.error("Semua kolom wajib diisi.");
      return;
    }

    const pointsPerKgNumber = Number(hargaPerKg);
    if (Number.isNaN(pointsPerKgNumber)) {
      toast.error("Harga/Kg harus berupa angka.");
      return;
    }

    try {
      setIsSubmitting(true);

      const wasteType = await addWasteType({
        name: namaJenisSampah.trim(),
        category: kategori,
        unit: satuanUnit.trim(),
        pointsPerKg: pointsPerKgNumber,
      });

      toast.success(`Jenis sampah "${wasteType.name}" berhasil ditambahkan.`);
      router.push("/jenis-sampah");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan, silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font placeholder:text-font/50 outline-none focus:ring-2 focus:ring-primary transition duration-300";

  const selectClass =
    "w-full appearance-none rounded-md bg-placeholder/50 px-4 py-3 pr-10 text-sm text-font outline-none focus:ring-2 focus:ring-primary transition duration-300";

  return (
    <div className="min-h-full bg-white rounded-md p-6">
      <form onSubmit={handleSubmit}>
        {/* Nama Jenis Sampah */}
        <div className="mb-6">
          <FormFieldLabel>Nama Jenis Sampah</FormFieldLabel>
          <input
            type="text"
            value={namaJenisSampah}
            onChange={(e) => setNamaJenisSampah(e.target.value)}
            placeholder="Isi nama jenis sampah"
            className={inputClass}
          />
        </div>

        {/* Kategori / Satuan Unit / Harga per Kg */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <FormFieldLabel>Kategori</FormFieldLabel>
            <div className="relative">
              <select
                value={kategori}
                onChange={(e) =>
                  setKategori(e.target.value as "ORGANIC" | "INORGANIC" | "")
                }
                className={selectClass}
              >
                <option value="" disabled>
                  Pilih kategori
                </option>
                {kategoriOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-font/60"
              />
            </div>
          </div>

          <div>
            <FormFieldLabel>Satuan Unit</FormFieldLabel>
            <input
              type="text"
              value={satuanUnit}
              onChange={(e) => setSatuanUnit(e.target.value)}
              placeholder="Isi satuan unit"
              className={inputClass}
            />
          </div>

          <div>
            <FormFieldLabel>Harga/Kg (Rp)</FormFieldLabel>
            <input
              type="number"
              value={hargaPerKg}
              onChange={(e) => setHargaPerKg(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="rounded-md bg-placeholder px-8 py-3 font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="rounded-md bg-danger px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ulang
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}