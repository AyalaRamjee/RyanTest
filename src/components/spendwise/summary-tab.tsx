
import type { Supplier } from '@/types/spendwise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Building, Info } from "lucide-react";

interface SummaryTabProps {
  suppliers: Supplier[];
}

export default function SummaryTab({ suppliers }: SummaryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Globe className="mr-2 h-6 w-6" /> Supplier Geo-Distribution</CardTitle>
        <CardDescription>Global supplier locations and summary list. Dynamic map requires further integration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-3">Supplier Locations Map</h3>
          <div className="border rounded-lg overflow-hidden shadow-sm bg-muted/30 flex flex-col items-center justify-center p-4 aspect-[16/7]">
            <Globe className="h-24 w-24 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground font-medium">
              Dynamic Map Placeholder
            </p>
            <p className="text-xs text-muted-foreground mt-2 text-center max-w-md">
              To display suppliers on an interactive map (e.g., Google Maps), you would typically need to:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside mt-1 text-center">
              <li>Install a mapping library (e.g., <code>@react-google-maps/api</code>).</li>
              <li>Obtain and configure a Google Maps API key.</li>
              <li>Implement geocoding to convert addresses to coordinates if not provided by AI.</li>
            </ul>
             <p className="text-xs text-muted-foreground mt-2 text-center">
              This functionality requires additional setup beyond current capabilities.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Building className="mr-2 h-5 w-5 text-primary" /> Supplier List & Locations
          </h3>
          {suppliers.length === 0 ? (
            <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md min-h-[100px] flex flex-col items-center justify-center">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No suppliers available.</p>
                <p className="text-xs">Generate or add suppliers to see their locations listed here.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono text-xs">{supplier.supplierId}</TableCell>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.address}</TableCell>
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
