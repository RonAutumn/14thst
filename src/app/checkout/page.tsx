'use client';

import { useCart } from '@/lib/store/cart';
import type { CartItem as GlobalCartItem } from '@/types/cart';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { CalendarIcon, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { US_STATES, StateSelect } from '@/components/shipping/state-select';
import { AddressInput } from '@/components/ui/address-input';
import GooglePlacesScript from '@/components/ui/google-places-script';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Address } from '@/hooks/useAddressAutocomplete';
import RateSelector from '@/components/shipping/rate-selector';
import type { ShippingRate } from '@/types/shipping';
import { Badge } from '@/components/ui/badge';

type DeliveryMethod = 'delivery' | 'shipping' | 'pickup';

const NYC_BOROUGHS = [
  { value: 'Manhattan', label: 'Manhattan' },
  { value: 'Brooklyn', label: 'Brooklyn' },
  { value: 'Queens', label: 'Queens' }
] as const;

const BOROUGH_SETTINGS = {
  'Manhattan': { fee: 25, freeThreshold: 200 },
  'Brooklyn': { fee: 15, freeThreshold: 150 },
  'Queens': { fee: 15, freeThreshold: 150 }
} as const;

type Step = 'contact' | 'delivery' | 'payment';

// Update the time slot types to be more specific
type SaturdayTimeSlot = 
  | '11:00' | '11:15' | '11:30' | '11:45'
  | '12:00' | '12:15' | '12:30' | '12:45'
  | '13:00' | '13:15' | '13:30' | '13:45'
  | '14:00' | '14:15' | '14:30' | '14:45'
  | '15:00' | '15:15' | '15:30' | '15:45'
  | '16:00' | '16:15' | '16:30' | '16:45'
  | '17:00' | '17:15' | '17:30' | '17:45';

type RegularTimeSlot = 
  | '12:00' | '12:15' | '12:30' | '12:45'
  | '13:00' | '13:15' | '13:30' | '13:45'
  | '14:00' | '14:15' | '14:30' | '14:45'
  | '15:00' | '15:15' | '15:30' | '15:45'
  | '16:00' | '16:15' | '16:30' | '16:45'
  | '17:00' | '17:15' | '17:30' | '17:45'
  | '18:00';

type DeliveryTime = SaturdayTimeSlot | RegularTimeSlot;

// Update the Borough type to exclude null from the index signature
type NonNullBorough = 'Manhattan' | 'Brooklyn' | 'Queens';
type Borough = NonNullBorough | null;

type FormField = keyof CheckoutForm;
type FormErrors = Partial<Record<FormField, string>>;
type DeliveryDay = 1 | 2 | 3 | 4 | 5 | 6;

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  borough: Borough | null;
  address: string;
  zipCode: string;
  deliveryDate?: Date;
  deliveryTime: DeliveryTime;
  instructions: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingMethod: string;
  pickupDate?: Date;
  pickupTime: DeliveryTime;
  items: OrderItem[];
  total: number;
  deliveryFee: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  variation?: string;
  recordId: string;
}

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    borough?: Borough | null;
  } | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryDate?: string;
  deliveryTime?: DeliveryTime;
  pickupDate?: string;
  pickupTime?: DeliveryTime;
  selectedRate: ShippingRate | null;
}

// Add ShippingFormData interface
interface ShippingFormData {
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingMethod: string;
}

// Update the convertCartItem function to include recordId
const convertCartItem = (item: GlobalCartItem): OrderItem => ({
  id: item.id,
  name: item.name,
  quantity: item.quantity,
  price: item.price || 0,
  total: (item.price || 0) * item.quantity,
  variation: item.selectedVariation?.name,
  recordId: item.id
});

interface PaymentDetails {
  paymentId: string;
  payAmount: number;
  payAddress: string;
  paymentStatus: string;
  paymentExpirationTime: string;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
  billingAddress: string;
  billingZip: string;
  billingCountry: string;
}

// Update the borough settings type
type BoroughSettings = {
  fee: number;
  freeThreshold: number;
  sameDay: boolean;
  cutoffTime: number;
  deliveryDays: readonly DeliveryDay[];
  timeSlots: readonly RegularTimeSlot[];
  saturdayTimeSlots: readonly SaturdayTimeSlot[];
};

