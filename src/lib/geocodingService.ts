
'use client';

import type { Supplier } from '@/types/spendwise';

const GOOGLE_GEOCODING_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface GeocodingResult {
  lat: number;
  lng: number;
}

export async function geocodeSupplierAddress(
  supplier: Pick<Supplier, 'streetAddress' | 'city' | 'stateOrProvince' | 'postalCode' | 'country'>
): Promise<GeocodingResult | null> {
  if (!GOOGLE_GEOCODING_API_KEY) {
    console.error('Google Geocoding API key is missing. Cannot geocode.');
    // It's better to throw an error or have the component handle this message
    // alert('Geocoding configuration error: API key missing.'); 
    return Promise.reject(new Error('Geocoding API key missing.'));
  }

  const addressParts = [
    supplier.streetAddress,
    supplier.city,
    supplier.stateOrProvince,
    supplier.postalCode,
    supplier.country,
  ].filter(Boolean).join(', ');

  if (!addressParts) {
     console.warn('Geocoding attempt with empty address parts.');
    return Promise.reject(new Error('Address is empty, cannot geocode.'));
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressParts)}&key=${GOOGLE_GEOCODING_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Google's API often returns 200 even for API errors, check data.status
      const errorData = await response.json().catch(() => ({ status: 'FETCH_ERROR', error_message: 'Failed to parse error response from Geocoding API.' }));
      console.error('Geocoding API request failed with status:', response.status, errorData);
      throw new Error(`Geocoding API request failed: ${errorData.error_message || response.statusText}`);
    }
    
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
        return { lat: location.lat, lng: location.lng };
      } else {
        console.error('Geocoding failed: Invalid location data received.', data.results[0]);
        throw new Error('Geocoding failed: Invalid location data in response.');
      }
    } else {
      console.error('Geocoding failed with API status:', data.status, data.error_message);
      // More specific errors can be thrown based on data.status
      // e.g., 'ZERO_RESULTS', 'REQUEST_DENIED', 'OVER_QUERY_LIMIT'
      throw new Error(`Geocoding failed: ${data.error_message || data.status}`);
    }
  } catch (error) {
    console.error('Error fetching or processing geocoding data:', error);
    // Re-throw the error so the calling component can handle it
    throw error;
  }
}
