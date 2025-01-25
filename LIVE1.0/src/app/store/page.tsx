import { getProducts } from '@/lib/airtable'
import { ProductsGrid } from '@/components/products-grid'
import { CategoriesPanel } from '@/components/categories-panel'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function StorePage() {
  // Check if user is authenticated
  const cookieStore = cookies()
  const isAuthenticated = cookieStore.get('site_access')?.value === 'true'

  if (!isAuthenticated) {
    redirect('/')
  }

  try {
    // Fetch products
    const products = await getProducts();
    
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto py-6">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
            {/* Categories Panel */}
            <Suspense 
              fallback={
                <div className="h-[200px] flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              }
            >
              <CategoriesPanel />
            </Suspense>

            {/* Products Grid */}
            <Suspense 
              fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[300px] bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              }
            >
              <ProductsGrid products={products} />
            </Suspense>
          </div>
        </div>
      </main>
    )
  } catch (error) {
    console.error('Error in StorePage:', error);
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to load products</h2>
          <p className="text-muted-foreground mb-4">
            Please try again later or contact support if the issue persists.
          </p>
          <pre className="text-sm text-red-500 bg-red-50 p-4 rounded-md overflow-auto max-w-2xl mx-auto">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </pre>
        </div>
      </div>
    )
  }
} 