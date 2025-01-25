'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface StateSelectProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  readOnly?: boolean;
}

export const US_STATES = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'DC', label: 'District of Columbia' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
].sort((a, b) => a.label.localeCompare(b.label));

export function StateSelect({
  value,
  onChange,
  hasError,
  readOnly
}: StateSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="state">State</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={readOnly}
      >
        <SelectTrigger 
          id="state"
          className={cn(
            hasError ? 'border-red-500' : '',
            !value && 'text-muted-foreground'
          )}
        >
          <SelectValue placeholder="Select state" />
        </SelectTrigger>
        <SelectContent 
          position="popper" 
          side="bottom" 
          align="start"
          className="w-[calc(100vw-2rem)] sm:w-[200px] max-h-[50vh]"
        >
          <ScrollArea className="w-full h-auto max-h-[40vh]">
            {US_STATES.map(state => (
              <SelectItem 
                key={state.value} 
                value={state.value}
                className="cursor-pointer hover:bg-accent py-2"
              >
                {state.label}
              </SelectItem>
            ))}
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
} 