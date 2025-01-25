'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MainNav() {
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link 
            href="/" 
            className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary transition-colors"
          >
            Heaven High NYC
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`text-sm font-medium ${
                pathname === '/' 
                  ? 'text-primary' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/about"
              className={`text-sm font-medium ${
                pathname === '/about'
                  ? 'text-primary'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
              }`}
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 
