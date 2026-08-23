"use client";

import { Users, Recycle, ChevronDown, Camera, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, FormEvent } from "react";

// ---------- Types ----------
interface FormFieldLabelProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

interface ItemEntry {
  id: string;
  jenisSampah: string;
  berat: string;
  hargaPerKg: string;
  foto: File | null;
}

// ---------- Static options (replace with real data / API calls) ----------
const jenisSampahOptions = ["Plastik", "Kertas", "Logam", "Kaca", "Organik"];

function createEmptyItem(id: string): ItemEntry {
  return {
    id,
    jenisSampah: "",
    berat: "",
    hargaPerKg: "",
    foto: null,
  };
}

function FormFieldLabel({ icon, children }: FormFieldLabelProps) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-font">
      {icon}
      {children}
    </label>
  );
}

export default function TambahSetoran() {
  const [pilihWarga, setPilihWarga] = useState("");
  const [setoranSebagaiUnit, setSetoranSebagaiUnit] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [items, setItems] = useState<ItemEntry[]>([createEmptyItem("item-0")]);
  const nextItemId = useRef(1);
  const router = useRouter();

  const inputClass =
    "w-full rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font placeholder:text-font/50 outline-none focus:ring-2 focus:ring-primary transition duration-300";

  const selectClass =
    "w-full appearance-none rounded-md bg-placeholder/50 px-4 py-3 pr-10 text-sm text-font outline-none focus:ring-2 focus:ring-primary transition duration-300";

  const updateItem = (id: string, patch: Partial<ItemEntry>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      createEmptyItem(`item-${nextItemId.current++}`),
    ]);
  };

  const resetForm = () => {
    setPilihWarga("");
    setSetoranSebagaiUnit(false);
    setUnitName("");
    setItems([createEmptyItem("item-0")]);
    nextItemId.current = 1;
  };

  const handleDraft = () => {
    // TODO: persist as draft (e.g. status: "draft")
    console.log("draft", { pilihWarga, setoranSebagaiUnit, unitName, items });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: call API to persist setoran data
    console.log({ pilihWarga, setoranSebagaiUnit, unitName, items });
  };

  return (
    <div className="min-h-full bg-white rounded-md p-6">
      <form onSubmit={handleSubmit}>
        {/* Pilih Warga */}
        <div className="mb-6">
          <FormFieldLabel icon={<Users size={18} />}>
            Pilih Warga
          </FormFieldLabel>
          <div className="relative">
            <select
              value={pilihWarga}
              onChange={(e) => setPilihWarga(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                Pilih warga
              </option>
              <option value="asep-wahyudi">Asep Wahyudi</option>
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-font/60"
            />
          </div>
        </div>

        {/* Setoran Sebagai Unit */}
        <div className="mb-6">
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-bold text-font">
            <input
              type="checkbox"
              checked={setoranSebagaiUnit}
              onChange={(e) => setSetoranSebagaiUnit(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
            Setoran Sebagai Unit
          </label>
        </div>

        {/* Unit — only shown when "Setoran Sebagai Unit" is checked */}
        {setoranSebagaiUnit && (
          <div className="mb-6">
            <FormFieldLabel icon={<Users size={18} />}>Unit</FormFieldLabel>
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="Isi nama unit"
              className={inputClass}
            />
          </div>
        )}

        {/* Repeatable item blocks */}
        {items.map((item, index) => (
          <div key={item.id} className="mb-6">
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <FormFieldLabel icon={<Recycle size={16} />}>
                  Item
                </FormFieldLabel>
                <div className="relative">
                  <select
                    value={item.jenisSampah}
                    onChange={(e) =>
                      updateItem(item.id, { jenisSampah: e.target.value })
                    }
                    className={selectClass}
                  >
                    <option value="" disabled>
                      Pilih item
                    </option>
                    {jenisSampahOptions.map((jenis) => (
                      <option key={jenis} value={jenis}>
                        {jenis}
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
                <FormFieldLabel>Berat</FormFieldLabel>
                <input
                  type="number"
                  value={item.berat}
                  onChange={(e) =>
                    updateItem(item.id, { berat: e.target.value })
                  }
                  placeholder="Isi berat setiap item dalam kilogram"
                  className={inputClass}
                />
              </div>

              <div>
                <FormFieldLabel>Harga/Kg</FormFieldLabel>
                <input
                  type="text"
                  value={item.hargaPerKg}
                  readOnly
                  disabled
                  className={`${inputClass} cursor-not-allowed opacity-80`}
                />
              </div>
            </div>

            {/* Foto Bukti upload */}
            <label
              htmlFor={`foto-bukti-${item.id}`}
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md bg-placeholder/50 py-10 text-font/70 transition hover:bg-placeholder/70 duration-300"
            >
              <Camera size={40} strokeWidth={1.5} />
              <span className="text-sm font-bold text-font/80">
                {item.foto ? item.foto.name : "Foto Bukti"}
              </span>
              <input
                id={`foto-bukti-${item.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  updateItem(item.id, {
                    foto: e.target.files?.[0] ?? null,
                  })
                }
              />
            </label>
          </div>
        ))}

        {/* Tambah Item */}
        <button
          type="button"
          onClick={addItem}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-primary transition hover:opacity-75 cursor-pointer duration-300"
        >
          <Plus size={18} className="rounded-full bg-font text-white" />
          Tambah Item
        </button>

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
            type="button"
            onClick={handleDraft}
            className="rounded-md bg-warning px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300"
          >
            Draft
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
