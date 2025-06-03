
import type { Part, PartCommodityMapping } from '@/types/spendwise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, TrendingUp, List } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UploadPartCommodityTabProps {
  parts: Part[];
  partCommodityMappings: PartCommodityMapping[];
}

export default function UploadPartCommodityTab({ parts, partCommodityMappings }: UploadPartCommodityTabProps) {
   const getPartName = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    return part ? part.name : 'Unknown Part';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-6 w-6" /> Upload Part & Commodity Index</CardTitle>
        <CardDescription>Upload a CSV or Excel file associating parts with commodity index names. Generated mappings are shown below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="partCommodityFile" className="text-sm font-medium">Choose file</label>
          <Input id="partCommodityFile" type="file" className="file:text-sm file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-accent/20"/>
          <p className="text-xs text-muted-foreground">Supported formats: .csv, .xlsx</p>
        </div>
        <Button className="w-full sm:w-auto">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload File
        </Button>

        <div className="mt-6 pt-6 border-t">
          <h4 className="text-md font-semibold mb-2 flex items-center">
            <List className="mr-2 h-5 w-5" /> Current Part Commodity Mappings
            </h4>
          {partCommodityMappings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commodity mappings available. Generate data or upload a file.</p>
          ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Commodity Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partCommodityMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                     <TableCell>{getPartName(mapping.partId)} ({parts.find(p=>p.id === mapping.partId)?.partNumber})</TableCell>
                    <TableCell>{mapping.commodityName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
