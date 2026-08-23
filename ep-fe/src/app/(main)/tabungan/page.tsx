"use client";

import { Search } from "lucide-react";
import { useState } from "react";

// ---------- Types ----------
interface Transaksi {
  nomorNasabah: string;
  jenisTransaksi: string;
  nominal: number;
  sumberTransaksi: string;
  tanggal: string;
}

// ---------- Static data (replace with real data / API calls) ----------
const PAGE_SIZE = 9;
const totalPages = 10;

const transaksiData: Transaksi[] = Array.from(
  { length: PAGE_SIZE * totalPages },
  () => ({
    nomorNasabah: "123132131321",
    jenisTransaksi: "Kredit Setoran",
    nominal: 2000,
    sumberTransaksi: "BCA",
    tanggal: "11/20/2025",
  }),
);

const visiblePages = [1, 2, 3, 4, 5, 6, 7];

export default function Tabungan() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pagedTransaksi = transaksiData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-6">
      {/* Search */}
      <div className="relative shrink-0">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari Transaksi"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-font placeholder:text-gray-400 outline-none focus:border-primary transition duration-300"
        />
      </div>

      {/* Table */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200 text-font">
                <th className="px-6 py-4 font-bold">Nomor Nasabah</th>
                <th className="px-6 py-4 font-bold">Jenis Transaksi</th>
                <th className="px-6 py-4 text-center font-bold">Nominal</th>
                <th className="px-6 py-4 text-center font-bold">
                  Sumber Transaksi
                </th>
                <th className="px-6 py-4 text-right font-bold">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {pagedTransaksi.map((trx, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 font-semibold text-font">
                    {trx.nomorNasabah}
                  </td>
                  <td className="px-6 py-4 font-semibold text-font">
                    {trx.jenisTransaksi}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-font">
                    {trx.nominal.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-font">
                    {trx.sumberTransaksi}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-font">
                    {trx.tanggal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-gray-200 py-4 text-sm">
          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`transition cursor-pointer ${
                currentPage === page
                  ? "font-bold text-primary"
                  : "text-font hover:text-primary"
              }`}
            >
              {page}
            </button>
          ))}
          <span className="text-gray-400">..</span>
          <button
            onClick={() => setCurrentPage(totalPages)}
            className={`font-medium transition ${
              currentPage === totalPages
                ? "font-bold text-primary"
                : "text-font hover:text-primary"
            }`}
          >
            {totalPages}
          </button>
        </div>
      </div>
    </div>
  );
}