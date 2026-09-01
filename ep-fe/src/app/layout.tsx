import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthInitializer } from "@/app/components/authInitializer"; // adjust to your actual path
import { SessionTimeout } from "@/app/components/sessionTimeout";

export const metadata: Metadata = {
  title: "EcoPoin",
  description:
    "EcoPoin adalah platform web untuk mengubah catatan transaksi bank sampah yang datar dan tercampur menjadi profil nasabah, saldo, buku tabungan digital, riwayat aktivitas, serta rekap individu dan unit yang dapat ditelusuri.",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* Renders nothing — kicks off the /auth/me session check once on app load */}
        <AuthInitializer />
        <SessionTimeout />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
            },
            success: {
              style: {
                background: "green",
              },
            },
            error: {
              style: {
                background: "red",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