// Update the BOROUGH_DELIVERY_SETTINGS type
const BOROUGH_DELIVERY_SETTINGS: Record<NonNullBorough, BoroughSettings> = {
  'Manhattan': {
    ...BOROUGH_SETTINGS['Manhattan'],
    sameDay: true,
    cutoffTime: 18,
    deliveryDays: [2, 5] as const, // Tuesday (2) and Friday (5) only
    timeSlots: [
      '18:00', '19:00', '20:00', '21:00', '22:00'
    ] as const,
    saturdayTimeSlots: [
      '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
    ] as const
  },
  'Brooklyn': {
    ...BOROUGH_SETTINGS['Brooklyn'],
    sameDay: true,
    cutoffTime: 18,
    deliveryDays: [1, 2, 3, 4, 5, 6] as const,
    timeSlots: [
      '18:00', '19:00', '20:00', '21:00', '22:00'
    ] as const,
    saturdayTimeSlots: [
      '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
    ] as const
  },
  'Queens': {
    ...BOROUGH_SETTINGS['Queens'],
    sameDay: true,
    cutoffTime: 18,
    deliveryDays: [1, 2, 3, 4, 5, 6] as const,
    timeSlots: [
      '18:00', '19:00', '20:00', '21:00', '22:00'
    ] as const,
    saturdayTimeSlots: [
      '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
    ] as const
  }
} as const;

