'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StoreTab() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading products...</div>
        ) : products.length === 0 ? (
          <div>No products found</div>
        ) : (
          <div>Products will be displayed here</div>
        )}
      </CardContent>
    </Card>
  )
} 