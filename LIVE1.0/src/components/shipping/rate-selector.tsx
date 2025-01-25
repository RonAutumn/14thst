import { useState, useEffect } from 'react';
import { RadioGroup } from '@headlessui/react';
import { ShippingRate } from '@/types/shipping';

interface RateSelectorProps {
    address: {
        street1: string;
        city: string;
        state: string;
        zipCode: string;
    };
    items: any[];
    onRateSelect: (rate: ShippingRate) => void;
    customerName?: string;
    email?: string;
}

interface CarrierRates {
    usps: ShippingRate[];
    ups: ShippingRate[];
}

function formatDeliveryEstimate(days: number | null): string {
    if (!days) return 'Estimated delivery time unavailable';
    
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + days);
    
    if (days === 1) {
        return `Next day delivery - Estimated ${deliveryDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        })}`;
    }
    
    return `Estimated delivery: ${deliveryDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    })} (${days} days)`;
}

function formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
}

export default function RateSelector({ address, items, onRateSelect, customerName, email }: RateSelectorProps) {
    const [rates, setRates] = useState<CarrierRates | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

    useEffect(() => {
        const fetchRates = async () => {
            if (!address.street1 || !address.city || !address.state || !address.zipCode) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/shipping/rates', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        address: address.street1,
                        city: address.city,
                        state: address.state,
                        zipCode: address.zipCode,
                        items,
                        customerName,
                        email,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch shipping rates');
                }

                setRates(data.rates);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch shipping rates');
                console.error('Error fetching rates:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
    }, [address, items, customerName, email]);

    const handleRateSelect = (rate: ShippingRate) => {
        setSelectedRate(rate);
        onRateSelect(rate);
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 p-4 rounded-md bg-red-50">
                {error}
            </div>
        );
    }

    if (!rates || (!rates.usps.length && !rates.ups.length)) {
        return (
            <div className="text-gray-500">
                No shipping rates available for this address.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* USPS Rates */}
            {rates.usps.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">USPS Shipping Options</h3>
                    <RadioGroup value={selectedRate} onChange={handleRateSelect}>
                        <div className="space-y-2">
                            {rates.usps.map((rate) => (
                                <RadioGroup.Option
                                    key={rate.id}
                                    value={rate}
                                    className={({ checked }) =>
                                        `${checked ? 'bg-indigo-50 border-indigo-500' : 'border-gray-200 bg-white/10'}
                                        relative border rounded-lg p-4 flex cursor-pointer focus:outline-none`
                                    }
                                >
                                    {({ checked }) => (
                                        <>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <RadioGroup.Label as="p" className={`font-medium ${checked ? 'text-gray-900' : 'text-white'}`}>
                                                        {rate.name}
                                                    </RadioGroup.Label>
                                                    <span className={`font-medium ${checked ? 'text-gray-900' : 'text-white'}`}>
                                                        {formatPrice(rate.price)}
                                                    </span>
                                                </div>
                                                <RadioGroup.Description as="p" className={`${checked ? 'text-gray-500' : 'text-gray-300'}`}>
                                                    {formatDeliveryEstimate(rate.estimatedDays)}
                                                </RadioGroup.Description>
                                            </div>
                                            {checked && (
                                                <div className="text-indigo-600">
                                                    <CheckIcon className="h-5 w-5" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </RadioGroup.Option>
                            ))}
                        </div>
                    </RadioGroup>
                </div>
            )}

            {/* UPS Rates */}
            {rates.ups.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-white mb-4">UPS Shipping Options</h3>
                    <RadioGroup value={selectedRate} onChange={handleRateSelect}>
                        <div className="space-y-2">
                            {rates.ups.map((rate) => (
                                <RadioGroup.Option
                                    key={rate.id}
                                    value={rate}
                                    className={({ checked }) =>
                                        `${checked ? 'bg-indigo-50 border-indigo-500' : 'border-gray-200 bg-white/10'}
                                        relative border rounded-lg p-4 flex cursor-pointer focus:outline-none`
                                    }
                                >
                                    {({ checked }) => (
                                        <>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <RadioGroup.Label as="p" className={`font-medium ${checked ? 'text-gray-900' : 'text-white'}`}>
                                                        {rate.name}
                                                    </RadioGroup.Label>
                                                    <span className={`font-medium ${checked ? 'text-gray-900' : 'text-white'}`}>
                                                        {formatPrice(rate.price)}
                                                    </span>
                                                </div>
                                                <RadioGroup.Description as="p" className={`${checked ? 'text-gray-500' : 'text-gray-300'}`}>
                                                    {formatDeliveryEstimate(rate.estimatedDays)}
                                                </RadioGroup.Description>
                                            </div>
                                            {checked && (
                                                <div className="text-indigo-600">
                                                    <CheckIcon className="h-5 w-5" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </RadioGroup.Option>
                            ))}
                        </div>
                    </RadioGroup>
                </div>
            )}
        </div>
    );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <circle cx={12} cy={12} r={12} fill="currentColor" opacity="0.2" />
            <path
                d="M7 13l3 3 7-7"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
} 