
import type { Part } from '@/types/spendwise';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, ListOrdered, Package, DollarSign, BarChart3, PlusCircle } from "lucide-react";

interface UpdatePartsTabProps {
  parts: Part[];
  onAddPart: () => void;
  // onEditPart: (partId: string) => void; // Placeholder for future
}

export default function UpdatePartsTab({ parts, onAddPart }: UpdatePartsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Package className="mr-2 h-6 w-6" /> Update Parts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end">
          <Button onClick={onAddPart}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Part
          </Button>
        </div>
        {parts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No parts available. Generate or add some parts.</p>
        ) : (
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
              {parts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">{part.partNumber}</TableCell>
                  <TableCell>{part.name}</TableCell>
                  <TableCell className="text-right">${part.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{part.annualDemand.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="icon" aria-label="Edit Part" onClick={() => console.log('Edit part:', part.id)}>
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
