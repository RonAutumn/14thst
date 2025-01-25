'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useAddressAutocomplete, type Address } from '@/hooks/useAddressAutocomplete';
import { cn } from '@/lib/utils';
import debounce from 'lodash/debounce';

interface AddressInputProps {
    onAddressSelect: (address: Address) => void;
    defaultValue?: string;
    className?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    name?: string;
}

export function AddressInput({
    onAddressSelect,
    defaultValue = '',
    className,
    placeholder = 'Enter your address',
    required = false,
    disabled = false,
    name
}: AddressInputProps) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const {
        suggestions,
        isLoading,
        fetchSuggestions,
        getAddressDetails,
        clearSuggestions
    } = useAddressAutocomplete();

    // Update input value when defaultValue changes
    useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
        // Handle clicks outside of the component
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Create a debounced version of fetchSuggestions
    const debouncedFetchSuggestions = useRef(
        debounce((value: string) => {
            fetchSuggestions(value);
        }, 300)
    ).current;

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedFetchSuggestions.cancel();
        };
    }, [debouncedFetchSuggestions]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputValue(value);
        
        if (value.length >= 3 && !disabled) {
            setIsOpen(true);
            debouncedFetchSuggestions(value);
        } else {
            setIsOpen(false);
            clearSuggestions();
        }
    };

    const handleSuggestionClick = async (placeId: string, description: string) => {
        setInputValue(description);
        setIsOpen(false);
        const address = await getAddressDetails(placeId);
        if (address) {
            onAddressSelect(address);
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => !disabled && inputValue.length >= 3 && setIsOpen(true)}
                className={cn('w-full', className)}
                placeholder={disabled ? 'Loading address suggestions...' : placeholder}
                required={required}
                name={name}
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-controls="address-suggestions"
                autoComplete="off"
            />
            {isOpen && !disabled && (suggestions.length > 0 || isLoading) && (
                <ul
                    id="address-suggestions"
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                    {isLoading ? (
                        <li className="px-4 py-2 text-sm text-gray-500">Loading suggestions...</li>
                    ) : (
                        suggestions.map((suggestion) => (
                            <li
                                key={suggestion.placeId}
                                className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleSuggestionClick(suggestion.placeId, suggestion.description)}
                            >
                                <div className="font-medium">{suggestion.mainText}</div>
                                <div className="text-gray-500">{suggestion.secondaryText}</div>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
} 