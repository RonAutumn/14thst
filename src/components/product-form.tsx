import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Product {
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string;
  variations?: { weight: number; price: number; flavor: string }[];
}

interface ProductFormProps {
  product: Product;
  setProduct: (product: Product) => void;
  onSubmit: () => void;
  onCancel: () => void;
  existingCategories: string[];
  isEditing?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  setProduct,
  onSubmit,
  onCancel,
  existingCategories,
}) => {
  const [localProduct, setLocalProduct] = useState<Product>({ ...product });
  const [showVariationDialog, setShowVariationDialog] = useState(false);
  const [newVariation, setNewVariation] = useState({
    weight: 0,
    price: 0,
    flavor: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'price') {
      setLocalProduct({
        ...localProduct,
        [name]: parseFloat(value) || 0
      });
    } else {
      setLocalProduct({
        ...localProduct,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localProduct.name || !localProduct.price || !localProduct.category) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setProduct(localProduct);
    onSubmit();
  };

  const handleAddVariation = () => {
    if (!newVariation.weight || !newVariation.price || !newVariation.flavor) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all variation fields",
        variant: "destructive"
      });
      return;
    }

    const variations = localProduct.variations || [];
    setLocalProduct({
      ...localProduct,
      variations: [...variations, { ...newVariation }]
    });

    setNewVariation({
      weight: 0,
      price: 0,
      flavor: ''
    });
    setShowVariationDialog(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          value={localProduct.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={localProduct.category}
          onValueChange={(value: string) => {
            setLocalProduct({
              ...localProduct,
              category: value
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {existingCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Base Price *</Label>
        <Input
          id="price"
          name="price"
          type="number"
          value={localProduct.price}
          onChange={handleInputChange}
          required
          min={0}
          step={0.01}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={localProduct.description}
          onChange={handleInputChange}
          className="h-32"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Variations</Label>
          <Button
            type="button"
            onClick={() => setShowVariationDialog(true)}
            variant="outline"
            size="sm"
          >
            Add Variation
          </Button>
        </div>

        <div className="space-y-2">
          {localProduct.variations?.map((variation, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <span>{variation.weight}g</span>
              <span>{variation.flavor}</span>
              <span>${variation.price.toFixed(2)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  const newVariations = [...(localProduct.variations || [])];
                  newVariations.splice(index, 1);
                  setLocalProduct({ ...localProduct, variations: newVariations });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showVariationDialog} onOpenChange={setShowVariationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Variation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (g)</Label>
              <Input
                id="weight"
                type="number"
                value={newVariation.weight}
                onChange={(e) => setNewVariation({ ...newVariation, weight: parseFloat(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variationPrice">Price</Label>
              <Input
                id="variationPrice"
                type="number"
                value={newVariation.price}
                onChange={(e) => setNewVariation({ ...newVariation, price: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flavor">Flavor</Label>
              <Input
                id="flavor"
                value={newVariation.flavor}
                onChange={(e) => setNewVariation({ ...newVariation, flavor: e.target.value })}
              />
            </div>
            <Button type="button" onClick={handleAddVariation} className="w-full">
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};
