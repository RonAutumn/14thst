import { NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, input, placeId } = body;

        if (!GOOGLE_MAPS_API_KEY) {
            console.error('Google Places API key is not configured in environment variables');
            throw new Error('Google Places API key is not configured');
        }

        switch (action) {
            case 'getSuggestions': {
                if (!input) {
                    return NextResponse.json({ error: 'Input is required' }, { status: 400 });
                }

                console.log('Fetching suggestions for:', input);

                const params = new URLSearchParams({
                    input,
                    key: GOOGLE_MAPS_API_KEY,
                    components: 'country:us',
                    types: 'address'
                });

                const url = `${AUTOCOMPLETE_URL}?${params}`;
                console.log('Calling Google Places API:', url);

                const response = await fetch(url);
                const data = await response.json();

                console.log('Google Places API response:', data);

                if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                    console.error('Google Places API error:', data);
                    throw new Error(`Failed to fetch address suggestions: ${data.status}`);
                }

                const suggestions = (data.predictions || []).map((prediction: any) => ({
                    placeId: prediction.place_id,
                    description: prediction.description,
                    mainText: prediction.structured_formatting.main_text,
                    secondaryText: prediction.structured_formatting.secondary_text
                }));

                return NextResponse.json(suggestions);
            }

            case 'getDetails': {
                if (!placeId) {
                    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
                }

                console.log('Fetching details for place ID:', placeId);

                const params = new URLSearchParams({
                    place_id: placeId,
                    key: GOOGLE_MAPS_API_KEY,
                    fields: 'address_components,formatted_address'
                });

                const url = `${PLACE_DETAILS_URL}?${params}`;
                console.log('Calling Google Places API:', url);

                const response = await fetch(url);
                const data = await response.json();

                console.log('Google Places API response:', data);

                if (data.status !== 'OK') {
                    console.error('Google Places API error:', data);
                    throw new Error(`Failed to fetch address details: ${data.status}`);
                }

                // Parse address components
                const addressComponents = data.result.address_components;
                const address = {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: ''
                };

                addressComponents.forEach((component: any) => {
                    const type = component.types[0];
                    switch (type) {
                        case 'street_number':
                            address.street = component.long_name;
                            break;
                        case 'route':
                            address.street += ' ' + component.long_name;
                            break;
                        case 'locality':
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

                // Clean up street address
                address.street = address.street.trim();
                console.log('Parsed address:', address);

                return NextResponse.json(address);
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Places API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process places request',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 