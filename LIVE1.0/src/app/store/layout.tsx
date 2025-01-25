"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from 'js-cookie';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ClientLayout } from "@/components/layout/client-layout";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const isAuthenticated = Cookies.get('site_access') === 'true';
      setIsAuthed(isAuthenticated);
      
      if (!isAuthenticated && pathname !== "/") {
        router.replace("/");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthed(false);
      router.replace("/");
    }
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isAuthed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthed) {
    return null;
  }

  return <ClientLayout>{children}</ClientLayout>;
} 