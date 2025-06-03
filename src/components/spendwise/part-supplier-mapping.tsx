import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Building, ArrowRightLeft, GripVertical } from "lucide-react";

interface Part {
  id: string;
  partNumber: string;
  name: string;
}

interface Supplier {
  id: string;
  supplierId: string;
  name: string;
}

const sampleParts: Part[] = [
  { id: "p1", partNumber: "P001", name: "Heavy Duty Bolt" },
  { id: "p2", partNumber: "P002", name: "Stainless Steel Nut" },
  { id: "p3", partNumber: "P003", name: "Titanium Screw" },
];

const sampleSuppliers: Supplier[] = [
  { id: "s1", supplierId: "S001", name: "Acme Corp" },
  { id: "s2", supplierId: "S002", name: "Bolt World Inc." },
  { id: "s3", supplierId: "S003", name: "Precision Parts Ltd." },
];


export default function PartSupplierMappingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><ArrowRightLeft className="mr-2 h-6 w-6" /> Source & Mix Parts with Suppliers</CardTitle>
        <CardDescription>Drag parts and suppliers to create sourcing relationships.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6">
        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center"><Package className="mr-2 h-5 w-5 text-primary" /> Available Parts</h3>
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg min-h-[200px]">
            {sampleParts.map((part) => (
              <Card key={part.id} className="p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-sm text-muted-foreground">{part.partNumber}</p>
                  </div>
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3 flex items-center"><Building className="mr-2 h-5 w-5 text-primary" /> Available Suppliers</h3>
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg min-h-[200px]">
            {sampleSuppliers.map((supplier) => (
              <Card key={supplier.id} className="p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">{supplier.supplierId}</p>
                  </div>
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </section>
        
        <section className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-3 flex items-center"><ArrowRightLeft className="mr-2 h-5 w-5 text-accent" /> Mapped Combinations</h3>
          <div className="p-3 border-2 border-dashed border-accent/50 rounded-lg min-h-[200px] flex items-center justify-center bg-accent/10">
            <p className="text-center text-accent-foreground/70">Drag a Part and a Supplier here to map them.</p>
          </div>
          {/* Placeholder for actual mapped items */}
          <div className="mt-4 space-y-2">
            {/* Example of a mapped item display */}
            {/* <Card className="p-3 bg-green-50 border-green-200">
              <p><span className="font-semibold">P001 (Heavy Duty Bolt)</span> sourced from <span className="font-semibold">S001 (Acme Corp)</span></p>
              <p className="text-sm text-muted-foreground">Mix: 100%</p>
            </Card> */}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
