"use client";

import { Users, Home, Phone } from "lucide-react";
import { useState, FormEvent } from "react";

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

// ---------- Static data (replace with real data / API calls) ----------
const initialProfile = {
  namaWarga: "Hj. Kimi",
  rtWarga: "RT 2",
  noTelp: "081231231331231",
  catatan: "",
};

export default function Profile() {
  const [namaWarga, setNamaWarga] = useState(initialProfile.namaWarga);
  const [rtWarga, setRtWarga] = useState(initialProfile.rtWarga);
  const [noTelp, setNoTelp] = useState(initialProfile.noTelp);
  const [catatan, setCatatan] = useState(initialProfile.catatan);

  const resetForm = () => {
    setNamaWarga(initialProfile.namaWarga);
    setRtWarga(initialProfile.rtWarga);
    setNoTelp(initialProfile.noTelp);
    setCatatan(initialProfile.catatan);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: call API to persist updated profile data.
    console.log({ namaWarga, rtWarga, noTelp, catatan });
  };

  const inputClass =
    "w-full rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font placeholder:text-font/50 outline-none focus:ring-2 focus:ring-primary transition duration-300";

  return (
    <div className="min-h-full bg-white rounded-md p-6">
      <form onSubmit={handleSubmit}>
          {/* Nama Warga */}
          <div className="mb-6">
            <FormFieldLabel icon={<Users size={18} />}>
              Nama Warga
            </FormFieldLabel>
            <input
              type="text"
              value={namaWarga}
              onChange={(e) => setNamaWarga(e.target.value)}
              placeholder="Isi nama warga"
              className={inputClass}
            />
          </div>

          {/* RT Warga / Nomor Telepon Warga */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <FormFieldLabel icon={<Home size={16} />}>
                RT Warga
              </FormFieldLabel>
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
          </div>

          {/* Catatan */}
          <div className="mb-6">
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
