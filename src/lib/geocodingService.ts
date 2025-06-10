
import Geocode from "react-geocode";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (apiKey) {
  Geocode.setApiKey(apiKey);
  Geocode.setLanguage("en");
  Geocode.setLocationType("ROOFTOP");
} else {
  console.warn("Google Maps API key is not configured. Geocoding service will not work.");
}

interface Address {
    streetAddress?: string;
    city?: string;
    stateOrProvince?: string;
    postalCode?: string;
    country?: string;
}

export const geocodeSupplierAddress = async (address: Address) => {
    if (!apiKey) {
      throw new Error("Google Maps API Key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
    }

    const { streetAddress, city, stateOrProvince, postalCode, country } = address;
    
    // Construct a robust address string, filtering out empty parts
    const addressString = [streetAddress, city, stateOrProvince, postalCode, country]
      .filter(part => part && part.trim() !== '')
      .join(', ');

    if (!addressString) {
        throw new Error("Address is empty or invalid. Please provide at least one address component.");
    }
    
    try {
        const response = await Geocode.fromAddress(addressString);
        const { lat, lng } = response.results[0].geometry.location;
        return { lat, lng };
    } catch (error) {
        console.error("Geocoding API error:", error);
        
        let errorMessage = "Failed to geocode address. Check the console for more details.";
        if ((error as any).code === "ZERO_RESULTS") {
            errorMessage = `Could not find a location for the address: "${addressString}". Please verify the address details.`;
        } else if ((error as any).code === "REQUEST_DENIED") {
            errorMessage = "Geocoding request was denied. Is the API key valid and enabled for the Geocoding API?";
        }

        throw new Error(errorMessage);
    }
};
