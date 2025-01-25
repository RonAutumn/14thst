import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductVariation } from '@/types/product';

interface FlavorSelectorProps {
  variations: ProductVariation[];
  selectedFlavor: string | null;
  onSelect: (flavor: string) => void;
}

export const FlavorSelector: React.FC<FlavorSelectorProps> = ({
  variations,
  selectedFlavor,
  onSelect,
}) => {
  return (
    <div className="mb-4">
      <Select
        value={selectedFlavor || undefined}
        onValueChange={onSelect}
      >
        <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700 hover:bg-gray-700 transition-colors duration-200">
          <SelectValue placeholder="Select flavor" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {variations.map((variation) => (
            <SelectItem
              key={variation.name}
              value={variation.name || `${variation.type} - ${variation.price}`}
              className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
            >
              {variation.name || `${variation.type} - $${variation.price}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};