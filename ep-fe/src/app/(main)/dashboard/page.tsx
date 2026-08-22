"use client";

import {
  Recycle,
  Waves,
  Users,
  Wallet,
  Receipt,
  Calendar,
  Eye,
} from "lucide-react";

// ---------- Types ----------
interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}

interface WasteRow {
  kategori: string;
  jenis: string;
  harga: number;
}

interface Transaction {
  rt: string;
  kg: number;
}

// ---------- Static data (replace with real data / API calls) ----------
const statCards: StatCard[] = [
  {
    icon: <Recycle size={18} />,
    label: "Total Berat",
    value: "245,290",
    unit: "Kg",
  },
  {
    icon: <Waves size={18} />,
    label: "Jumlah Setoran",
    value: "250,000",
    unit: "org",
  },
  {
    icon: <Users size={18} />,
    label: "Warga Aktif",
    value: "225,000",
    unit: "org",
  },
  {
    icon: <Wallet size={18} />,
    label: "Total Rupiah",
    value: "250,000",
    unit: "",
  },
  {
    icon: <Receipt size={18} />,
    label: "Jumlah Transaksi",
    value: "250,000",
    unit: "",
  },
];

const wasteComposition: WasteRow[] = Array.from({ length: 6 }, () => ({
  kategori: "Organik",
  jenis: "Daun",
  harga: 3000,
}));

const pendingDeposits = Array.from({ length: 8 }, (_, i) => `Setoran ${i + 1}`);

const recentTransactions: Transaction[] = [
  { rt: "RT 2", kg: 24.3 },
  { rt: "RT 1", kg: 23.3 },
  { rt: "RT 4", kg: 22.3 },
  { rt: "RT 5", kg: 21.3 },
  { rt: "RT 7", kg: 20.3 },
  { rt: "RT 8", kg: 14.3 },
];

// ---------- Small reusable pieces ----------
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-gray-500">
      {icon}
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}

function StatCardItem({ icon, label, value, unit }: StatCard) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-font">{value}</span>
        {unit && <span className="text-sm text-font/50">{unit}</span>}
      </div>
    </Card>
  );
}

// ---------- Page ----------
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <StatCardItem key={card.label} {...card} />
        ))}
      </div>

      {/* Filter + Waste composition */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<Calendar size={16} />} title="Filter Tanggal" />
          <div className="grid grid-cols-2 gap-4 p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-font/50">
                Asal Tanggal
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-font outline-none focus:border-primary transition duration-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-font/50">
                Akhir Tanggal
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-font outline-none focus:border-primary transition duration-300"
              />
            </div>
            <button className="col-span-2 rounded-md mt-18 bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/75 cursor-pointer">
              Simpan
            </button>
            <button className="col-span-2 rounded-md bg-danger py-2.5 text-sm font-semibold text-white transition hover:bg-danger/75 cursor-pointer">
              Reset
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Recycle size={16} />} title="Komposisi Sampah" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-700">
                  <th className="px-5 py-3 font-semibold text-font">
                    Kategori
                  </th>
                  <th className="px-5 py-3 font-semibold text-font">
                    Jenis Sampah
                  </th>
                  <th className="px-5 py-3 font-semibold text-font">
                    Harga/Kg
                  </th>
                </tr>
              </thead>
              <tbody>
                {wasteComposition.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-font">
                      {row.kategori}
                    </td>
                    <td className="px-5 py-3 text-font">{row.jenis}</td>
                    <td className="px-5 py-3 text-font">{row.harga}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Pending deposits + Recent transactions */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={<Waves size={16} />}
            title={`Jumlah Setoran Tertunda (${pendingDeposits.length})`}
          />
          <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
            {pendingDeposits.map((setoran) => (
              <li
                key={setoran}
                className="flex items-center justify-between px-5 py-3"
              >
                <span className="text-sm font-semibold text-font">
                  {setoran}
                </span>
                <button
                  aria-label={`Lihat ${setoran}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-600 transition hover:border-primary hover:text-primary cursor-pointer"
                >
                  <Eye size={14} />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader icon={<Users size={16} />} title="Transaksi Terbaru" />
          <ul className="divide-y divide-gray-100">
            {recentTransactions.map((tx) => (
              <li
                key={tx.rt}
                className="flex items-center justify-between px-5 py-3"
              >
                <span className="text-sm font-semibold text-font">
                  {tx.rt}
                </span>
                <span className="text-sm font-semibold text-font">
                  {tx.kg.toFixed(1)}
                  <span className="ml-0.5 text-xs font-normal text-font/50">
                    Kg
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
