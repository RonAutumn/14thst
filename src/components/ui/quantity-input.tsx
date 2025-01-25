import React from 'react';
import { Input } from './input';
import { Button } from './button';
import { MinusIcon, PlusIcon } from 'lucide-react';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  value,
  onChange,
  max = 99,
  min = 1,
}) => {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center border rounded-md bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        className="w-12 text-center border-none focus-visible:ring-0"
        min={min}
        max={max}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
