
"use client";

import type { Supplier } from '@/types/spendwise';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, MapPin, Info } from "lucide-react";
import Image from 'next/image';

interface SupplierWorldMapProps {
  suppliers: Supplier[];
}

interface CountryCount {
  name: string;
  count: number;
}

export default function SupplierWorldMap({ suppliers }: SupplierWorldMapProps) {
  const supplierCountries: CountryCount[] = useMemo(() => {
    const counts: Record<string, number> = {};
    suppliers.forEach(supplier => {
      if (supplier.country) {
        counts[supplier.country] = (counts[supplier.country] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [suppliers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <Globe className="mr-1.5 h-4 w-4" />
          Supplier Geographical Overview
        </CardTitle>
         <p className="text-xs text-muted-foreground">
            Visual representation of supplier locations and distribution by country.
          </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg overflow-hidden shadow-sm bg-muted/20 flex flex-col items-center justify-center p-4 aspect-video relative min-h-[200px]">
          <Image
            src="https://placehold.co/600x300.png"
            alt="World Map Placeholder"
            layout="fill"
            objectFit="cover"
            data-ai-hint="world map"
            className="opacity-30"
          />
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <Globe className="h-16 w-16 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              World Map Visualization
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              (Dots for each supplier require geocoding & a mapping library)
            </p>
          </div>
        </div>

        {supplierCountries.length > 0 ? (
          <ScrollArea className="h-[150px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs"><MapPin className="inline-block mr-1 h-3 w-3"/>Country</TableHead>
                  <TableHead className="text-xs text-right"># Suppliers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierCountries.map((country) => (
                  <TableRow key={country.name}>
                    <TableCell className="font-medium text-xs py-1.5">{country.name}</TableCell>
                    <TableCell className="text-xs text-right py-1.5">{country.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="text-center text-muted-foreground p-3 border border-dashed rounded-md min-h-[80px] flex flex-col items-center justify-center">
              <Info className="mx-auto h-5 w-5 mb-1" />
              <p className="text-xs">No supplier country data available.</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          This is a simplified overview. Accurate map plotting requires integration with geocoding services and a mapping library.
        </p>
      </CardContent>
    </Card>
  );
}
