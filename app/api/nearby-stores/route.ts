import { NextRequest, NextResponse } from 'next/server';

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '5000'; // Default 5km radius

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables');
      return NextResponse.json(
        { error: 'Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your .env.local file' },
        { status: 500 }
      );
    }

    // Search for grocery stores using Google Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=supermarket&key=${apiKey}`;

    console.log('Fetching from Google Places API...');
    const response = await fetch(placesUrl);
    const data: GooglePlacesResponse = await response.json();

    console.log('Google Places API response status:', data.status);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status);
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}. Please check your API key and ensure Places API is enabled.` },
        { status: 500 }
      );
    }

    // Calculate distance for each store
    const stores = data.results.map((place) => {
      const storeLat = place.geometry.location.lat;
      const storeLng = place.geometry.location.lng;
      
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        storeLat,
        storeLng
      );

      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        lat: storeLat,
        lng: storeLng,
        distance: distance, // in miles
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
      };
    });

    // Sort by distance
    stores.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return NextResponse.json({ stores });
  } catch (error: any) {
    console.error('Error fetching nearby stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nearby stores', details: error.message },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

