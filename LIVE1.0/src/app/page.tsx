"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Cookies from 'js-cookie';

export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    try {
      const isAuthenticated = Cookies.get('site_access') === 'true';
      if (isAuthenticated) {
        setIsRedirecting(true);
        router.push("/store");
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setIsInitialized(true);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const sitePassword = process.env.NEXT_PUBLIC_SITE_PASSWORD;
      if (!sitePassword) {
        throw new Error("Site password not configured. Please check your environment variables.");
      }

      if (password === sitePassword) {
        // Set cookie with 24 hour expiry
        Cookies.set('site_access', 'true', { expires: 1, path: '/' });
        setIsRedirecting(true);
        router.push("/store");
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  // Show loading state while checking authentication or redirecting
  if (!isInitialized || isRedirecting) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-white">
              Welcome to Heaven High NYC
            </h1>
            <p className="text-gray-400">
              Please enter the password to continue
            </p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
              autoFocus
              required
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={isLoading}
            >
              {isLoading ? "Checking..." : "Enter"}
            </Button>
          </div>
        </form>
      </div>
      <Toaster />
    </div>
  );
} 