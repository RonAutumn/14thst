"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, MoreHorizontal, Plus, ImagePlus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import type { Product, Category, ProductDetails, ProductVariation } from "@/types/product"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProductVariations } from "@/components/admin/product-variations"

type SortField = 'name' | 'price' | 'stock'
type SortDirection = 'asc' | 'desc'

interface ProductFormData extends Omit<Product, 'id' | 'recordId'> {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string[];
  imageUrl: string;
  weightSize: string | number;
  isActive: boolean;
  variations?: ProductVariation[];
  status: string;
}

const defaultValues: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: [],
  imageUrl: '',
  weightSize: '',
  isActive: true,
  variations: [],
  status: 'active'
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)

  const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    price: z.number().min(0, "Price must be positive"),
    stock: z.number().int().min(0, "Stock must be positive").optional(),
    category: z.array(z.string()).min(1, "At least one category is required"),
    imageUrl: z.string()
      .refine(url => {
        if (!url) return true;
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      }, "Please enter a valid URL or leave empty"),
    weightSize: z.union([z.string(), z.number()]),
    isActive: z.boolean(),
    status: z.string(),
    variations: z.array(z.object({
      name: z.string(),
      price: z.number(),
      stock: z.number(),
      isActive: z.boolean()
    })).optional()
  })

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues
  })

  useEffect(() => {
    if (selectedProduct) {
      console.log('Setting form values from selected product:', selectedProduct);
      form.setValue('name', selectedProduct.name)
      form.setValue('description', selectedProduct.description || '')
      form.setValue('price', selectedProduct.price || 0)
      form.setValue('stock', selectedProduct.stock || 0)
      form.setValue('category', selectedProduct.category || [])
      form.setValue('imageUrl', selectedProduct.imageUrl || '')
      form.setValue('weightSize', selectedProduct.weightSize || '')
      form.setValue('isActive', selectedProduct.isActive)
      form.setValue('variations', selectedProduct.variations || [])
      form.setValue('status', selectedProduct.status)
      console.log('Form values after setting:', form.getValues());
    }
  }, [selectedProduct, form])

  useEffect(() => {
    Promise.all([
      fetchProducts(),
      fetchCategories()
    ])
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products`)
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(Array.isArray(data) ? data : data.products || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleEdit = (product: Product) => {
    console.log('Editing product:', product);
    if (!product.id) {
      toast.error('Cannot edit product: Missing record ID');
      return;
    }
    setSelectedProduct({
      ...product,
      recordId: product.id // Ensure recordId is set from the product's id
    });
    setIsEditDialogOpen(true);
  }

  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setIsViewDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedProduct(null)
    form.reset(defaultValues)
    setIsNewDialogOpen(true)
  }

  const handleSave = async (formData: ProductFormData) => {
    try {
      const endpoint = '/api/products'
      const method = selectedProduct ? 'PATCH' : 'POST'
      const isUpdate = !!selectedProduct
      
      console.log('Starting product save operation:', { method, isUpdate })
      console.log('Form data:', formData);
      
      if (isUpdate && !selectedProduct.recordId) {
        throw new Error('Record ID is missing for product update')
      }
      
      // Prepare request body
      const body = isUpdate 
        ? { 
            recordId: selectedProduct.recordId,
            ...formData,
            variations: formData.variations || [],
            status: formData.isActive ? 'active' : 'inactive',
            categoryNames: categories
              .filter(cat => formData.category.includes(cat.id))
              .map(cat => cat.name)
          }
        : { 
            ...formData,
            status: formData.isActive ? 'active' : 'inactive',
            categoryNames: categories
              .filter(cat => formData.category.includes(cat.id))
              .map(cat => cat.name),
            variations: formData.variations || []
          }

      console.log('Sending request with body:', JSON.stringify(body, null, 2))

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error response:', errorData)
        throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} product: ${errorData.error || response.statusText}`)
      }
      
      const savedProduct = await response.json()
      console.log('Server response:', savedProduct)
      
      // Close dialog and show success message
      setIsEditDialogOpen(false)
      setIsNewDialogOpen(false)
      
      // Reset form and selected product
      form.reset(defaultValues)
      setSelectedProduct(null)
      
      // Refresh the products list
      await fetchProducts()
      
      toast.success(`Product ${isUpdate ? 'updated' : 'created'} successfully`)
      
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save product')
    }
  }

  const updateProductStatus = async (productId: string, newStatus: boolean) => {
    try {
      setUpdatingStatus(productId)
      // Find the current product to get its data
      const currentProduct = products.find(p => p.id === productId)
      if (!currentProduct) throw new Error('Product not found')

      const response = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recordId: productId,
          name: currentProduct.name,
          description: currentProduct.description,
          price: currentProduct.price,
          weightSize: currentProduct.weightSize,
          stock: currentProduct.stock,
          imageUrl: currentProduct.imageUrl,
          status: newStatus ? 'active' : 'inactive',
          isActive: newStatus,
          variations: currentProduct.variations || [],
          category: currentProduct.category || []
        }),
      })

      if (!response.ok) throw new Error('Failed to update product status')
      
      const updatedProduct = await response.json()
      
      setProducts(products.map(p => 
        p.id === productId ? updatedProduct : p
      ))
      
      toast.success(`Product ${newStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating product status:', error)
      toast.error('Failed to update product status')
      fetchProducts()
    } finally {
      setUpdatingStatus(null)
    }
  }

  const sortProducts = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = (
      product.name?.toLowerCase().includes(searchLower) ||        
      product.description?.toLowerCase().includes(searchLower) ||
      product.category?.some(cat => cat.toLowerCase().includes(searchLower)) || false
    )
    return matchesSearch
  }) : []

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1
    switch (sortField) {
      case 'name':
        return ((a.name || '').localeCompare(b.name || '')) * modifier
      case 'price':
        return ((a.price || 0) - (b.price || 0)) * modifier
      case 'stock':
        return ((a.stock || 0) - (b.stock || 0)) * modifier
      default:
        return 0
    }
  })

  const renderProductForm = () => {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          <ScrollArea className="h-[80vh] pr-4">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value[0]}
                      onValueChange={(value) => field.onChange([value])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight/Size</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter image URL or leave empty"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            // Preview image if URL is valid
                            try {
                              new URL(e.target.value);
                              // Could add image preview here if needed
                            } catch {
                              // Invalid URL - that's okay, just don't show preview
                            }
                          }}
                        />
                      </FormControl>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          // Clear the image URL
                          field.onChange("");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {field.value && (
                      <div className="mt-2 relative aspect-square w-20 rounded-lg border overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={field.value}
                          alt="Product image preview"
                          className="object-cover"
                          onError={(e) => {
                            // Hide broken image
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <FormDescription>
                      Enter a valid image URL or leave empty. The image will be displayed in the store.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription>
                        Product will be visible in the store when active
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Variations</FormLabel>
                    <FormDescription>
                      Add variations for this product (e.g., different sizes, weights)
                    </FormDescription>
                    <FormControl>
                      <ProductVariations
                        variations={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details">
                <AccordionTrigger>Product Details</AccordionTrigger>
                <AccordionContent>
                  {form.watch('category')?.includes('flower') && (
                    <>
                      <FormField
                        control={form.control}
                        name="details.thc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>THC %</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="details.cbd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CBD %</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="details.strainType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Strain Type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select strain type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="indica">Indica</SelectItem>
                                <SelectItem value="sativa">Sativa</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {form.watch('category')?.includes('edible') && (
                    <>
                      <FormField
                        control={form.control}
                        name="details.ingredients"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ingredients</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value?.join(', ') || ''}
                                onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter ingredients separated by commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="details.allergens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allergens</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                value={field.value?.join(', ') || ''}
                                onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter allergens separated by commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="details.effects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effects</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value?.join(', ') || ''}
                            onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter effects separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="details.flavors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flavors</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value?.join(', ') || ''}
                            onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter flavors separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>

          <DialogFooter>
            <Button type="submit">
              {selectedProduct ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            Clear
          </Button>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortProducts('name')}
                  className="flex items-center gap-1"
                >
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortProducts('price')}
                  className="flex items-center gap-1"
                >
                  Price
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortProducts('stock')}
                  className="flex items-center gap-1"
                >
                  Stock
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {searchQuery ? 'No products found matching your search' : 'No products found'}
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.name}
                    {product.description && (
                      <div className="text-sm text-muted-foreground">
                        {product.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.categoryNames?.map((cat, index) => (
                      <Badge key={index} variant="secondary" className="mr-1">
                        {cat}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>${(product.price || 0).toFixed(2)}</TableCell>
                  <TableCell>{product.stock || 0}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={product.isActive ? "default" : "secondary"}
                      className={updatingStatus === product.id ? "opacity-50" : ""}
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={updatingStatus === product.id}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          Edit product
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleView(product)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => updateProductStatus(product.id, !product.isActive)}
                          className={product.isActive ? "text-destructive" : "text-primary"}
                        >
                          {product.isActive ? "Deactivate" : "Activate"} product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to the product here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {renderProductForm()}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <div className="text-sm">{selectedProduct?.name}</div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <div className="text-sm">{selectedProduct?.description || '-'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Price</Label>
                <div className="text-sm">${(selectedProduct?.price || 0).toFixed(2)}</div>
              </div>
              <div className="grid gap-2">
                <Label>Stock</Label>
                <div className="text-sm">{selectedProduct?.stock || 0}</div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Categories</Label>
              <div className="flex gap-1">
                {selectedProduct?.categoryNames?.map((cat, index) => (
                  <Badge key={index} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Weight/Size</Label>
              <div className="text-sm">{selectedProduct?.weightSize || '-'}</div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <div className="text-sm">
                <Badge variant={selectedProduct?.isActive ? "default" : "secondary"}>
                  {selectedProduct?.status}
                </Badge>
              </div>
            </div>
            {selectedProduct?.imageUrl && (
              <div className="grid gap-2">
                <Label>Image</Label>
                <div className="relative aspect-square w-40 rounded-lg border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {selectedProduct?.variations && selectedProduct.variations.length > 0 && (
              <div className="grid gap-2">
                <Label>Variations</Label>
                <div className="space-y-2">
                  {selectedProduct.variations.map((variation, index) => (
                    <div key={index} className="text-sm border rounded-md p-2">
                      <div className="font-medium">{variation.name}</div>
                      <div className="text-muted-foreground">
                        Price: ${(variation.price || 0).toFixed(2)}<br />
                        Stock: {variation.stock || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Product Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your store.
            </DialogDescription>
          </DialogHeader>
          {renderProductForm()}
        </DialogContent>
      </Dialog>
    </div>
  )
} 