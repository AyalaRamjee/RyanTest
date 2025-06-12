import { setDefaults, fromAddress } from "react-geocode";

const apiKey = "AIzaSyCjsng3oAuRStusbUXu766ieSs0u1gMC0M";

if (apiKey) {
  setDefaults({
    key: apiKey,
    language: "en",
    region: "us", // Changed to "us" since you're likely in the US
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
      "Google Maps API Key not configured. Geocoding service will not work."
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
    console.log(`Attempting to geocode: "${addressString}"`);
    const response = await fromAddress(addressString);
    if (response.results && response.results.length > 0) {
        const { lat, lng } = response.results[0].geometry.location;
        console.log(`Successfully geocoded "${addressString}" to (${lat}, ${lng})`);
        return { lat, lng };
    } else {
        throw new Error(`No results found for the address: "${addressString}".`);
    }
  } catch (error: any) {
    console.error("Geocoding API error for address:", addressString, error);

    let errorMessage = `Failed to geocode address: "${addressString}".`;
    
    if (error.message) {
      if (error.message.includes("ZERO_RESULTS")) {
        errorMessage = `Could not find a location for the address: "${addressString}". Please verify the address details.`;
      } else if (error.message.includes("REQUEST_DENIED")) {
        errorMessage = "Geocoding request was denied. Please check your API key and ensure the Geocoding API is enabled in Google Cloud Console.";
      } else if (error.message.includes("OVER_QUERY_LIMIT")) {
        errorMessage = "Geocoding API quota exceeded. Please try again later.";
      } else if (error.message.includes("INVALID_REQUEST")) {
        errorMessage = `Invalid geocoding request for address: "${addressString}". Please check the address format.`;
      } else {
        errorMessage += ` Error: ${error.message}`;
      }
    } else {
      errorMessage += " Please check the console for more details.";
    }

    throw new Error(errorMessage);
  }
};