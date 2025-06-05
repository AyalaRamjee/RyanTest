
import type { Supplier } from '@/types/spendwise';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fingerprint, Building, FileText, MapPin, PlusCircle, Info, UploadCloud, Trash2, Globe2 } from "lucide-react"; // Added Globe2 for Country
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SupplierWorldMap from './supplier-world-map'; 

interface UpdateSuppliersTabProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  onAddSupplier: () => void;
  onOpenUploadDialog: () => void;
}

export default function UpdateSuppliersTab({ suppliers, setSuppliers, onAddSupplier, onOpenUploadDialog }: UpdateSuppliersTabProps) {

  const handleSupplierInputChange = (supplierId: string, field: keyof Supplier, value: string) => {
    setSuppliers(prevSuppliers =>
      prevSuppliers.map(s => {
        if (s.id === supplierId) {
          const updatedSupplier = { ...s, [field]: value };
          // If an address component is changed, reconstruct the full address
          // StreetAddress and StateOrProvince are no longer directly editable here, but might exist in the data
          if (['city', 'postalCode', 'country', 'streetAddress', 'stateOrProvince'].includes(field)) {
            const street = updatedSupplier.streetAddress || '';
            const city = updatedSupplier.city || '';
            const state = updatedSupplier.stateOrProvince || '';
            const postal = updatedSupplier.postalCode || '';
            const countryVal = updatedSupplier.country || '';
            
            let fullAddress = [street, city, state, postal, countryVal]
              .filter(Boolean) // Remove empty or null parts
              .join(', ');
            
            // Refine formatting: "City, State Postal, Country" or "Street, City, Postal, Country" etc.
            // This is a simple join; more complex logic might be needed for perfect grammar across all address formats.
            // For now, just joining with comma and space, and cleaning up multiple commas/spaces.
            if (state && postal) { // "City, State Postal"
                fullAddress = fullAddress.replace(`${city}, ${state}, ${postal}`, `${city}, ${state} ${postal}`);
            }
            updatedSupplier.address = fullAddress.replace(/ , |, $/g, '').replace(/, ,/g, ',').replace(/  +/g, ' ').trim();
          }
          return updatedSupplier;
        }
        return s;
      })
    );
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(prevSuppliers => prevSuppliers.filter(s => s.id !== supplierId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Building className="mr-2 h-5 w-5" />
          <CardTitle className="text-lg">Update Suppliers</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">Manage supplier information. Upload suppliers via CSV. Spend analysis by supplier requires part-supplier mappings.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-8 gap-6 text-xs">
        <div className="md:col-span-5 space-y-4">
          <section>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2 ml-auto"> 
                <Button onClick={onOpenUploadDialog} size="sm" variant="outline" className="text-xs">
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Upload Suppliers CSV
                </Button>
                <Button onClick={onAddSupplier} size="sm" className="text-xs">
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add New Supplier
                </Button>
              </div>
            </div>
            {suppliers.length === 0 ? (
              <p className="text-muted-foreground text-center py-3">No suppliers available. Generate, add, or upload some suppliers.</p>
            ) : (
              <ScrollArea className="max-h-80 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] text-xs"><Fingerprint className="inline-block mr-1 h-3.5 w-3.5" />ID</TableHead>
                      <TableHead className="min-w-[150px] text-xs"><Building className="inline-block mr-1 h-3.5 w-3.5" />Name</TableHead>
                      <TableHead className="min-w-[150px] text-xs"><FileText className="inline-block mr-1 h-3.5 w-3.5" />Description</TableHead>
                      <TableHead className="min-w-[100px] text-xs">City</TableHead>
                      <TableHead className="min-w-[80px] text-xs">Postal</TableHead>
                      <TableHead className="min-w-[100px] text-xs"><Globe2 className="inline-block mr-1 h-3.5 w-3.5" />Country</TableHead>
                      <TableHead className="min-w-[200px] text-xs"><MapPin className="inline-block mr-1 h-3.5 w-3.5" />Full Address</TableHead>
                      <TableHead className="text-center w-[50px] text-xs">Del</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-mono text-xs py-1.5">{supplier.supplierId}</TableCell>
                        <TableCell className="py-1.5">
                          <Input
                            type="text"
                            value={supplier.name}
                            onChange={(e) => handleSupplierInputChange(supplier.id, 'name', e.target.value)}
                            className="h-7 text-xs"
                          />
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Input
                            type="text"
                            value={supplier.description}
                            onChange={(e) => handleSupplierInputChange(supplier.id, 'description', e.target.value)}
                            className="h-7 text-xs"
                          />
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Input
                            type="text"
                            value={supplier.city}
                            onChange={(e) => handleSupplierInputChange(supplier.id, 'city', e.target.value)}
                            className="h-7 text-xs"
                          />
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Input
                            type="text"
                            value={supplier.postalCode}
                            onChange={(e) => handleSupplierInputChange(supplier.id, 'postalCode', e.target.value)}
                            className="h-7 text-xs"
                          />
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Input
                            type="text"
                            value={supplier.country}
                            onChange={(e) => handleSupplierInputChange(supplier.id, 'country', e.target.value)}
                            className="h-7 text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-xs py-1.5">{supplier.address}</TableCell>
                        <TableCell className="text-center py-1.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" aria-label="Delete Supplier" onClick={() => handleDeleteSupplier(supplier.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </section>
        </div>
        <div className="md:col-span-3 space-y-4">
          <SupplierWorldMap suppliers={suppliers} />
        </div>
      </CardContent>
    </Card>
  );
}
