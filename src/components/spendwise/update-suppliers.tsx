import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, Fingerprint, Building, FileText, MapPin } from "lucide-react";

interface Supplier {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  address: string;
}

const sampleSuppliers: Supplier[] = [
  { id: "1", supplierId: "S001", name: "Acme Corp", description: "General Industrial Supplies", address: "123 Innovation Drive, Tech City" },
  { id: "2", supplierId: "S002", name: "Bolt World Inc.", description: "Specialized Fasteners & Bolts", address: "456 Metalwork Ave, Industry Park" },
  { id: "3", supplierId: "S003", name: "Precision Parts Ltd.", description: "High-Quality Custom Components", address: "789 Craftsmanship Rd, Makers Ville" },
];

export default function UpdateSuppliersTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Building className="mr-2 h-6 w-6" /> Update Suppliers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button>Add New Supplier</Button>
        </div>
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
            {sampleSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.supplierId}</TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.description}</TableCell>
                <TableCell>{supplier.address}</TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="icon" aria-label="Edit Supplier">
                    <FileEdit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
