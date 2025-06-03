
import type { Supplier } from '@/types/spendwise';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, Fingerprint, Building, FileText, MapPin, PlusCircle } from "lucide-react";

interface UpdateSuppliersTabProps {
  suppliers: Supplier[];
  onAddSupplier: () => void;
  // onEditSupplier: (supplierId: string) => void; // Placeholder for future
}

export default function UpdateSuppliersTab({ suppliers, onAddSupplier }: UpdateSuppliersTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Building className="mr-2 h-6 w-6" /> Update Suppliers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button onClick={onAddSupplier}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier
          </Button>
        </div>
        {suppliers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No suppliers available. Generate or add some suppliers.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]"><Fingerprint className="inline-block mr-1 h-4 w-4" />Supplier ID</TableHead>
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
        )}
      </CardContent>
    </Card>
  );
}
