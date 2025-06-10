
'use client';

import type { Supplier } from '@/types/spendwise';

const GOOGLE_GEOCODING_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface GeocodingResult {
  lat: number;
  lng: number;
}

export async function geocodeSupplierAddress(
  supplier: Pick<Supplier, 'streetAddress' | 'city' | 'stateOrProvince' | 'postalCode' | 'country'>
): Promise<GeocodingResult> { // Changed to non-nullable return, errors will be thrown
  if (!GOOGLE_GEOCODING_API_KEY) {
    console.error('Google Geocoding API key is missing. Cannot geocode.');
    throw new Error('Geocoding API key missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.');
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
    throw new Error('Address is empty, cannot geocode.');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressParts)}&key=${GOOGLE_GEOCODING_API_KEY}`;

  try {
    const response = await fetch(url);
    // Google's API often returns 200 even for API errors, check data.status
    const data = await response.json();

    if (!response.ok) {
      console.error('Geocoding API request failed with status:', response.status, data);
      throw new Error(`Geocoding API request failed: ${data.error_message || response.statusText || 'Unknown error'}`);
    }
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
        return { lat: location.lat, lng: location.lng };
      } else {
        console.error('Geocoding failed: Invalid location data received.', data.results[0]);
        throw new Error('Geocoding failed: Invalid location data in API response.');
      }
    } else {
      console.error('Geocoding failed with API status:', data.status, data.error_message);
      // More specific errors can be thrown based on data.status
      // e.g., 'ZERO_RESULTS', 'REQUEST_DENIED', 'OVER_QUERY_LIMIT'
      let userMessage = `Geocoding failed: ${data.status}.`;
      if (data.error_message) {
        userMessage += ` Details: ${data.error_message}`;
      }
      if (data.status === 'REQUEST_DENIED') {
        userMessage += ' Please ensure the Geocoding API is enabled for your key in Google Cloud Console.';
      }
      if (data.status === 'ZERO_RESULTS') {
        userMessage = `Could not find coordinates for the address: ${addressParts.substring(0,100)}...`;
      }
      throw new Error(userMessage);
    }
  } catch (error) {
    console.error('Error fetching or processing geocoding data:', error);
    // Re-throw the error so the calling component can handle it
    // If it's already an Error object, throw it, otherwise wrap it.
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred during geocoding.');
    }
  }
}