// Helper function for consistent currency formatting
const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [fee, setFee] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState<Step>('contact');
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [paymentPollingInterval, setPaymentPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Calculate subtotal from items
  const subtotal = items.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  
  // Calculate total weight for shipping
  const totalWeight = items.reduce((total, item) => total + ((item.weight || 1) * item.quantity), 0);

  // Update the item mapping in the checkout data
  const mapItemsForCheckout = (items: GlobalCartItem[]): OrderItem[] => items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price || 0,
    total: (item.price || 0) * item.quantity,
    variation: item.selectedVariation?.name,
    recordId: item.id
  }));

  // Initialize form data with mapped items
  const [formData, setFormData] = useState<CheckoutForm>(() => ({
    name: '',
    email: '',
    phone: '',
    borough: null,
    address: '',
    zipCode: '',
    deliveryTime: '18:00' as DeliveryTime,
    instructions: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingMethod: '',
    pickupTime: '18:00' as DeliveryTime,
    items: items.map(convertCartItem),
    total: subtotal,
    deliveryFee: 0
  }));

  // Update fee when delivery method or selected rate changes
  useEffect(() => {
    if (deliveryMethod === 'delivery' && formData.borough) {
      const deliveryFee = calculateDeliveryFee(formData.borough, subtotal);
      setFee(deliveryFee);
      // Update form data with new delivery fee
      setFormData(prev => ({
        ...prev,
        deliveryFee
      }));
    } else if (deliveryMethod === 'shipping' && selectedRate) {
      setFee(selectedRate.price);
      setFormData(prev => ({
        ...prev,
        deliveryFee: selectedRate.price
      }));
    } else {
      setFee(0);
      setFormData(prev => ({
        ...prev,
        deliveryFee: 0
      }));
    }
  }, [deliveryMethod, formData.borough, subtotal, selectedRate]);

  // Fetch shipping rates when ZIP code changes
  useEffect(() => {
    if (deliveryMethod === 'shipping' && 
        formData.shippingZip?.length === 5 && 
        formData.shippingState && 
        !selectedRate) {  // Only fetch if no rate is selected
      console.log('Fetching shipping rates for:', formData.shippingZip);
    }
  }, [formData.shippingZip, formData.shippingState, deliveryMethod]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for the field being changed
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle payment input changes
  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    // Format expiry date with slash
    else if (name === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .slice(0, 5);
    }

    // Update the form data directly
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const goToStep = (step: Step) => {
    const newErrors: Record<string, string> = {};

    // Validate contact info step
    if (currentStep === 'contact') {
      if (!formData.name?.trim()) newErrors.name = 'Name is required';
      if (!formData.email?.trim()) newErrors.email = 'Email is required';
      if (!formData.phone?.trim()) newErrors.phone = 'Phone is required';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    // Validate delivery step
    if (currentStep === 'delivery') {
      if (deliveryMethod === 'delivery') {
        if (!formData.borough) newErrors.borough = 'Borough is required';
        if (!formData.address?.trim()) newErrors.address = 'Address is required';
        if (!formData.zipCode?.trim()) newErrors.zipCode = 'ZIP Code is required';
        if (!formData.deliveryDate) newErrors.deliveryDate = 'Delivery date is required';
        if (!formData.deliveryTime) newErrors.deliveryTime = 'Delivery time is required';
      } else if (deliveryMethod === 'shipping') {
        if (!formData.shippingAddress?.trim()) newErrors.shippingAddress = 'Shipping address is required';
        if (!formData.shippingCity?.trim()) newErrors.shippingCity = 'City is required';
        if (!formData.shippingState?.trim()) newErrors.shippingState = 'State is required';
        if (!formData.shippingZip?.trim()) newErrors.shippingZip = 'ZIP Code is required';
        if (!selectedRate) newErrors.shippingMethod = 'Please select a shipping method';
      } else if (deliveryMethod === 'pickup') {
        if (!formData.pickupDate) newErrors.pickupDate = 'Pickup date is required';
        if (!formData.pickupTime?.trim()) newErrors.pickupTime = 'Pickup time is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setErrors({});
    setCurrentStep(step);
  };

  // Calculate delivery fee based on borough and latest settings
  const calculateDeliveryFee = (borough: Borough, subtotal: number): number => {
    if (!borough) return 0;
    const settings = BOROUGH_DELIVERY_SETTINGS[borough];
    if (!settings) return 0;
    return subtotal >= settings.freeThreshold ? 0 : settings.fee;
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: 'Address Copied',
        description: 'Payment address has been copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const startPaymentStatusPolling = (paymentId: string) => {
    // Clear any existing interval
    if (paymentPollingInterval) {
      clearInterval(paymentPollingInterval);
    }

    // Poll payment status every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/now-payments/status?paymentId=${paymentId}`);
        const data = await response.json();

        if (data.payment_status === 'finished' || data.payment_status === 'confirmed') {
          clearInterval(interval);
          clearCart();
          // Create order data from form data
          const orderData: OrderData = {
            orderId: data.order_id,
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            deliveryMethod,
            address: deliveryMethod === 'delivery' 
              ? {
                  street: formData.address,
                  city: 'New York',
                  state: 'NY',
                  zipCode: formData.zipCode,
                  borough: formData.borough
                }
              : deliveryMethod === 'shipping'
              ? {
                  street: formData.shippingAddress,
                  city: formData.shippingCity,
                  state: formData.shippingState,
                  zipCode: formData.shippingZip
                }
              : null,
            items: formData.items,
            subtotal,
            deliveryFee: fee,
            total: subtotal + fee,
            deliveryDate: formData.deliveryDate ? format(formData.deliveryDate, 'yyyy-MM-dd') : undefined,
            deliveryTime: formData.deliveryTime,
            pickupDate: formData.pickupDate ? format(formData.pickupDate, 'yyyy-MM-dd') : undefined,
            pickupTime: formData.pickupTime,
            selectedRate
          };
          router.push(`/order-confirmation?orderId=${data.order_id}&orderData=${encodeURIComponent(JSON.stringify(orderData))}`);
        } else if (data.payment_status === 'failed' || data.payment_status === 'expired') {
          clearInterval(interval);
          toast({
            title: 'Payment Failed',
            description: 'Your payment has failed or expired. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 30000);

    setPaymentPollingInterval(interval);
  };

  // Update the delivery method change handler
  const handleDeliveryMethodChange = (value: string) => {
    const method = value as DeliveryMethod;
    setDeliveryMethod(method);
    
    // Clear irrelevant fields when switching methods
    if (method === 'delivery') {
      setFormData(prev => {
        const currentBorough = prev.borough;
        const currentFee = currentBorough ? calculateDeliveryFee(currentBorough, subtotal) : 0;
        return {
          ...prev,
          shippingAddress: '',
          shippingCity: '',
          shippingState: '',
          shippingZip: '',
          shippingMethod: '',
          pickupDate: undefined,
          pickupTime: '18:00' as DeliveryTime,
          deliveryFee: currentFee
        };
      });
      // Don't reset selected rate if we're already in delivery mode
      if (method !== deliveryMethod) {
        setSelectedRate(null);
      }
    } else if (method === 'shipping') {
      setFormData(prev => ({
        ...prev,
        borough: null,
        address: '',
        zipCode: '',
        deliveryDate: undefined,
        deliveryTime: '18:00' as DeliveryTime,
        instructions: '',
        pickupDate: undefined,
        pickupTime: '18:00' as DeliveryTime,
        deliveryFee: 0
      }));
      setFee(0);
      setSelectedRate(null);
    } else {
      setFormData(prev => ({
        ...prev,
        borough: null,
        address: '',
        zipCode: '',
        deliveryDate: undefined,
        deliveryTime: '18:00' as DeliveryTime,
        instructions: '',
        shippingAddress: '',
        shippingCity: '',
        shippingState: '',
        shippingZip: '',
        shippingMethod: '',
        deliveryFee: 0
      }));
      setFee(0);
      setSelectedRate(null);
    }
    // Clear any existing errors
    setErrors({});
  };

  // Update the delivery time change handler
  const handleDeliveryTimeChange = (time: DeliveryTime) => {
    setFormData(prev => ({
      ...prev,
      deliveryTime: time
    }));
  };

  // Update the pickup time change handler
  const handlePickupTimeChange = (time: string) => {
    setFormData((prev: CheckoutForm) => {
      const updated: CheckoutForm = {
        ...prev,
        pickupTime: time as DeliveryTime
      };
      return updated;
    });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First validate contact info
      const contactErrors = validateContactInfo(formData);
      if (Object.keys(contactErrors).length > 0) {
        setErrors(contactErrors);
        setIsSubmitting(false);
        toast({
          title: "Missing Information",
          description: "Please fill in all contact information correctly",
          variant: "destructive",
        });
        return;
      }

      // Then validate delivery/shipping/pickup info based on method
      const validationErrors = validateForm(formData, deliveryMethod);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields correctly",
          variant: "destructive",
        });
        return;
      }

      // Convert cart items and prepare order data
      const convertedItems = items.map(convertCartItem);
      const orderTotal = subtotal + fee;
      const orderId = generateOrderId();

      // Prepare the shipping/delivery address based on delivery method
      const address = deliveryMethod === 'delivery' 
        ? {
            street: formData.address,
            city: 'New York',
            state: 'NY',
            zipCode: formData.zipCode,
            borough: formData.borough
          }
        : deliveryMethod === 'shipping'
        ? {
            street: formData.shippingAddress,
            city: formData.shippingCity,
            state: formData.shippingState,
            zipCode: formData.shippingZip
          }
        : null;

      // Prepare the checkout data
      const checkoutData: OrderData = {
        orderId,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        deliveryMethod,
        address,
        items: convertedItems,
        subtotal,
        deliveryFee: fee,
        total: orderTotal,
        deliveryDate: formData.deliveryDate ? format(formData.deliveryDate, 'yyyy-MM-dd') : undefined,
        deliveryTime: formData.deliveryTime,
        pickupDate: formData.pickupDate ? format(formData.pickupDate, 'yyyy-MM-dd') : undefined,
        pickupTime: formData.pickupTime,
        selectedRate
      };

      console.log('Submitting checkout data:', checkoutData);

      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Handle successful checkout by redirecting to payment
      if (data.redirectUrl) {
        // Clear cart before redirecting
        clearCart();
        // Redirect to payment page
        window.location.href = data.redirectUrl;
        return;
      }

      // If no redirect URL, something went wrong
      throw new Error('No payment URL received');
    } catch (error) {
      console.error('Order submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to submit order',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRateSelect = (rate: ShippingRate) => {
    setSelectedRate(rate);
    setFee(rate.price);
    setFormData(prev => ({
      ...prev,
      shippingMethod: rate.name
    }));
  };

  // Update the handleAddressSelect function to handle Borough type correctly
  const handleAddressSelect = (address: Address, type: 'delivery' | 'shipping') => {
    if (type === 'delivery') {
      // Extract borough from address components
      const borough = determineBorough(address);
      
      // Only update if we have a valid borough
      if (borough) {
        // Calculate delivery fee first
        const newFee = calculateDeliveryFee(borough, subtotal);
        
        // Update form data with address, borough and fee
        setFormData(prev => ({
          ...prev,
          address: address.street,
          zipCode: address.postalCode,
          borough: borough,
          deliveryFee: newFee
        }));
        
        // Update fee state
        setFee(newFee);
      } else {
        // If no valid borough, just update address and zip
        setFormData(prev => ({
          ...prev,
          address: address.street,
          zipCode: address.postalCode
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        shippingAddress: address.street,
        shippingCity: address.city,
        shippingState: address.state,
        shippingZip: address.postalCode
      }));
    }
  };

  // Helper function to determine borough from address
  const determineBorough = (address: Address): Borough => {
    // Check address components first
    const components = address.components || [];
    for (const component of components) {
      const value = component.long_name.toLowerCase();
      if (value.includes('manhattan')) return 'Manhattan';
      if (value.includes('brooklyn')) return 'Brooklyn';
      if (value.includes('queens')) return 'Queens';
    }

    // Fallback to checking full address string
    const fullAddress = address.street.toLowerCase();
    if (fullAddress.includes('manhattan') || (fullAddress.includes('new york') && !fullAddress.includes('brooklyn') && !fullAddress.includes('queens'))) {
      return 'Manhattan';
    } else if (fullAddress.includes('brooklyn')) {
      return 'Brooklyn';
    } else if (fullAddress.includes('queens')) {
      return 'Queens';
    }

    // Check ZIP code ranges
    const zip = parseInt(address.postalCode);
    if (zip) {
      if (zip >= 10001 && zip <= 10282) return 'Manhattan';
      if (zip >= 11201 && zip <= 11256) return 'Brooklyn';
      if (zip >= 11101 && zip <= 11697) return 'Queens';
    }

    return null;
  };

  // Update the borough selection handler
  const handleBoroughSelect = (value: string) => {
    const borough = value as Borough;
    const settings = BOROUGH_DELIVERY_SETTINGS[borough as keyof typeof BOROUGH_DELIVERY_SETTINGS];
    const newFee = calculateDeliveryFee(borough, subtotal);
    
    // Update cart store with delivery info
    useCart.getState().updateDeliveryInfo({
      fee: settings.fee,
      borough: borough,
      freeThreshold: settings.freeThreshold
    });
    
    // Update both fee and form data in one go
    setFee(newFee);
    setFormData(prev => ({
      ...prev,
      borough,
      deliveryFee: newFee
    }));

    // Force a re-render by updating the delivery method
    handleDeliveryMethodChange('delivery');
  };

  return (
    <div className="container mx-auto p-4">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[
            { id: 'contact', label: 'Contact Info' },
            { id: 'delivery', label: deliveryMethod === 'delivery' ? 'Delivery Details' : 'Shipping Details' },
            { id: 'payment', label: 'Payment' }
          ].map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  currentStep === step.id ? "bg-primary text-white" : "bg-gray-200"
                )}
              >
                {index + 1}
              </div>
              <div className="ml-2">{step.label}</div>
              {index < 2 && (
                <div className="h-1 w-16 bg-gray-200 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Button>
      </div>

      <GooglePlacesScript 
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''} 
        onLoad={() => {
          console.log('Google Places script loaded and initialized in checkout page');
          setIsGoogleScriptLoaded(true);
        }}
      />

      {/* Checkout Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={`${item.id}-${item.selectedVariation?.name}`} className="flex justify-between">
                <span>
                  {item.name} {item.selectedVariation && `(${item.selectedVariation.name})`} x {item.quantity}
                </span>
                <span>${((item.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {deliveryMethod === 'delivery' && formData.borough && (
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <span>Delivery Fee</span>
                    {subtotal >= BOROUGH_SETTINGS[formData.borough].freeThreshold ? (
                      <Badge variant="outline" className="text-green-600">
                        Free Delivery
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Free over ${BOROUGH_SETTINGS[formData.borough].freeThreshold}
                      </Badge>
                    )}
                  </div>
                  <span>{fee > 0 ? formatCurrency(fee) : 'Free'}</span>
                </div>
              )}
              {deliveryMethod === 'shipping' && selectedRate && (
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>{formatCurrency(selectedRate.price)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(subtotal + fee)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Steps */}
        <form onSubmit={handleOrderSubmit} className="space-y-6">
          {currentStep === 'contact' && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-foreground">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={cn(
                          "text-foreground",
                          errors.name && "border-red-500"
                        )}
                        required
                        aria-describedby={errors.name ? 'name-error' : undefined}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500" id="name-error">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-foreground">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={cn(
                          "text-foreground",
                          errors.email && "border-red-500"
                        )}
                        required
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500" id="email-error">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-foreground">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(123) 456-7890"
                        className={cn(
                          "text-foreground",
                          errors.phone && "border-red-500"
                        )}
                        required
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-500" id="phone-error">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      type="button"
                      onClick={() => {
                        const contactErrors = validateContactInfo(formData);
                        if (Object.keys(contactErrors).length > 0) {
                          setErrors(contactErrors);
                          toast({
                            title: "Missing Information",
                            description: "Please fill in all required contact information",
                            variant: "destructive",
                          });
                          return;
                        }
                        setErrors({});
                        goToStep('delivery');
                      }}
                      className="w-full"
                    >
                      Continue to Delivery
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'delivery' && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs 
                  defaultValue="delivery" 
                  onValueChange={(value) => {
                    handleDeliveryMethodChange(value);
                  }}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="delivery">Local Delivery</TabsTrigger>
                    <TabsTrigger value="shipping">Shipping</TabsTrigger>
                    <TabsTrigger value="pickup">Pickup</TabsTrigger>
                  </TabsList>
                  <TabsContent value="delivery" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="borough">Borough</Label>
                      <Select
                        value={formData.borough || undefined}
                        onValueChange={handleBoroughSelect}
                      >
                        <SelectTrigger className={errors.borough ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select borough" />
                        </SelectTrigger>
                        <SelectContent>
                          {NYC_BOROUGHS.map(borough => {
                            const settings = BOROUGH_DELIVERY_SETTINGS[borough.value as keyof typeof BOROUGH_DELIVERY_SETTINGS];
                            return (
                              <SelectItem key={borough.value} value={borough.value}>
                                {borough.label} - ${settings.fee} delivery (Free over ${settings.freeThreshold})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {errors.borough && <p className="text-sm text-red-500">{errors.borough}</p>}
                      {formData.borough && subtotal >= BOROUGH_DELIVERY_SETTINGS[formData.borough as keyof typeof BOROUGH_DELIVERY_SETTINGS]?.freeThreshold && (
                        <p className="text-sm text-green-500">
                          Free delivery available! Your order qualifies for free delivery in {formData.borough}.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Delivery Date</Label>
                      <div className="grid gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.deliveryDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.deliveryDate ? format(formData.deliveryDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.deliveryDate}
                              onSelect={(date) => setFormData(prev => ({ ...prev, deliveryDate: date }))}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                
                                // First check if date is in the past
                                if (date < today) return true;

                                // Then check if delivery is available for the selected borough and day
                                if (formData.borough) {
                                  const settings = BOROUGH_DELIVERY_SETTINGS[formData.borough];
                                  const day = date.getDay() as DeliveryDay;
                                  return !settings.deliveryDays.includes(day);
                                }
                                
                                return true; // Disable all dates if no borough selected
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {errors.deliveryDate && <p className="text-sm text-red-500">{errors.deliveryDate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Delivery Address</Label>
                      <AddressInput
                        onAddressSelect={(address) => handleAddressSelect(address, 'delivery')}
                        defaultValue={formData.address}
                        className={errors.address ? 'border-red-500' : ''}
                        required
                        name="address"
                        placeholder="Enter delivery address"
                        disabled={!isGoogleScriptLoaded}
                      />
                      {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        placeholder="12345"
                        className={errors.zipCode ? 'border-red-500' : ''}
                        readOnly={Boolean(formData.zipCode)}
                      />
                      {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                      <Input
                        id="instructions"
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleInputChange}
                        placeholder="Apartment number, gate code, etc."
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="shipping" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingAddress">Street Address</Label>
                      <AddressInput
                        onAddressSelect={(address) => handleAddressSelect(address, 'shipping')}
                        defaultValue={formData.shippingAddress}
                        className={errors.shippingAddress ? 'border-red-500' : ''}
                        required
                        name="shippingAddress"
                        placeholder="Enter shipping address"
                        disabled={!isGoogleScriptLoaded}
                      />
                      {errors.shippingAddress && <p className="text-sm text-red-500">{errors.shippingAddress}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shippingCity">City</Label>
                        <Input
                          id="shippingCity"
                          name="shippingCity"
                          value={formData.shippingCity}
                          onChange={handleInputChange}
                          required
                          className={errors.shippingCity ? 'border-red-500' : ''}
                          readOnly
                        />
                      </div>

                      <StateSelect
                        value={formData.shippingState}
                        onChange={(value) => setFormData(prev => ({ ...prev, shippingState: value }))}
                        hasError={Boolean(errors.shippingState)}
                        readOnly={true}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shippingZip">ZIP Code</Label>
                      <Input
                        id="shippingZip"
                        name="shippingZip"
                        value={formData.shippingZip}
                        onChange={handleInputChange}
                        required
                        placeholder="12345"
                        className={errors.shippingZip ? 'border-red-500' : ''}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Shipping Options</Label>
                      {formData.shippingAddress && formData.shippingZip && (
                        <RateSelector
                          address={{
                            street1: formData.shippingAddress,
                            city: formData.shippingCity,
                            state: formData.shippingState,
                            zipCode: formData.shippingZip
                          }}
                          items={items}
                          onRateSelect={handleRateSelect}
                          customerName={formData.name}
                          email={formData.email}
                        />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="pickup" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pickup Date</Label>
                      <div className="grid gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.pickupDate && "text-muted-foreground",
                                errors.pickupDate && "border-red-500"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.pickupDate ? (
                                format(formData.pickupDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.pickupDate}
                              onSelect={(date) => {
                                setFormData(prev => ({ ...prev, pickupDate: date }));
                              }}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                
                                // Only prevent dates in the past
                                return date < today;
                              }}
                              modifiers={{
                                pickup: (date) => {
                                  const day = date.getDay();
                                  return [3, 5, 6].includes(day);
                                }
                              }}
                              modifiersStyles={{
                                pickup: {
                                  fontWeight: 'bold',
                                  backgroundColor: 'var(--primary)',
                                  color: 'white',
                                  borderRadius: '4px'
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {errors.pickupDate && <p className="text-sm text-red-500">{errors.pickupDate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pickupTime">Pickup Time</Label>
                      <Select
                        value={formData.pickupTime}
                        onValueChange={(value) => {
                          handlePickupTimeChange(value);
                        }}
                      >
                        <SelectTrigger className={errors.pickupTime ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select pickup time" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.pickupDate?.getDay() === 6 ? (
                            // Saturday time slots (11 AM - 5 PM)
                            <>
                              {Array.from({ length: 25 }, (_, i) => {
                                const hour = Math.floor(i / 4) + 11;
                                const minute = (i % 4) * 15;
                                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                const hour12 = hour > 12 ? hour - 12 : hour;
                                const period = hour >= 12 ? 'PM' : 'AM';
                                const displayTime = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
                                return (
                                  <SelectItem key={time} value={time}>
                                    {displayTime}
                                  </SelectItem>
                                );
                              })}
                            </>
                          ) : (
                            // Regular time slots (12 PM - 6 PM)
                            <>
                              {Array.from({ length: 25 }, (_, i) => {
                                const hour = Math.floor(i / 4) + 12;
                                const minute = (i % 4) * 15;
                                if (hour > 18 || (hour === 18 && minute > 0)) return null;
                                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                const hour12 = hour > 12 ? hour - 12 : hour;
                                const period = 'PM';
                                const displayTime = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
                                return (
                                  <SelectItem key={time} value={time}>
                                    {displayTime}
                                  </SelectItem>
                                );
                              })}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {errors.pickupTime && <p className="text-sm text-red-500">{errors.pickupTime}</p>}
                    </div>
                  </TabsContent>
                </Tabs>

                {formData.deliveryDate && formData.borough && (
                  <div className="space-y-2">
                    <Label>Delivery Time</Label>
                    <Select
                      value={formData.deliveryTime}
                      onValueChange={(value) => {
                        handleDeliveryTimeChange(value as DeliveryTime);
                      }}
                    >
                      <SelectTrigger className={errors.deliveryTime ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select delivery time" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.deliveryDate.getDay() === 6 
                          ? BOROUGH_DELIVERY_SETTINGS[formData.borough].saturdayTimeSlots.map(time => (
                              <SelectItem key={time} value={time}>
                                {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                              </SelectItem>
                            ))
                          : BOROUGH_DELIVERY_SETTINGS[formData.borough].timeSlots.map(time => (
                              <SelectItem key={time} value={time}>
                                {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                    {errors.deliveryTime && <p className="text-sm text-red-500">{errors.deliveryTime}</p>}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => goToStep('contact')}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button 
                  type="button"
                  onClick={() => goToStep('payment')}
                  disabled={isSubmitting || (deliveryMethod === 'shipping' && !selectedRate)}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {currentStep === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Please review your order details before continuing to payment.
                  </div>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h3 className="font-medium">Order Details:</h3>
                    <div className="text-sm text-muted-foreground">
                      <p>Name: {formData.name}</p>
                      <p>Email: {formData.email}</p>
                      <p>Phone: {formData.phone}</p>
                      {deliveryMethod === 'delivery' ? (
                        <>
                          <p>Delivery Address: {formData.address}</p>
                          <p>Borough: {formData.borough}</p>
                          <p>ZIP Code: {formData.zipCode}</p>
                          {formData.instructions && <p>Instructions: {formData.instructions}</p>}
                        </>
                      ) : deliveryMethod === 'shipping' ? (
                        <>
                          <p>Shipping Address: {formData.shippingAddress}</p>
                          <p>City: {formData.shippingCity}</p>
                          <p>State: {formData.shippingState}</p>
                          <p>ZIP Code: {formData.shippingZip}</p>
                          {selectedRate && <p>Shipping Method: {selectedRate.name}</p>}
                        </>
                      ) : (
                        <>
                          <p>Pickup Date: {formData.pickupDate ? format(formData.pickupDate, "PPP") : ''}</p>
                          <p>Pickup Time: {formData.pickupTime}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => goToStep('delivery')}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}

function validateForm(formData: CheckoutForm, deliveryMethod: DeliveryMethod): FormErrors {
  const errors: FormErrors = {};

  // Always validate contact info
  if (!formData.name?.trim()) errors.name = 'Name is required';
  if (!formData.email?.trim()) errors.email = 'Email is required';
  if (!formData.phone?.trim()) errors.phone = 'Phone is required';

  if (deliveryMethod === 'delivery') {
    if (!formData.borough) errors.borough = 'Please select a borough';
    if (!formData.address?.trim()) errors.address = 'Please enter your delivery address';
    if (!formData.zipCode?.trim()) errors.zipCode = 'Please enter your ZIP code';
    if (!formData.deliveryDate) errors.deliveryDate = 'Please select a delivery date';
    if (!formData.deliveryTime) errors.deliveryTime = 'Please select a delivery time';
    
    // Validate delivery time based on borough settings
    if (formData.borough && formData.deliveryTime) {
      const settings = BOROUGH_DELIVERY_SETTINGS[formData.borough];
      const isSaturday = formData.deliveryDate?.getDay() === 6;
      
      const validateTimeSlot = () => {
        if (isSaturday) {
          return settings.saturdayTimeSlots.includes(formData.deliveryTime as SaturdayTimeSlot);
        }
        return settings.timeSlots.includes(formData.deliveryTime as RegularTimeSlot);
      };

      if (!validateTimeSlot()) {
        errors.deliveryTime = isSaturday
          ? 'Saturday delivery times are between 11 AM and 4 PM'
          : 'Please select a valid delivery time for your borough';
      }

      // Check same-day delivery cutoff
      if (formData.deliveryDate?.toDateString() === new Date().toDateString()) {
        const now = new Date();
        if (!settings.sameDay || now.getHours() >= settings.cutoffTime) {
          errors.deliveryTime = `Same-day delivery orders must be placed before ${settings.cutoffTime}:00 EST`;
        }
      }
    }
  } else if (deliveryMethod === 'shipping') {
    if (!formData.shippingAddress?.trim()) errors.shippingAddress = 'Please enter your shipping address';
    if (!formData.shippingCity?.trim()) errors.shippingCity = 'Please enter your city';
    if (!formData.shippingState?.trim()) errors.shippingState = 'Please select your state';
    if (!formData.shippingZip?.trim()) errors.shippingZip = 'Please enter your ZIP code';
    if (!formData.shippingMethod) errors.shippingMethod = 'Please select a shipping method';
  } else if (deliveryMethod === 'pickup') {
    if (!formData.pickupDate) errors.pickupDate = 'Please select a pickup date';
    if (!formData.pickupTime) errors.pickupTime = 'Please select a pickup time';
    
    // Validate pickup time based on the day
    if (formData.pickupDate) {
      const day = formData.pickupDate.getDay();
      const time = formData.pickupTime;
      if (day === 6) { // Saturday
        if (time < '11:00' || time > '17:00') {
          errors.pickupTime = 'Saturday pickup hours are 11 AM to 5 PM';
        }
      } else { // Wednesday and Friday
        if (time < '12:00' || time > '18:00') {
          errors.pickupTime = 'Pickup hours are 12 PM to 6 PM';
        }
      }
    }
  }

  return errors;
}

function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${random}`;
}

function validateContactInfo(formData: CheckoutForm): FormErrors {
  const errors: FormErrors = {};
  
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  } else if (!/^[a-zA-Z\s-']+$/.test(formData.name)) {
    errors.name = 'Please enter a valid name';
  }
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!formData.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/.test(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  return errors;
}

function validateShippingAddress(formData: ShippingFormData): FormErrors {
  const errors: FormErrors = {};
  
  // Address validation
  if (!formData.shippingAddress?.trim()) {
    errors.shippingAddress = 'Shipping address is required';
  } else if (formData.shippingAddress.length < 5) {
    errors.shippingAddress = 'Please enter a valid street address';
  }
  
  // City validation
  if (!formData.shippingCity?.trim()) {
    errors.shippingCity = 'City is required';
  } else if (!/^[a-zA-Z\s-]+$/.test(formData.shippingCity)) {
    errors.shippingCity = 'Please enter a valid city name';
  }
  
  // State validation
  if (!formData.shippingState?.trim()) {
    errors.shippingState = 'State is required';
  } else if (!/^[A-Z]{2}$/.test(formData.shippingState.toUpperCase())) {
    errors.shippingState = 'Please enter a valid 2-letter state code';
  }
  
  // ZIP code validation
  if (!formData.shippingZip?.trim()) {
    errors.shippingZip = 'ZIP code is required';
  } else if (!/^\d{5}(-\d{4})?$/.test(formData.shippingZip)) {
    errors.shippingZip = 'Please enter a valid ZIP code (12345 or 12345-6789)';
  }

  return errors;
}

// Update the Calendar component's modifiers
const isDeliveryDayAvailable = (date: Date, borough: Borough | null) => {
  if (!borough) return false;
  const settings = BOROUGH_DELIVERY_SETTINGS[borough];
  const day = date.getDay() as DeliveryDay;
  return settings.deliveryDays.includes(day);
};
