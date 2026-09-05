"use client";

import { Calendar, Home, Recycle, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";

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

// ---------- Static options (replace with real data / API calls) ----------
const rtWargaOptions = ["RT 1", "RT 2", "RT 3", "RT 4", "RT 5"];
const jenisSampahOptions = ["Plastik", "Kertas", "Logam", "Kaca", "Organik"];
const jenisTransaksiOptions = ["Kredit Setoran", "Debit Penarikan"];

export default function Laporan() {
  const [periode, setPeriode] = useState("");
  const [rtWarga, setRtWarga] = useState("");
  const [jenisSampah, setJenisSampah] = useState("");
  const [jenisTransaksi, setJenisTransaksi] = useState("");

  const inputClass =
    "w-full rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font placeholder:text-font/50 outline-none focus:ring-2 focus:ring-primary transition duration-300";

  const selectClass =
    "w-full appearance-none rounded-md bg-placeholder/50 px-4 py-3 pr-10 text-sm text-font outline-none focus:ring-2 focus:ring-primary transition duration-300";

  const handleCetakPdf = () => {
    // TODO: call API / generate PDF export using the selected filters
    console.log("cetak pdf", { periode, rtWarga, jenisSampah, jenisTransaksi });
  };

  const handleCetakCsv = () => {
    // TODO: call API / generate CSV export using the selected filters
    console.log("cetak csv", { periode, rtWarga, jenisSampah, jenisTransaksi });
  };

  return (
    <div className="min-h-full bg-white rounded-md p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Periode */}
        <div>
          <FormFieldLabel icon={<Calendar size={18} />}>Periode</FormFieldLabel>
          <input
            type="date"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            placeholder="Pilih periode"
            className={inputClass}
          />
        </div>

        {/* RT Warga */}
        <div>
          <FormFieldLabel icon={<Home size={18} />}>RT Warga</FormFieldLabel>
          <div className="relative">
            <select
              value={rtWarga}
              onChange={(e) => setRtWarga(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                Pilih RT warga
              </option>
              {rtWargaOptions.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-font/60"
            />
          </div>
        </div>

        {/* Jenis Sampah */}
        <div>
          <FormFieldLabel icon={<Recycle size={18} />}>
            Jenis Sampah
          </FormFieldLabel>
          <div className="relative">
            <select
              value={jenisSampah}
              onChange={(e) => setJenisSampah(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                Pilih jenis sampah
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

        {/* Jenis Transaksi */}
        <div>
          <FormFieldLabel icon={<Clock size={18} />}>
            Jenis Transaksi
          </FormFieldLabel>
          <div className="relative">
            <select
              value={jenisTransaksi}
              onChange={(e) => setJenisTransaksi(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>
                Pilih jenis transaksi
              </option>
              {jenisTransaksiOptions.map((jenis) => (
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

        {/* Print actions — aligned under RT Warga column, same row as Jenis Transaksi */}
        <div className="flex items-end gap-4">
          <button
            type="button"
            onClick={handleCetakPdf}
            className="rounded-md bg-danger px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300"
          >
            Cetak PDF
          </button>
          <button
            type="button"
            onClick={handleCetakCsv}
            className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 cursor-pointer duration-300"
          >
            Cetak CSV
          </button>
        </div>
      </div>
    </div>
  );
}