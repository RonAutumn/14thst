"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ProductVariation } from "@/types/product"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2 } from "lucide-react"

interface ProductVariationsProps {
  variations: ProductVariation[]
  onChange: (variations: ProductVariation[]) => void
  productType?: string
}

export function ProductVariations({
  variations,
  onChange,
  productType = 'cart'
}: ProductVariationsProps) {
  const [newVariation, setNewVariation] = useState<Partial<ProductVariation>>({
    type: 'size',
    name: '',
    stock: 0,
    isActive: true
  })

  const handleAddVariation = () => {
    if (!newVariation.name) return

    const variation: ProductVariation = {
      type: newVariation.type || 'size',
      name: newVariation.name,
      ...(newVariation.price !== undefined && { price: Number(newVariation.price) }),
      stock: Number(newVariation.stock || 0),
      isActive: newVariation.isActive ?? true
    }

    onChange([...variations, variation])
    setNewVariation({
      type: 'size',
      name: '',
      stock: 0,
      isActive: true
    })
  }

  const handleRemoveVariation = (index: number) => {
    const newVariations = variations.filter((_, i) => i !== index)
    onChange(newVariations)
  }

  const handleVariationChange = (index: number, field: keyof ProductVariation, value: any) => {
    const newVariations = variations.map((v, i) => {
      if (i === index) {
        if (field === 'price' && value === '') {
          // Remove price if empty
          const { price, ...rest } = v
          return rest
        }
        return {
          ...v,
          [field]: field === 'price' || field === 'stock' 
            ? (value === '' ? 0 : Number(value))
            : value
        }
      }
      return v
    })
    onChange(newVariations)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="grid grid-cols-5 gap-2">
          <Input
            placeholder="Name (e.g. Small, 3.5g)"
            value={newVariation.name}
            onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Price (optional)"
            value={newVariation.price ?? ''}
            onChange={(e) => {
              const value = e.target.value
              setNewVariation({ 
                ...newVariation, 
                price: value === '' ? undefined : parseFloat(value)
              })
            }}
          />
          <Input
            type="number"
            placeholder="Stock"
            value={newVariation.stock ?? 0}
            onChange={(e) => setNewVariation({ 
              ...newVariation, 
              stock: e.target.value === '' ? 0 : parseInt(e.target.value) 
            })}
          />
          <div className="flex items-center space-x-2">
            <Switch
              checked={newVariation.isActive}
              onCheckedChange={(checked) => setNewVariation({ ...newVariation, isActive: checked })}
            />
            <Label>Active</Label>
          </div>
          <Button onClick={handleAddVariation}>Add</Button>
        </div>
      </div>

      {variations.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price (optional)</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variations.map((variation, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={variation.name}
                    onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={variation.price ?? ''}
                    onChange={(e) => handleVariationChange(index, 'price', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={variation.stock ?? 0}
                    onChange={(e) => handleVariationChange(index, 'stock', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={variation.isActive}
                    onCheckedChange={(checked) => handleVariationChange(index, 'isActive', checked)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVariation(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
} 