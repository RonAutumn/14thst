import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface AddressSuggestion {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export function useAddressAutocomplete() {
    const { toast } = useToast();
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

    // Initialize services when Google Places is available
    const initializeServices = useCallback(() => {
        if (window.google?.maps?.places) {
            try {
                autocompleteService.current = new google.maps.places.AutocompleteService();
                // Create a dummy div for PlacesService (required but not used)
                const dummyElement = document.createElement('div');
                placesService.current = new google.maps.places.PlacesService(dummyElement);
                sessionToken.current = new google.maps.places.AutocompleteSessionToken();
                console.log('Google Places services initialized successfully');
            } catch (error) {
                console.error('Error initializing Google Places services:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to initialize address suggestions. Please try again.',
                    variant: 'destructive',
                });
            }
        }
    }, [toast]);

    useEffect(() => {
        // Try to initialize immediately if Google Places is already loaded
        initializeServices();

        // Set up a MutationObserver to watch for script injection
        const observer = new MutationObserver((mutations) => {
            if (window.google?.maps?.places && !autocompleteService.current) {
                initializeServices();
            }
        });

        observer.observe(document.head, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
        };
    }, [initializeServices]);

    const fetchSuggestions = useCallback(async (input: string) => {
        if (!input || input.length < 3) {
            setSuggestions([]);
            return;
        }

        if (!autocompleteService.current) {
            console.error('Autocomplete service not initialized');
            initializeServices();
            return;
        }

        try {
            setIsLoading(true);
            console.log('Fetching suggestions for input:', input);

            const request: google.maps.places.AutocompletionRequest = {
                input,
                componentRestrictions: { country: 'us' },
                types: ['address'],
                sessionToken: sessionToken.current
            };

            const response = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve, reject) => {
                autocompleteService.current?.getPlacePredictions(
                    request,
                    (predictions, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            resolve(predictions);
                        } else {
                            reject(new Error(`Places API error: ${status}`));
                        }
                    }
                );
            });

            const formattedSuggestions = response.map(prediction => ({
                placeId: prediction.place_id,
                description: prediction.description,
                mainText: prediction.structured_formatting.main_text,
                secondaryText: prediction.structured_formatting.secondary_text
            }));

            console.log('Received suggestions:', formattedSuggestions);
            setSuggestions(formattedSuggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to fetch address suggestions',
                variant: 'destructive',
            });
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [toast, initializeServices]);

    const getAddressDetails = useCallback(async (placeId: string) => {
        if (!placesService.current) {
            console.error('Places service not initialized');
            initializeServices();
            return null;
        }

        try {
            setIsLoading(true);
            console.log('Fetching details for place ID:', placeId);

            const result = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
                placesService.current?.getDetails(
                    {
                        placeId,
                        fields: ['address_components', 'formatted_address'],
                        sessionToken: sessionToken.current
                    },
                    (place, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                            resolve(place);
                        } else {
                            reject(new Error(`Places API error: ${status}`));
                        }
                    }
                );
            });

            const address: Address = {
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: ''
            };

            result.address_components?.forEach(component => {
                const type = component.types[0];
                switch (type) {
                    case 'street_number':
                        address.street = component.long_name;
                        break;
                    case 'route':
                        address.street += ' ' + component.long_name;
                        break;
                    case 'locality':
                    case 'sublocality':
                        address.city = component.long_name;
                        break;
                    case 'administrative_area_level_1':
                        address.state = component.short_name;
                        break;
                    case 'postal_code':
                        address.postalCode = component.long_name;
                        break;
                    case 'country':
                        address.country = component.short_name;
                        break;
                }
            });

            // If city is still empty, try to get it from other address components
            if (!address.city) {
                const cityComponent = result.address_components?.find(component =>
                    component.types.includes('locality') ||
                    component.types.includes('sublocality') ||
                    component.types.includes('neighborhood') ||
                    component.types.includes('sublocality_level_1')
                );
                if (cityComponent) {
                    address.city = cityComponent.long_name;
                }
            }

            address.street = address.street.trim();
            console.log('Parsed address:', address);
            setSelectedAddress(address);
            setSuggestions([]);
            return address;
        } catch (error) {
            console.error('Error fetching address details:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to fetch address details',
                variant: 'destructive',
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [toast, initializeServices]);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
    }, []);

    return {
        suggestions,
        isLoading,
        selectedAddress,
        fetchSuggestions,
        getAddressDetails,
        clearSuggestions
    };
} 