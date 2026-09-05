"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import loginAsset from "../../assets/login_assets.jpg";
import { useRouter } from "next/navigation";
import { authUser } from "../services/auth/authUser";
import { useAuthStore } from "@/app/services/auth/authStore"; 
import { CircularProgress } from "@mui/material";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setLoading] = useState(false);

  // If a valid session already exists (checked by AuthInitializer on app
  // load), skip the login form entirely and go straight to the dashboard.
  useEffect(() => {
    if (isInitializing) return;
    if (user) router.replace("/dashboard");
  }, [isInitializing, user, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await authUser(email, password);
      setUser(data); // populate the global store, not just show a toast
      toast.success(`Selamat datang, ${data.email}`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan, silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Avoid flashing the login form for a split second while we're still
  // checking whether a session already exists.
  if (isInitializing || user) return null;

  return (
    <div className="h-screen w-full bg-neutral-800 flex items-center justify-center p-6">
      <div className="w-[92vw] h-[95vh] max-w-350 max-h-235 bg-white rounded-2xl shadow-xl overflow-hidden flex">
        {/* Left panel — image */}
        <div className="hidden md:flex relative w-1/2">
          <Image
            src={loginAsset}
            loading="eager"
            alt="Aerial view of forest canopy"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />

          {/* Quote overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-10 text-white">
            <p className="font-semibold mb-2 text-lg">Robert Swan</p>
            <p className="text-base text-white/90 leading-relaxed">
              &ldquo;emphasizes individual accountability, noting that relying
              on others to save the planet is the greatest threat.&rdquo;
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="w-full md:w-1/2 px-12 lg:px-20 flex flex-col justify-center">
          <h2 className="text-primary font-bold text-2xl tracking-wide mb-10 text-center ">
            ECOPOIN
          </h2>

          <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-font text-center ">
            Selamat Datang Kembali
          </h1>
          <p className="text-xl text-font text-center mb-10">
            Isi email dan password untuk mengakses akun anda!
          </p>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-font mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="Isi email anda"
                className="w-full px-5 py-3.5 rounded-lg bg-placeholder/50 border border-transparent text-base text-font placeholder:text-font/50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition duration-300 focus:text-font"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-font mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  minLength={8}
                  required
                  placeholder="Isi password anda"
                  className="w-full px-5 py-3.5 rounded-lg text-font bg-placeholder/50 border border-transparent text-base placeholder:text-font/50 focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition duration-300 focus:text-font"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className=" text-font  hover:text-primary transition duration-300"
              >
                Forgot Password
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/75 text-white font-semibold text-base py-4 rounded-lg transition duration-300 cursor-pointer"
            >
              {isLoading ? <CircularProgress></CircularProgress> : <p>Masuk</p>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}