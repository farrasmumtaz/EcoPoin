"use client";

import { Search, Plus, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ---------- Types ----------
interface Warga {
  nomorNasabah: string;
  nama: string;
  rt: string;
  noTelp: string;
}

// ---------- Static data (replace with real data / API calls) ----------
const PAGE_SIZE = 9;
const totalPages = 10;

const wargaData: Warga[] = Array.from(
  { length: PAGE_SIZE * totalPages },
  () => ({
    nomorNasabah: "122234456",
    nama: "Asep Wahyudi",
    rt: "RT 2",
    noTelp: "08991232134",
  }),
);

const visiblePages = [1, 2, 3, 4, 5, 6, 7];

export default function DataWarga() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const pagedWarga = wargaData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const goToEditWarga = (warga: Warga) => {
    const params = new URLSearchParams({
      nomorNasabah: warga.nomorNasabah,
      nama: warga.nama,
      rt: warga.rt,
      noTelp: warga.noTelp,
    });
    router.push(`/data-warga/edit-warga?${params.toString()}`);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50 p-6">
      {/* Search + Add button */}
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari data warga"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-font placeholder:text-gray-400 outline-none focus:border-primary transition duration-300"
          />
        </div>
        <button
          onClick={() => router.push("/data-warga/tambah-warga")}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/75 cursor-pointer duration-300"
        >
          Tambah Warga
          <Plus size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200 text-font">
                <th className="px-6 py-4 font-bold">Nomor Nasabah</th>
                <th className="px-6 py-4 text-center font-bold">Nama</th>
                <th className="px-6 py-4 text-center font-bold">RT</th>
                <th className="px-6 py-4 text-center font-bold">No. Telp</th>
                <th className="px-6 py-4 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedWarga.map((warga, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 font-semibold text-font">
                    {warga.nomorNasabah}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-font">
                    {warga.nama}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-font">
                    {warga.rt}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-font">
                    {warga.noTelp}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        aria-label={`Lihat ${warga.nama}`}
                        onClick={() => goToEditWarga(warga)}
                        className="flex h-8 w-9 items-center justify-center rounded-md border border-gray-300 text-font transition hover:border-primary hover:text-primary duration-300 cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
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
            className={`font-medium transition  ${
              currentPage === totalPages
                ? "font-bold text-primary"
                : "text-font hover:text-primary"
            } `}
          >
            {totalPages}
          </button>
        </div>
      </div>
    </div>
  );
}