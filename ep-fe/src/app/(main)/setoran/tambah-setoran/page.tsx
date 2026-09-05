"use client";

import { ChevronDown, Plus, Recycle, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { getMembers, type Member } from "@/app/services/members/members";
import { createTransaction, finalizeTransaction, getTransactionById, updateTransaction } from "@/app/services/transactions/transactions";
import { getWasteTypes, type WasteType } from "@/app/services/waste-types/waste-types";

interface FormFieldLabelProps {
  readonly icon?: React.ReactNode;
  readonly children: React.ReactNode;
}

interface ItemEntry {
  readonly id: string;
  readonly wasteTypeId: string;
  readonly condition: "SORTED" | "UNSORTED";
  readonly weightKg: string;
}

function emptyItem(id: string): ItemEntry {
  return { id, wasteTypeId: "", condition: "SORTED", weightKg: "" };
}

const categoryLabels = {
  PLASTIC: "Plastik",
  PAPER: "Kertas",
  METAL: "Logam",
  GLASS: "Kaca",
  OTHER: "Lain-lain",
} as const;

function FormFieldLabel({ icon, children }: FormFieldLabelProps) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-font">
      {icon}
      {children}
    </label>
  );
}

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function SetoranForm() {
  const transactionId = useSearchParams().get("id") ?? "";
  const isEditMode = Boolean(transactionId);
  const [individualId, setIndividualId] = useState("");
  const [asUnit, setAsUnit] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [items, setItems] = useState<ItemEntry[]>([emptyItem("item-0")]);
  const [members, setMembers] = useState<Member[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const nextItemId = useRef(1);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    Promise.all([
      getMembers({ limit: 100 }),
      getWasteTypes({ limit: 100 }),
      transactionId ? getTransactionById(transactionId) : Promise.resolve(null),
    ])
      .then(([memberResult, wasteTypeResult, transaction]) => {
        if (!active) return;
        const activeMembers = memberResult.items.filter((member) => member.isActive);
        setMembers(activeMembers);
        setWasteTypes(wasteTypeResult.items.filter((wasteType) => wasteType.isActive));
        if (transaction) {
          if (transaction.status !== "DRAFT") {
            toast.error("Hanya transaksi DRAFT yang dapat diedit.");
            router.replace("/setoran");
            return;
          }
          const selectedMember = activeMembers.find((member) => member.id === transaction.memberId);
          const memberIsUnit = selectedMember?.type === "UNIT";
          setAsUnit(memberIsUnit);
          setIndividualId(memberIsUnit ? "" : transaction.memberId);
          setUnitId(memberIsUnit ? transaction.memberId : "");
          setItems(transaction.items.map((item, index) => ({
            id: `item-${index}`,
            wasteTypeId: item.wasteTypeId,
            condition: item.condition,
            weightKg: item.weightKg,
          })));
          nextItemId.current = transaction.items.length;
        }
      })
      .catch((error: unknown) => {
        if (active) toast.error(error instanceof Error ? error.message : "Data form gagal dimuat.");
      })
      .finally(() => {
        if (active) setIsLoadingOptions(false);
      });
    return () => {
      active = false;
    };
  }, [router, transactionId]);

  const individuals = members.filter((member) => member.type === "INDIVIDUAL");
  const units = members.filter((member) => member.type === "UNIT");
  const inputClass =
    "w-full rounded-md bg-placeholder/50 px-4 py-3 text-sm text-font outline-none transition duration-300 focus:ring-2 focus:ring-primary";
  const selectClass = `${inputClass} appearance-none pr-10`;

  const updateItem = (id: string, patch: Partial<Omit<ItemEntry, "id">>): void => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const resetForm = (): void => {
    setIndividualId("");
    setAsUnit(false);
    setUnitId("");
    setItems([emptyItem("item-0")]);
    nextItemId.current = 1;
  };

  const validate = (): boolean => {
    if ((!asUnit && !individualId) || (asUnit && !unitId)) {
      toast.error("Pilih nasabah atau unit terlebih dahulu.");
      return false;
    }
    if (items.some((item) => !item.wasteTypeId || !item.weightKg || Number(item.weightKg) <= 0)) {
      toast.error("Jenis sampah dan berat setiap item wajib diisi.");
      return false;
    }
    if (new Set(items.map((item) => `${item.wasteTypeId}:${item.condition}`)).size !== items.length) {
      toast.error("Kombinasi jenis sampah dan kondisi tidak boleh duplikat.");
      return false;
    }
    return true;
  };

  const persist = async (finalize: boolean): Promise<void> => {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        memberId: asUnit ? unitId : individualId,
        items: items.map((item) => ({ wasteTypeId: item.wasteTypeId, condition: item.condition, weightKg: Number(item.weightKg) })),
      };
      const transaction = isEditMode
        ? await updateTransaction(transactionId, payload)
        : await createTransaction({ ...payload, clientRequestId: crypto.randomUUID(), source: "DIRECT_ENTRY" });
      if (finalize) await finalizeTransaction(transaction.id);
      toast.success(finalize ? "Setoran berhasil disimpan dan difinalisasi." : "Draft setoran berhasil disimpan.");
      if (isEditMode) router.push("/setoran"); else resetForm();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Setoran tidak dapat disimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void persist(true);
  };

  return (
    <div className="min-h-full rounded-md bg-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? "Edit Draft Setoran" : "Tambah Setoran"}</h1>
        <p className="mt-1 text-sm text-gray-500">{isEditMode ? "Perubahan hanya dapat dilakukan selama transaksi masih berstatus draft." : "Catat sampah, kondisi, dan berat untuk nasabah atau unit."}</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <FormFieldLabel icon={<Users size={18} />}>Pilih Warga</FormFieldLabel>
          <div className="relative">
            <select
              value={individualId}
              onChange={(event) => setIndividualId(event.target.value)}
              className={selectClass}
              disabled={isLoadingOptions || isSaving}
            >
              <option value="">{isLoadingOptions ? "Memuat warga..." : "Pilih warga"}</option>
              {individuals.map((member) => (
                <option key={member.id} value={member.id}>{member.fullName}</option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-font/60" />
          </div>
        </div>

        <div className="mb-6">
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-bold text-font">
            <input
              type="checkbox"
              checked={asUnit}
              onChange={(event) => {
                setAsUnit(event.target.checked);
                if (!event.target.checked) setUnitId("");
              }}
              className="h-4 w-4 cursor-pointer accent-primary"
              disabled={isSaving}
            />
            Setoran Sebagai Unit
          </label>
        </div>

        {asUnit && (
          <div className="mb-6">
            <FormFieldLabel icon={<Users size={18} />}>Unit</FormFieldLabel>
            <div className="relative">
              <select value={unitId} onChange={(event) => setUnitId(event.target.value)} className={selectClass} disabled={isSaving}>
                <option value="">Pilih unit</option>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.fullName}</option>)}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-font/60" />
            </div>
          </div>
        )}

        {items.map((item) => {
          const selectedWasteType = wasteTypes.find((wasteType) => wasteType.id === item.wasteTypeId);
          return (
            <div key={item.id} className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <FormFieldLabel icon={<Recycle size={16} />}>Item</FormFieldLabel>
                <div className="relative">
                  <select value={item.wasteTypeId} onChange={(event) => updateItem(item.id, { wasteTypeId: event.target.value })} className={selectClass} disabled={isLoadingOptions || isSaving}>
                    <option value="">Pilih item</option>
                    {Object.entries(categoryLabels).map(([category, label]) => {
                      const categoryItems = wasteTypes.filter((wasteType) => wasteType.category === category);
                      return categoryItems.length > 0 ? (
                        <optgroup key={category} label={label}>
                          {categoryItems.map((wasteType) => <option key={wasteType.id} value={wasteType.id}>{wasteType.name}</option>)}
                        </optgroup>
                      ) : null;
                    })}
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-font/60" />
                </div>
              </div>

              <div>
                <FormFieldLabel>Kondisi</FormFieldLabel>
                <div className="relative">
                  <select value={item.condition} onChange={(event) => updateItem(item.id, { condition: event.target.value as "SORTED" | "UNSORTED" })} className={selectClass} disabled={isSaving}>
                    <option value="SORTED">Sudah dipilah</option>
                    <option value="UNSORTED">Belum dipilah</option>
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-font/60" />
                </div>
              </div>

              <div>
                <FormFieldLabel>Berat</FormFieldLabel>
                <div className="relative">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.weightKg}
                    onChange={(event) => updateItem(item.id, { weightKg: event.target.value })}
                    placeholder="0"
                    className={`${inputClass} pr-12`}
                    disabled={isSaving}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-font/60">kg</span>
                </div>
              </div>

              <div>
                <FormFieldLabel>Harga/Kg</FormFieldLabel>
                <input
                  type="text"
                  value={selectedWasteType ? rupiahFormatter.format(Number(item.condition === "SORTED" ? selectedWasteType.prices.sorted : selectedWasteType.prices.unsorted)) : ""}
                  placeholder="Pilih jenis sampah"
                  readOnly
                  className={`${inputClass} cursor-default bg-placeholder/70`}
                />
              </div>
            </div>
          );
        })}

        <button type="button" onClick={() => setItems((current) => [...current, emptyItem(`item-${nextItemId.current++}`)])} className="mb-6 flex cursor-pointer items-center gap-2 text-sm font-bold text-primary transition hover:opacity-75" disabled={isSaving}>
          <Plus size={18} className="rounded-full bg-font text-white" />
          Tambah Item
        </button>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => router.back()} className="rounded-md bg-placeholder px-8 py-3 font-semibold text-white transition hover:opacity-75">Kembali</button>
          <button type="button" onClick={resetForm} disabled={isSaving} className="rounded-md bg-danger px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 disabled:opacity-50">Ulang</button>
          <button type="button" onClick={() => void persist(false)} disabled={isSaving || isLoadingOptions} className="rounded-md bg-warning px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 disabled:opacity-50">{isEditMode ? "Simpan Draft" : "Draft"}</button>
          <button type="submit" disabled={isSaving || isLoadingOptions} className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:opacity-75 disabled:opacity-50">{isSaving ? "Menyimpan..." : isEditMode ? "Simpan & Finalisasi" : "Simpan"}</button>
        </div>
      </form>
    </div>
  );
}

export default function TambahSetoran() {
  return <Suspense fallback={<div className="p-6 text-sm text-gray-500">Memuat form setoran...</div>}><SetoranForm /></Suspense>;
}
