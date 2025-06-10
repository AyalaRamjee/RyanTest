
"use client";

import type { Supplier } from '@/types/spendwise';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, MapPin, Info, AlertTriangle, Loader2 } from "lucide-react";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';

interface SupplierWorldMapProps {
  suppliers: Supplier[];
}

const mapContainerStyle = {
  height: '350px',
  width: '100%',
};

const defaultCenter = {
  lat: 20, // Default to a general world view
  lng: 0,
};

const googleMapsApiKeyFromEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const libraries: ("marker")[] = ['marker'];

export default function SupplierWorldMap({ suppliers }: SupplierWorldMapProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKeyFromEnv || "",
    libraries,
  });

  const validSuppliers = useMemo(() => {
    return suppliers.filter(
      (supplier) =>
        typeof supplier.latitude === 'number' &&
        typeof supplier.longitude === 'number'
    );
  }, [suppliers]);

  const center = useMemo(() => {
    if (validSuppliers.length === 0) {
      return defaultCenter;
    }
    const avgLat = validSuppliers.reduce((sum, s) => sum + s.latitude!, 0) / validSuppliers.length;
    const avgLng = validSuppliers.reduce((sum, s) => sum + s.longitude!, 0) / validSuppliers.length;
    return { lat: avgLat, lng: avgLng };
  }, [validSuppliers]);

  if (!googleMapsApiKeyFromEnv) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Globe className="mr-1.5 h-4 w-4" />
            Supplier Geographical Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-destructive/10 text-destructive flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <div>
                <p className="font-semibold">Google Maps API Key Missing</p>
                <p className="text-xs">
                Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file to enable the map.
                </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
     return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Globe className="mr-1.5 h-4 w-4" />
            Supplier Geographical Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-destructive/10 text-destructive flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <div>
                <p className="font-semibold">Error Loading Map</p>
                <p className="text-xs">
                Could not load Google Maps. Please check your API key and internet connection.
                </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Globe className="mr-1.5 h-4 w-4" />
            Supplier Geographical Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px] border rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading Map...</span>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Globe className="mr-1.5 h-4 w-4" />
            Supplier Geographical Overview
          </CardTitle>
           <p className="text-xs text-muted-foreground">
              Interactive map showing supplier locations. Click a marker for details.
            </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={validSuppliers.length > 0 ? 3 : 1.5}
            >
              {validSuppliers.map((supplier) => (
                <MarkerF
                  key={supplier.id}
                  position={{ lat: supplier.latitude!, lng: supplier.longitude! }}
                  onClick={() => {
                    setSelectedSupplier(supplier);
                  }}
                  title={supplier.name}
                />
              ))}

              {selectedSupplier && selectedSupplier.latitude && selectedSupplier.longitude && (
                <InfoWindowF
                  position={{ lat: selectedSupplier.latitude, lng: selectedSupplier.longitude }}
                  onCloseClick={() => {
                    setSelectedSupplier(null);
                  }}
                  options={{ pixelOffset: new window.google.maps.Size(0, -30) }}
                >
                  <div className="p-1 text-xs">
                    <h4 className="font-semibold mb-0.5">{selectedSupplier.name}</h4>
                    <p className="text-muted-foreground">{selectedSupplier.supplierId}</p>
                    <p>{selectedSupplier.city}, {selectedSupplier.country}</p>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          </div>
           {validSuppliers.length === 0 && suppliers.length > 0 && (
             <div className="text-center text-muted-foreground p-3 border border-dashed rounded-md min-h-[80px] flex flex-col items-center justify-center">
                <MapPin className="mx-auto h-5 w-5 mb-1 text-orange-500" />
                <p className="text-xs font-medium text-orange-600">No suppliers with coordinates.</p>
                <p className="text-xs">Ensure suppliers have latitude/longitude data to be shown on the map.</p>
            </div>
           )}
            {suppliers.length === 0 && (
             <div className="text-center text-muted-foreground p-3 border border-dashed rounded-md min-h-[80px] flex flex-col items-center justify-center">
                <Info className="mx-auto h-5 w-5 mb-1" />
                <p className="text-xs">No suppliers available to display on the map.</p>
            </div>
           )}
        </CardContent>
      </Card>
  );
}
