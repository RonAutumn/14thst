import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationMenu, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";

interface NavigationProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  children?: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({
  searchQuery,
  onSearchChange,
  children
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isStorePage = pathname?.startsWith('/store');

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" }
  ];

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white border-b border-border shadow-sm dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Logo - Always visible */}
          <Link href="/" className="text-lg md:text-xl font-bold text-foreground hover:text-primary whitespace-nowrap">
            Heaven High NYC
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:block">
            <NavigationMenuList className="flex space-x-1">
              {navLinks.map((link) => (
                <NavigationMenuLink
                  key={link.href}
                  asChild
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "hover:bg-gray-100 hover:text-gray-900",
                      "dark:hover:bg-gray-800 dark:hover:text-gray-50",
                      "focus:outline-none focus:ring-2 focus:ring-primary",
                      pathname === link.href ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search and Cart */}
          <div className="flex items-center gap-2 md:gap-4">
            {isStorePage && (
              <>
                <div className="hidden md:block">
                  <Input
                    type="search"
                    placeholder="Search menu..."
                    className="w-[200px] lg:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </>
            )}
            
            <div className="flex items-center">
              {children}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-200 ease-in-out",
          isMobileMenuOpen ? "max-h-64" : "max-h-0"
        )}>
          <div className="py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-2 text-base font-medium rounded-md transition-colors",
                  "hover:bg-gray-100 hover:text-gray-900",
                  "dark:hover:bg-gray-800 dark:hover:text-gray-50",
                  pathname === link.href ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "text-gray-600 dark:text-gray-400"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Mobile Search Input */}
        {isStorePage && (
          <div className={cn(
            "md:hidden pb-3 transition-all duration-200 ease-in-out",
            isSearchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          )}>
            <Input
              type="search"
              placeholder="Search menu..."
              className="w-full"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </nav>
  );
};
