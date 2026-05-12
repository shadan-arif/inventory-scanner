"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  LogOut,
  ShoppingCart,
  ScanLine,
  Users,
  ClipboardList,
  Leaf,
  PackageCheck,
  Tag,
  Printer,
  Loader2,
  ShoppingBag
} from "lucide-react";

interface User {
  id: number;
  code: string;
  role: string;
  name: string;
}

export default function ModulesScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  const modules = [
    {
      id: "wholesale",
      name: "Wholesale",
      icon: <ShoppingCart size={28} className="text-blue-600" />,
      path: "/wholesale",
      active: true,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-blue-100",
    },
    {
      id: "item-manager",
      name: "Item Manager",
      icon: <ScanLine size={28} className="text-emerald-600" />,
      path: "/v2",
      active: true,
      color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100",
    },
    {
      id: "buyer",
      name: "Buyer",
      icon: <ShoppingBag size={28} className="text-violet-600" />,
      path: "/buyer",
      active: true,
      color: "bg-violet-50 border-violet-200 hover:border-violet-400 hover:shadow-violet-100",
    },
    {
      id: "po",
      name: "Purchase Order",
      icon: <ClipboardList size={28} className="text-gray-400" />,
      path: "#",
      active: false,
      color: "bg-gray-50 border-gray-100",
    },
    {
      id: "produce",
      name: "Produce Inv.",
      icon: <Leaf size={28} className="text-gray-400" />,
      path: "#",
      active: false,
      color: "bg-gray-50 border-gray-100",
    },
    {
      id: "receive",
      name: "Receive Inv.",
      icon: <PackageCheck size={28} className="text-gray-400" />,
      path: "#",
      active: false,
      color: "bg-gray-50 border-gray-100",
    },
    {
      id: "labels",
      name: "Shelf Label",
      icon: <Tag size={28} className="text-gray-400" />,
      path: "#",
      active: false,
      color: "bg-gray-50 border-gray-100",
    },
    {
      id: "signs",
      name: "Print Signs",
      icon: <Printer size={28} className="text-gray-400" />,
      path: "#",
      active: false,
      color: "bg-gray-50 border-gray-100",
    },
  ];

  if (user?.role === "ADMIN") {
    modules.push({
      id: "admin",
      name: "Admin Panel",
      icon: <Users size={28} className="text-purple-600" />,
      path: "/admin",
      active: true,
      color: "bg-purple-50 border-purple-200 hover:border-purple-400 hover:shadow-purple-100",
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="object-contain rounded-lg" />
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">LAMS Supermarket</h1>
            {user && (
              <p className="text-xs text-gray-500 font-medium">
                {user.name} ({user.role})
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-full transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="max-w-4xl mx-auto mt-8 px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">Select Module</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => mod.active && router.push(mod.path)}
              disabled={!mod.active}
              className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-200 shadow-sm
                ${mod.color}
                ${mod.active ? "cursor-pointer hover:-translate-y-1 hover:shadow-md" : "cursor-not-allowed opacity-70 grayscale-[50%]"}
              `}
            >
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                {mod.icon}
              </div>
              <span className={`font-semibold text-sm ${mod.active ? "text-gray-900" : "text-gray-500"}`}>
                {mod.name}
              </span>
              
              {!mod.active && (
                <div className="absolute top-3 right-3">
                  <span className="bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    Soon
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
