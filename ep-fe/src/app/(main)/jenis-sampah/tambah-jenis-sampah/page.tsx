"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

interface FormFieldLabelProps {
  children: React.ReactNode;
}

function FormFieldLabel({ children }: FormFieldLabelProps) {
  return (
    <label className="mb-2 block text-sm font-bold text-font">{children}</label>
  );
}

// ---------- Static options (replace with real data / API calls) ----------
const kategoriOptions = ["Organik", "Anorganik", "B3"];

export default function TambahJenisSampah() {
  const [namaJenisSampah, setNamaJenisSampah] = useState("");
  const [kategori, setKategori] = useState("");
  const [satuanUnit, setSatuanUnit] = useState("");
  const [hargaPerKg, setHargaPerKg] = useState("");
  const router = useRouter();

  const resetForm = () => {
    setNamaJenisSampah("");
    setKategori("");
    setSatuanUnit("");
    setHargaPerKg("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: call API to persist jenis sampah data
    console.log({ namaJenisSampah, kategori, satuanUnit, hargaPerKg });
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
                onChange={(e) => setKategori(e.target.value)}
                className={selectClass}
              >
                <option value="" disabled>
                  Pilih kategori
                </option>
                {kategoriOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
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
            className="rounded-md bg-placeholder px-8 py-3 font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300 "
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-md bg-danger px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300"
          >
            Ulang
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
