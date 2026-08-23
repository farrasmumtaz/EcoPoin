"use client";

import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  HandCoins,
  LayoutGrid,
  LogOut,
  Recycle,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface MenuItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "GENERAL",
    items: [
      { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
      { label: "Data Warga", icon: Users, href: "/data-warga" },
      { label: "Setoran", icon: HandCoins, href: "/setoran" },
      { label: "Tabungan", icon: CircleDollarSign, href: "/tabungan" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { label: "Laporan", icon: FileText, href: "/laporan" },
      { label: "Jenis Sampah", icon: Recycle, href: "/jenis-sampah" },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-0 left-0 h-screen shrink-0 bg-white text-neutral-800 flex flex-col border-r border-neutral-200 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center py-6 px-5 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <h1 className="text-primary font-bold text-xl tracking-wide">
            ECOPOIN
          </h1>
        )}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-100 transition cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="border-t border-neutral-200" />

      {/* Nav sections */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-xs font-semibold text-neutral-400 tracking-wide mb-3 px-2">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map(({ label, icon: Icon, href }) => {
                const isActive = pathname === href;
                return (
                  <button
                    key={href}
                    onClick={() => router.replace(href)}
                    className={`w-full flex items-center gap-3 py-3 rounded-xl transition duration-200 cursor-pointer ${
                      collapsed ? "justify-center px-0" : "px-4"
                    } ${
                      isActive
                        ? "bg-primary text-white font-semibold"
                        : "text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                    {!collapsed && <span className="text-sm">{label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / profile card */}
      <div className="px-4 py-5">
        {!collapsed ? (
          <div className="flex items-center gap-3 border border-neutral-200 rounded-xl p-3">
            <img
              src="/avatar-placeholder.jpg"
              alt="User avatar"
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500 leading-tight">RT.2</p>
              <p className="text-sm font-semibold text-neutral-800 leading-tight truncate">
                Hj. Kimi
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition cursor-pointer shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img
              src="/avatar-placeholder.jpg"
              alt="User avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <button
              onClick={() => router.replace("/login")}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
