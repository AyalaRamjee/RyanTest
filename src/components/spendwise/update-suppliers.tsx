
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
        <CardTitle className="flex items-center"><Building className="mr-2 h-6 w-6" /> Update Suppliers</CardTitle>
        <CardDescription>Manage supplier information. Spend analysis by supplier requires part-supplier mappings.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">Supplier Management</h3>
            <div className="mb-4 flex justify-end">
              <Button onClick={onAddSupplier}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier
              </Button>
            </div>
            {suppliers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No suppliers available. Generate or add some suppliers.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]"><Fingerprint className="inline-block mr-1 h-4 w-4" />Supplier ID</TableHead>
                      <TableHead><Building className="inline-block mr-1 h-4 w-4" />Supplier Name</TableHead>
                      <TableHead><FileText className="inline-block mr-1 h-4 w-4" />Description</TableHead>
                      <TableHead><MapPin className="inline-block mr-1 h-4 w-4" />Address</TableHead>
                      <TableHead className="text-center w-[100px]">Actions</TableHead>
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
                          <Button variant="outline" size="icon" aria-label="Edit Supplier" onClick={() => console.log('Edit supplier:', supplier.id)}>
                            <FileEdit className="h-4 w-4" />
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
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUpIcon className="mr-2 h-5 w-5" />
                Spend by Supplier
              </CardTitle>
              <CardDescription>Aggregated spend per supplier.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px] flex items-center justify-center">
              <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
                <Info className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Spend by supplier will be available once parts are mapped to suppliers in the "Source & Mix" tab.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
