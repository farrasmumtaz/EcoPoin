"use client";

import { Users, Home, Phone, Camera } from "lucide-react";
import { useState, useEffect, useMemo, useRef, FormEvent } from "react";

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
  fotoUrl: "/avatar-placeholder.jpg",
};

export default function Profile() {
  const [namaWarga, setNamaWarga] = useState(initialProfile.namaWarga);
  const [rtWarga, setRtWarga] = useState(initialProfile.rtWarga);
  const [noTelp, setNoTelp] = useState(initialProfile.noTelp);
  const [catatan, setCatatan] = useState(initialProfile.catatan);

  // Draft photo — only held in memory until the form is submitted.
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const fotoPreviewUrl = useMemo(
    () => (fotoFile ? URL.createObjectURL(fotoFile) : initialProfile.fotoUrl),
    [fotoFile],
  );

  // Build/revoke an object URL whenever a new draft photo is picked, so we
  // preview the selected file without uploading anything yet.
  useEffect(() => {
    if (!fotoFile) return;
    return () => URL.revokeObjectURL(fotoPreviewUrl);
  }, [fotoFile, fotoPreviewUrl]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFotoFile(file);
    // allow re-selecting the same file later
    e.target.value = "";
  };

  const resetForm = () => {
    setNamaWarga(initialProfile.namaWarga);
    setRtWarga(initialProfile.rtWarga);
    setNoTelp(initialProfile.noTelp);
    setCatatan(initialProfile.catatan);
    setFotoFile(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: call API to persist updated profile data.
    // fotoFile is only sent here, on submit — e.g.:
    // const formData = new FormData();
    // formData.append("namaWarga", namaWarga);
    // formData.append("rtWarga", rtWarga);
    // formData.append("noTelp", noTelp);
    // formData.append("catatan", catatan);
    // if (fotoFile) formData.append("foto", fotoFile);
    console.log({ namaWarga, rtWarga, noTelp, catatan, fotoFile });
  };

  const inputClass =
    "w-full rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font placeholder:text-font/50 outline-none focus:ring-2 focus:ring-primary transition duration-300";

  return (
    <div className="min-h-full bg-white rounded-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8 md:flex-row">
          {/* Avatar — click to pick a new profile photo (draft until Simpan) */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => fotoInputRef.current?.click()}
              className="group relative block h-60 w-60 cursor-pointer overflow-hidden rounded-full border border-gray-200"
              aria-label="Ganti foto profil"
            >
              <img
                src={fotoPreviewUrl}
                alt="Foto profil"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 text-transparent transition duration-300 group-hover:bg-black/40 group-hover:text-white">
                <Camera size={28} />
                <span className="text-sm font-semibold">Ganti Foto</span>
              </span>
            </button>
            <input
              ref={fotoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              onChange={handleFotoChange}
            />
            {fotoFile && (
              <p className="mt-2 max-w-60 truncate text-center text-xs text-font/60">
                {fotoFile.name}
              </p>
            )}
          </div>

          {/* Form fields */}
          <div className="flex-1">
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
          </div>
        </form>
    </div>
  );
}
