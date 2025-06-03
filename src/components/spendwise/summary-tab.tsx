
import type { Supplier } from '@/types/spendwise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Building } from "lucide-react";
import Image from 'next/image';

interface SummaryTabProps {
  suppliers: Supplier[];
}

export default function SummaryTab({ suppliers }: SummaryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Globe className="mr-2 h-6 w-6" /> Supplier Location Overview</CardTitle>
        <CardDescription>Map visualization of global supplier locations and a summary list.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-3">Supplier Locations Map (Placeholder)</h3>
          <div className="border rounded-lg overflow-hidden shadow-sm bg-muted/30 flex items-center justify-center p-4 aspect-[16/7]">
            {/* 
              Using Next.js Image component for optimized placeholder.
              A real map integration (e.g., Leaflet, Google Maps, react-simple-maps)
              would require additional setup and potentially API keys.
            */}
            <Image 
              src="https://placehold.co/1200x525.png" 
              alt="Placeholder map of supplier locations" 
              width={1200} 
              height={525}
              className="object-cover rounded-md"
              data-ai-hint="world map"
            />
          </div>
           <p className="text-xs text-muted-foreground mt-2 text-center">
              This is a placeholder image. A dynamic map would require further integration.
            </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Building className="mr-2 h-5 w-5 text-primary" /> Supplier List & Locations
          </h3>
          {suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No suppliers available. Generate data to see locations.</p>
          ) : (
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.city}</TableCell>
                      <TableCell>{supplier.country}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{supplier.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
