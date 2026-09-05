"use client";

import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  HandCoins,
  WalletCards,
  LayoutGrid,
  LogOut,
  Recycle,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

import { useAuthStore } from "../services/auth/authStore";
import { getProfile, type Profile } from "../services/profile/profile";

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
      { label: "Penarikan", icon: WalletCards, href: "/penarikan" },
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

const roleLabels: Record<Profile["role"], string> = {
  ADMIN: "Administrator",
  OPERATOR: "Operator",
  COORDINATOR: "Koordinator",
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const authenticatedUser = useAuthStore((state) => state.user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    void getProfile().then((result) => { if (active) setProfile(result); }).catch(() => undefined);
    const handleProfileUpdate = (event: Event): void => {
      const customEvent = event as CustomEvent<Profile>;
      setProfile(customEvent.detail);
    };
    window.addEventListener("ecopoin:profile-updated", handleProfileUpdate);
    return () => { active = false; window.removeEventListener("ecopoin:profile-updated", handleProfileUpdate); };
  }, []);

  const displayName = profile?.fullName ?? authenticatedUser?.email ?? "Pengguna EcoPoin";
  const displayRole = profile ? roleLabels[profile.role] : authenticatedUser?.role ?? "Memuat profil";
  const organizationName = profile?.organization.name ?? "EcoPoin";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "EP";

  const handleLogout = async (): Promise<void> => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Berhasil logout.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Sesi lokal dihapus, tetapi server tidak dapat dihubungi.");
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={`app-sidebar sticky top-0 left-0 h-screen shrink-0 bg-white text-neutral-800 flex flex-col border-r border-neutral-200 transition-all duration-300 print:hidden ${
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
          <div className="min-w-0"><h1 className="text-primary font-bold text-xl tracking-wide">ECOPOIN</h1><p className="truncate text-[11px] text-neutral-500" title={organizationName}>{organizationName}</p></div>
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
            <button
              onClick={() => router.push("/profil")}
              className="flex flex-1 items-center gap-3 min-w-0 cursor-pointer text-left"
              aria-label="Lihat profil"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-primary" aria-label="Inisial pengguna">{initials}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs leading-tight text-neutral-500">{displayRole}</p>
                <p className="truncate text-sm font-semibold leading-tight text-neutral-800" title={displayName}>{displayName}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition cursor-pointer shrink-0"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => router.push("/profil")}
              className="cursor-pointer"
              aria-label="Lihat profil"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-primary" title={`${displayName} · ${displayRole}`}>{initials}</span>
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
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
