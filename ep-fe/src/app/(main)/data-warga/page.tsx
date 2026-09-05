"use client";

import { Eye, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { deactivateMember, getMembers } from "@/app/services/members/members";

const PAGE_SIZE = 9;

export default function DataWarga() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [items, setItems] = useState<
    { id: string; memberNumber: string; fullName: string; rt: string | null; phone: string | null }[]
  >([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const router = useRouter();

  // Debounce search input so we don't fire a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // reset to page 1 whenever the search term changes
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Fetch whenever the page or debounced search term changes.
  useEffect(() => {
    let cancelled = false;

    async function fetchMembers() {
      try {
        setIsLoading(true);
        const { items, pagination } = await getMembers({
          page: currentPage,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          type: "INDIVIDUAL",
        });
        if (cancelled) return;
        setItems(items);
        setTotalPages(pagination.totalPages || 1);
      } catch (err) {
        if (cancelled) return;
        toast.error(
          err instanceof Error ? err.message : "Gagal memuat data warga.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMembers();
    return () => {
      cancelled = true;
    };
  }, [currentPage, debouncedSearch]);

  // Build a bounded window of page numbers around the current page instead
  // of a hardcoded 1–7, since totalPages now comes from the API and can be
  // smaller or much larger than 7.
  const visiblePages = useMemo(() => {
    const windowSize = 7;
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const goToEditWarga = (member: (typeof items)[number]) => {
    router.push(`/data-warga/edit-warga?id=${encodeURIComponent(member.id)}`);
  };

  const handleDeactivate = async (member: (typeof items)[number]): Promise<void> => {
    if (!window.confirm(`Nonaktifkan warga "${member.fullName}"? Riwayat transaksi tetap tersimpan.`)) return;
    setDeletingId(member.id);
    try {
      await deactivateMember(member.id);
      setItems((current) => current.filter((item) => item.id !== member.id));
      toast.success("Warga berhasil dinonaktifkan.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Warga gagal dinonaktifkan.");
    } finally { setDeletingId(null); }
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-font/60">
                    Memuat data...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-font/60">
                    Tidak ada data warga.
                  </td>
                </tr>
              ) : (
                items.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-6 py-4 font-semibold text-font">
                      {member.memberNumber}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-font">
                      {member.fullName}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-font">
                      {member.rt ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-font">
                      {member.phone ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label={`Lihat detail ${member.fullName}`}
                          onClick={() => router.push(`/data-warga/detail-warga?id=${encodeURIComponent(member.id)}`)}
                          className="flex h-8 w-9 items-center justify-center rounded-md border border-blue-500 text-blue-600 transition hover:bg-blue-500 hover:text-white cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          aria-label={`Edit ${member.fullName}`}
                          onClick={() => goToEditWarga(member)}
                          className="flex h-8 w-9 items-center justify-center rounded-md border border-gray-300 text-font transition hover:border-primary hover:text-primary duration-300 cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Nonaktifkan ${member.fullName}`}
                          disabled={deletingId === member.id}
                          onClick={() => void handleDeactivate(member)}
                          className="flex h-8 w-9 items-center justify-center rounded-md border border-danger text-danger transition hover:bg-danger hover:text-white disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 size={15} />
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
