import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onQuantityChange,
}) => {
  const handleQuantityChange = (delta: number) => {
    onQuantityChange(Math.max(1, quantity + delta));
  };

  return (
    <div className="flex items-center space-x-2 mb-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleQuantityChange(-1)}
        disabled={quantity <= 1}
        className="w-8 h-8 p-0 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 transition-colors duration-200"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center text-white">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleQuantityChange(1)}
        disabled={quantity >= 99}
        className="w-8 h-8 p-0 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 transition-colors duration-200"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};