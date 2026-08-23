"use client";

import { Users, Home, Phone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, FormEvent, Suspense } from "react";

interface FormFieldLabelProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function FormFieldLabel({ icon, children }: FormFieldLabelProps) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-font">
      {icon}
      {children}
    </label>
  );
}

function EditWargaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Snapshot of the data passed in via query params from the Data Warga
  // table. "Ulang" restores the form to this snapshot instead of clearing it.
  const originalData = useMemo(
    () => ({
      namaWarga: searchParams.get("nama") ?? "",
      rtWarga: searchParams.get("rt") ?? "",
      noTelp: searchParams.get("noTelp") ?? "",
      nomorNasabah: searchParams.get("nomorNasabah") ?? "",
      catatan: searchParams.get("catatan") ?? "",
    }),
    [searchParams],
  );

  const [namaWarga, setNamaWarga] = useState(originalData.namaWarga);
  const [rtWarga, setRtWarga] = useState(originalData.rtWarga);
  const [noTelp, setNoTelp] = useState(originalData.noTelp);
  const [nomorNasabah] = useState(originalData.nomorNasabah); // not editable
  const [catatan, setCatatan] = useState(originalData.catatan);

  const resetForm = () => {
    setNamaWarga(originalData.namaWarga);
    setRtWarga(originalData.rtWarga);
    setNoTelp(originalData.noTelp);
    setCatatan(originalData.catatan);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: call API to persist updated warga data
    console.log({ namaWarga, rtWarga, noTelp, nomorNasabah, catatan });
  };

  const inputClass =
    "w-full rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font placeholder:text-font/50 outline-none focus:ring-2 focus:ring-primary transition duration-300";

  return (
    <div className="min-h-full bg-white rounded-md p-6">
      <form onSubmit={handleSubmit}>
        {/* Nama Warga */}
        <div className="mb-6">
          <FormFieldLabel icon={<Users size={18} />}>Nama Warga</FormFieldLabel>
          <input
            type="text"
            value={namaWarga}
            onChange={(e) => setNamaWarga(e.target.value)}
            placeholder="Isi nama warga"
            className={inputClass}
          />
        </div>

        {/* RT Warga / Nomor Telepon Warga / Nomor Nasabah */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <FormFieldLabel icon={<Home size={16} />}>RT Warga</FormFieldLabel>
            <input
              type="text"
              value={rtWarga}
              onChange={(e) => setRtWarga(e.target.value)}
              placeholder="Isi RT warga"
              className={inputClass}
            />
          </div>

          <div>
            <FormFieldLabel icon={<Phone size={16} />}>
              Nomor Telepon Warga
            </FormFieldLabel>
            <input
              type="tel"
              value={noTelp}
              onChange={(e) => setNoTelp(e.target.value)}
              placeholder="Isi nomor telepon warga"
              className={inputClass}
            />
          </div>

          <div>
            <FormFieldLabel>Nomor Nasabah</FormFieldLabel>
            <input
              type="text"
              value={nomorNasabah}
              readOnly
              disabled
              className={`${inputClass} cursor-not-allowed opacity-80`}
            />
          </div>
        </div>

        {/* Catatan Opsional */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold text-font">
            Catatan Opsional
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={8}
            className="w-full resize-none rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font outline-none focus:ring-2 focus:ring-primary transition duration-300"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md bg-placeholder px-8 py-3 font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300"
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

// useSearchParams() opts the tree into client-side rendering unless wrapped
// in Suspense, so the actual page default-exports a Suspense boundary
// around the form rather than using useSearchParams directly here.
export default function EditWarga() {
  return (
    <Suspense fallback={null}>
      <EditWargaForm />
    </Suspense>
  );
}