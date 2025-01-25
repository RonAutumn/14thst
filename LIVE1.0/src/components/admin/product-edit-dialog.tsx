"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import type { Product, Category, ProductDetails } from "@/types/product"

interface ProductEditDialogProps {
  product?: Product & { details?: ProductDetails }
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Partial<Product> & { details?: Partial<ProductDetails> }) => Promise<void>
}

export function ProductEditDialog({
  product,
  categories,
  open,
  onOpenChange,
  onSave,
}: ProductEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Product> & { details?: Partial<ProductDetails> }>(
    product || {
      name: "",
      description: "",
      price: 0,
      category: [],
      stock: 100,
      isActive: true,
      status: "active",
      imageUrl: "",
      variations: [],
      details: {
        productId: `temp_${Date.now()}`,
        lastUpdated: new Date().toISOString(),
        thcContent: 0,
        cbdContent: 0,
        strain: "hybrid",
        labTested: true,
        childResistant: true,
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      await onSave(formData)
      toast.success("Product saved successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Failed to save product")
    } finally {
      setIsLoading(false)
    }
  }

  const updateDetails = (updates: Partial<ProductDetails>) => {
    setFormData(prev => {
      const currentDetails = prev.details || {
        productId: `temp_${Date.now()}`,
        lastUpdated: new Date().toISOString()
      }
      return {
        ...prev,
        details: {
          ...currentDetails,
          ...updates
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {product ? "Make changes to the product" : "Add a new product to your store"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="cannabis">Cannabis Info</TabsTrigger>
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., OG Kush Cart"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description and effects..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category?.[0] || ""}
                      onValueChange={(value) => setFormData({ ...formData, category: [value] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Product image URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => 
                          setFormData({ 
                            ...formData, 
                            isActive: checked,
                            status: checked ? "active" : "inactive"
                          })
                        }
                      />
                      <Label>{formData.isActive ? "Active" : "Inactive"}</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cannabis">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thcContent">THC Content (%)</Label>
                    <Input
                      id="thcContent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.details?.thcContent}
                      onChange={(e) => updateDetails({ thcContent: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cbdContent">CBD Content (%)</Label>
                    <Input
                      id="cbdContent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.details?.cbdContent}
                      onChange={(e) => updateDetails({ cbdContent: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strain">Strain Type</Label>
                    <Select
                      value={formData.details?.strain}
                      onValueChange={(value) => updateDetails({ strain: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select strain type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sativa">Sativa</SelectItem>
                        <SelectItem value="indica">Indica</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effects">Effects</Label>
                  <Input
                    id="effects"
                    value={formData.details?.effects?.join(", ")}
                    onChange={(e) => updateDetails({ effects: e.target.value.split(",").map(s => s.trim()) })}
                    placeholder="e.g., Relaxing, Euphoric, Creative"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terpenes">Terpenes</Label>
                  <Input
                    id="terpenes"
                    value={formData.details?.terpenes?.join(", ")}
                    onChange={(e) => updateDetails({ terpenes: e.target.value.split(",").map(s => s.trim()) })}
                    placeholder="e.g., Myrcene, Limonene, Pinene"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cartType">Cart Type</Label>
                    <Select
                      value={formData.details?.cartType}
                      onValueChange={(value) => updateDetails({ cartType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cart type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distillate">Distillate</SelectItem>
                        <SelectItem value="live resin">Live Resin</SelectItem>
                        <SelectItem value="full spectrum">Full Spectrum</SelectItem>
                        <SelectItem value="co2">CO2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cartridgeSize">Cartridge Size</Label>
                    <Select
                      value={formData.details?.cartridgeSize}
                      onValueChange={(value) => updateDetails({ cartridgeSize: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5g">0.5g</SelectItem>
                        <SelectItem value="1.0g">1.0g</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hardwareType">Hardware Type</Label>
                    <Input
                      id="hardwareType"
                      value={formData.details?.hardwareType}
                      onChange={(e) => updateDetails({ hardwareType: e.target.value })}
                      placeholder="e.g., CCELL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coilType">Coil Type</Label>
                    <Input
                      id="coilType"
                      value={formData.details?.coilType}
                      onChange={(e) => updateDetails({ coilType: e.target.value })}
                      placeholder="e.g., Ceramic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batteryCompatibility">Battery Compatibility</Label>
                  <Input
                    id="batteryCompatibility"
                    value={formData.details?.batteryCompatibility?.join(", ")}
                    onChange={(e) => updateDetails({ batteryCompatibility: e.target.value.split(",").map(s => s.trim()) })}
                    placeholder="e.g., 510-thread, Proprietary"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compliance">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lab Tested</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.details?.labTested}
                        onCheckedChange={(checked) => updateDetails({ labTested: checked })}
                      />
                      <Label>{formData.details?.labTested ? "Yes" : "No"}</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Child Resistant</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.details?.childResistant}
                        onCheckedChange={(checked) => updateDetails({ childResistant: checked })}
                      />
                      <Label>{formData.details?.childResistant ? "Yes" : "No"}</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="labTestDate">Lab Test Date</Label>
                    <Input
                      id="labTestDate"
                      type="date"
                      value={formData.details?.labTestDate}
                      onChange={(e) => updateDetails({ labTestDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="labTestProvider">Lab Test Provider</Label>
                    <Input
                      id="labTestProvider"
                      value={formData.details?.labTestProvider}
                      onChange={(e) => updateDetails({ labTestProvider: e.target.value })}
                      placeholder="e.g., CannaLabs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coa">Certificate of Analysis URL</Label>
                  <Input
                    id="coa"
                    value={formData.details?.coa}
                    onChange={(e) => updateDetails({ coa: e.target.value })}
                    placeholder="URL to lab test results"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warningLabels">Warning Labels</Label>
                  <Textarea
                    id="warningLabels"
                    value={formData.details?.warningLabels?.join("\n")}
                    onChange={(e) => updateDetails({ warningLabels: e.target.value.split("\n").filter(Boolean) })}
                    placeholder="Enter each warning on a new line"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complianceNotes">Compliance Notes</Label>
                  <Textarea
                    id="complianceNotes"
                    value={formData.details?.complianceNotes}
                    onChange={(e) => updateDetails({ complianceNotes: e.target.value })}
                    placeholder="Additional compliance information..."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 