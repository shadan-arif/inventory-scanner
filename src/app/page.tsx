"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { Settings, LogIn, Lock, User as UserIcon } from "lucide-react";

export default function LoginScreen() {
  const router = useRouter();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4 || password.length !== 4) {
      toast.error("Code and password must be exactly 4 digits.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Welcome, ${data.user.name}!`);
        router.push("/modules");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 space-y-8 relative overflow-hidden">
        
        {/* Admin Toggle */}
        <button
          onClick={() => {
            setIsAdminLogin(!isAdminLogin);
            setCode("");
            setPassword("");
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
          title={isAdminLogin ? "Employee Login" : "Admin Login"}
        >
          {isAdminLogin ? <UserIcon size={20} /> : <Settings size={20} />}
        </button>

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Image src="/logo.jpg" alt="Brand Logo" width={120} height={120} className="object-contain rounded-xl" priority />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">LamsMarket Scanner</h1>
          <p className="text-gray-500 text-sm">
            {isAdminLogin ? "Admin Access Portal" : "Employee Access"}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {isAdminLogin ? "Admin Code" : "User Code"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-4 py-4 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium tracking-widest text-center text-lg bg-gray-50/50"
                  placeholder="0000"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-4 py-4 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium tracking-widest text-center text-lg bg-gray-50/50"
                  placeholder="••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 4 || password.length !== 4}
            className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

      </div>
    </main>
  );
}
