import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Providers } from "@/components/providers"
import { MainNav } from "@/components/layout/main-nav"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Heaven High NYC',
  description: 'Heaven High NYC Admin Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <MainNav />
          <main className="pt-16">
            {children}
          </main>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
} 