
import { setDefaults, fromAddress } from "react-geocode";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (apiKey) {
  setDefaults({
    key: apiKey,
    language: "en",
    region: "es", // Optional: set a region to bias results, e.g., "es" for Spain
  });
} else {
  console.warn(
    "Google Maps API key is not configured. Geocoding service will not work."
  );
}

interface Address {
  streetAddress?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
}

export const geocodeSupplierAddress = async (address: Address): Promise<{ lat: number; lng: number }> => {
  if (!apiKey) {
    throw new Error(
      "Google Maps API Key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."
    );
  }

  const { streetAddress, city, stateOrProvince, postalCode, country } = address;

  // Construct a robust address string, filtering out empty parts
  const addressString = [
    streetAddress,
    city,
    stateOrProvince,
    postalCode,
    country,
  ]
    .filter((part) => part && part.trim() !== "")
    .join(", ");

  if (!addressString) {
    throw new Error(
      "Address is empty or invalid. Please provide at least one address component."
    );
  }

  try {
    const response = await fromAddress(addressString);
    if (response.results && response.results.length > 0) {
        const { lat, lng } = response.results[0].geometry.location;
        return { lat, lng };
    } else {
        throw new Error(`No results found for the address: "${addressString}".`);
    }
  } catch (error: any) {
    console.error("Geocoding API error:", error);

    let errorMessage = "Failed to geocode address. Check the console for more details.";
    if (error.message && error.message.includes("ZERO_RESULTS")) { // More robust check for zero results
        errorMessage = `Could not find a location for the address: "${addressString}". Please verify the address details.`;
    } else if (error.message && error.message.includes("REQUEST_DENIED")) { // More robust check for request denied
        errorMessage = "Geocoding request was denied. Is the API key valid and enabled for the Geocoding API?";
    } else if (error.message) {
        errorMessage = error.message; // Use the error message from the library if available
    }

    throw new Error(errorMessage);
  }
};
