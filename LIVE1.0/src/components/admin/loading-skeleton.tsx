"use client"

import { Card } from "@/components/ui/card"

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 1, className = "" }: LoadingSkeletonProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="animate-pulse space-y-4">
        {[...Array(lines)].map((_, i) => (
          <div 
            key={i} 
            className={`h-4 bg-gray-200 rounded ${i === 0 ? 'w-3/4' : 'w-full'}`} 
          />
        ))}
      </div>
    </Card>
  )
} 