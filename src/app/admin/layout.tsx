"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PasswordGate } from "@/components/password-gate"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/delivery", label: "Delivery Management" },
  { href: "/admin/shipping", label: "Shipping Management" },
  { href: "/admin/pickup", label: "Pickup Management" },
  { href: "/admin/store", label: "Store Management" }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuth') === 'true';
    setIsAuthenticated(authStatus);
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('adminAuth', 'true');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={handleLoginSuccess} />;
  }
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-background border-r">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>
        </div>
        <nav className="px-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 rounded-md hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
