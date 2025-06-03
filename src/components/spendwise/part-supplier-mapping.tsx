
import type { Part, Supplier, PartSupplierAssociation } from '@/types/spendwise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Building, ArrowRightLeft, GripVertical, UploadCloud, Info, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PartSupplierMappingTabProps {
  parts: Part[];
  suppliers: Supplier[];
  partSupplierAssociations: PartSupplierAssociation[];
  setPartSupplierAssociations: React.Dispatch<React.SetStateAction<PartSupplierAssociation[]>>;
  onOpenUploadDialog: () => void;
}

export default function PartSupplierMappingTab({ 
  parts, 
  suppliers, 
  partSupplierAssociations, 
  setPartSupplierAssociations, 
  onOpenUploadDialog 
}: PartSupplierMappingTabProps) {

  const getPartDisplay = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    return part ? `${part.name} (${part.partNumber})` : 'Unknown Part';
  };

  const getSupplierDisplay = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? `${supplier.name} (${supplier.supplierId})` : 'Unknown Supplier';
  };

  const handleRemoveAssociation = (associationId: string) => {
    setPartSupplierAssociations(prev => prev.filter(a => a.id !== associationId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <ArrowRightLeft className="mr-2 h-6 w-6" />
          <CardTitle className="text-lg">Source & Mix Parts with Suppliers</CardTitle>
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">View and manage part-supplier sourcing relationships. Upload associations via CSV. Drag-and-drop functionality is a visual guide; use CSV for bulk mapping.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6 text-xs">
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center"><Package className="mr-2 h-5 w-5 text-primary" /> Available Parts</h3>
          <ScrollArea className="h-[300px] border rounded-md p-2 bg-muted/30">
            <div className="space-y-2">
              {parts.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No parts available.</p>}
              {parts.map((part) => (
                <Card key={part.id} className="p-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">{part.name}</p>
                      <p className="text-xs text-muted-foreground">{part.partNumber}</p>
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center"><Building className="mr-2 h-5 w-5 text-primary" /> Available Suppliers</h3>
          <ScrollArea className="h-[300px] border rounded-md p-2 bg-muted/30">
            <div className="space-y-2">
              {suppliers.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No suppliers available.</p>}
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="p-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-xs">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground">{supplier.supplierId}</p>
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </section>
        
        <section className="md:col-span-1">
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="text-lg font-semibold flex items-center"><ArrowRightLeft className="mr-2 h-5 w-5 text-accent" /> Mapped Combinations</h3>
             <Button onClick={onOpenUploadDialog} size="sm" variant="outline" className="text-xs">
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Upload CSV
              </Button>
          </div>
          {partSupplierAssociations.length === 0 ? (
            <div className="p-3 border-2 border-dashed border-accent/50 rounded-lg min-h-[200px] flex items-center justify-center bg-accent/10">
              <p className="text-center text-accent-foreground/70">No associations. Upload a CSV or drag parts/suppliers (visual only).</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Part</TableHead>
                    <TableHead className="text-xs">Supplier</TableHead>
                    <TableHead className="text-xs w-[50px] text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partSupplierAssociations.map((assoc) => (
                    <TableRow key={assoc.id}>
                      <TableCell className="text-xs">{getPartDisplay(assoc.partId)}</TableCell>
                      <TableCell className="text-xs">{getSupplierDisplay(assoc.supplierId)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveAssociation(assoc.id)} aria-label="Remove Association">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
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
