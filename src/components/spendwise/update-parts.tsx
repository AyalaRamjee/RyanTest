import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, ListOrdered, Package, DollarSign, BarChart3 } from "lucide-react";

interface Part {
  id: string;
  partNumber: string;
  name: string;
  price: number;
  annualDemand: number;
}

const sampleParts: Part[] = [
  { id: "1", partNumber: "P001", name: "Heavy Duty Bolt", price: 0.75, annualDemand: 15000 },
  { id: "2", partNumber: "P002", name: "Stainless Steel Nut", price: 0.30, annualDemand: 25000 },
  { id: "3", partNumber: "P003", name: "Titanium Screw", price: 1.20, annualDemand: 8000 },
  { id: "4", partNumber: "P004", name: "Rubber Gasket", price: 0.15, annualDemand: 100000 },
];

export default function UpdatePartsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Package className="mr-2 h-6 w-6" /> Update Parts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button>Add New Part</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]"><ListOrdered className="inline-block mr-1 h-4 w-4" />Part #</TableHead>
              <TableHead><Package className="inline-block mr-1 h-4 w-4" />Part Name</TableHead>
              <TableHead className="text-right"><DollarSign className="inline-block mr-1 h-4 w-4" />Price</TableHead>
              <TableHead className="text-right"><BarChart3 className="inline-block mr-1 h-4 w-4" />Est. Annual Demand</TableHead>
              <TableHead className="text-center w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleParts.map((part) => (
              <TableRow key={part.id}>
                <TableCell className="font-medium">{part.partNumber}</TableCell>
                <TableCell>{part.name}</TableCell>
                <TableCell className="text-right">${part.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">{part.annualDemand.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <Button variant="outline" size="icon" aria-label="Edit Part">
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
