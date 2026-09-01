"use client";

import { Search, Plus, X, Check, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { getWasteTypes } from "@/app/services/waste-types/waste-types"; // adjust to your actual path

const PAGE_SIZE = 9;

// Display labels for the confirmed/guessed backend category values.
// NOTE: "ORGANIC" is unconfirmed — see wasteTypes.ts.
const CATEGORY_LABELS: Record<string, string> = {
  PLASTIC: "Plastik",
  PAPER: "Kertas",
  METAL: "Logam",
  GLASS: "Kaca",
  OTHER: "Lain-lain",
};

interface WasteTypeRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  sortedPricePerKg: number;
  unsortedPricePerKg: number;
}

export default function JenisSampah() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [items, setItems] = useState<WasteTypeRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  // Debounce search input so we don't fire a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function fetchWasteTypes() {
      try {
        setIsLoading(true);
        const { items, pagination } = await getWasteTypes({
          page: currentPage,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
        });
        if (cancelled) return;
        setItems(
          items.map((wasteType) => ({
            id: wasteType.id,
            name: wasteType.name,
            category: wasteType.category,
            unit: wasteType.unit,
            sortedPricePerKg: Number(wasteType.prices.sorted),
            unsortedPricePerKg: Number(wasteType.prices.unsorted),
          })),
        );
        setTotalPages(pagination.totalPages || 1);
      } catch (err) {
        if (cancelled) return;
        toast.error(
          err instanceof Error ? err.message : "Gagal memuat data jenis sampah.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchWasteTypes();
    return () => {
      cancelled = true;
    };
  }, [currentPage, debouncedSearch]);

  const visiblePages = useMemo(() => {
    const windowSize = 7;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const goToEditJenisSampah = (wasteType: WasteTypeRow) => {
    router.push(
      `/jenis-sampah/edit-jenis-sampah?id=${encodeURIComponent(wasteType.id)}`,
    );
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
            placeholder="Cari jenis sampah"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-font placeholder:text-gray-400 outline-none focus:border-primary transition duration-300"
          />
        </div>
        <button
          onClick={() => router.push("/jenis-sampah/tambah-jenis-sampah")}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/75 cursor-pointer duration-300"
        >
          Jenis Sampah
          <Plus size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200 text-font">
                <th className="px-6 py-4 font-bold">Nama</th>
                <th className="px-6 py-4 font-bold">Kategori</th>
                <th className="px-6 py-4 text-center font-bold">Satuan</th>
                <th className="px-6 py-4 text-center font-bold">
                  Dipilah/Kg (Rp)
                </th>
                <th className="px-6 py-4 text-center font-bold">Belum Dipilah/Kg (Rp)</th>
                <th className="px-6 py-4 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-font/60">
                    Memuat data...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-font/60">
                    Tidak ada data jenis sampah.
                  </td>
                </tr>
              ) : (
                items.map((sampah) => (
                  <tr
                    key={sampah.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-6 py-4 font-semibold text-font">
                      {sampah.name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-font">
                      {CATEGORY_LABELS[sampah.category] ?? sampah.category}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-font">
                      {sampah.unit}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-font">
                      {sampah.sortedPricePerKg.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-font">
                      {sampah.unsortedPricePerKg.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {/* NOTE: no confirmed delete/approve endpoints yet —
                            these are UI-only until wasteTypes.ts has
                            matching functions. */}
                        <button
                          aria-label={`Hapus ${sampah.name}`}
                          className="flex h-8 w-9 items-center justify-center rounded-md border border-danger text-danger transition hover:bg-danger hover:text-white duration-300 cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                        <button
                          aria-label={`Setujui ${sampah.name}`}
                          className="flex h-8 w-9 items-center justify-center rounded-md border border-primary text-primary transition hover:bg-primary hover:text-white duration-300 cursor-pointer"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          aria-label={`Lihat ${sampah.name}`}
                          onClick={() => goToEditJenisSampah(sampah)}
                          className="flex h-8 w-9 items-center justify-center rounded-md border border-warning text-warning transition hover:bg-warning hover:text-white duration-300 cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-gray-200 py-4 text-sm">
          {visiblePages[0] > 1 && <span className="text-gray-400">..</span>}
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
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <span className="text-gray-400">..</span>
          )}
        </div>
      </div>
    </div>
  );
}
