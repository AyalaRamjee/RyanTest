
import type { Supplier } from '@/types/spendwise';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, Fingerprint, Building, FileText, MapPin, PlusCircle, TrendingUp as TrendingUpIcon, Info } from "lucide-react";

interface UpdateSuppliersTabProps {
  suppliers: Supplier[];
  onAddSupplier: () => void;
}

export default function UpdateSuppliersTab({ suppliers, onAddSupplier }: UpdateSuppliersTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><Building className="mr-2 h-5 w-5" /> Update Suppliers</CardTitle>
        <CardDescription>Manage supplier information. Spend analysis by supplier requires part-supplier mappings.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-8 gap-6 text-xs">
        <div className="md:col-span-5 space-y-4">
          <section>
            <h3 className="text-base font-semibold mb-2">Supplier Management</h3>
            <div className="mb-3 flex justify-end">
              <Button onClick={onAddSupplier} size="sm" className="text-xs">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add New Supplier
              </Button>
            </div>
            {suppliers.length === 0 ? (
              <p className="text-muted-foreground text-center py-3">No suppliers available. Generate or add some suppliers.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px] text-xs"><Fingerprint className="inline-block mr-1 h-3.5 w-3.5" />Supplier ID</TableHead>
                      <TableHead className="text-xs"><Building className="inline-block mr-1 h-3.5 w-3.5" />Supplier Name</TableHead>
                      <TableHead className="text-xs"><FileText className="inline-block mr-1 h-3.5 w-3.5" />Description</TableHead>
                      <TableHead className="text-xs"><MapPin className="inline-block mr-1 h-3.5 w-3.5" />Address</TableHead>
                      <TableHead className="text-center w-[80px] text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.supplierId}</TableCell>
                        <TableCell>{supplier.name}</TableCell>
                        <TableCell>{supplier.description}</TableCell>
                        <TableCell>{supplier.address}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Edit Supplier" onClick={() => console.log('Edit supplier:', supplier.id)}>
                            <FileEdit className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <TrendingUpIcon className="mr-1.5 h-4 w-4" />
                Spend by Supplier
              </CardTitle>
              <CardDescription className="text-xs">Aggregated spend per supplier.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-h-[180px] flex items-center justify-center">
              <div className="text-center text-muted-foreground p-3 border border-dashed rounded-md">
                <Info className="mx-auto h-6 w-6 mb-1.5" />
                <p className="text-xs">Spend by supplier will be available once parts are mapped to suppliers in the "Source & Mix" tab.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
