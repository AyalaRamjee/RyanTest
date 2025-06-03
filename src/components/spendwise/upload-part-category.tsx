
import type { Part, PartCategoryMapping } from '@/types/spendwise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FolderTree, List } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UploadPartCategoryTabProps {
  parts: Part[];
  partCategoryMappings: PartCategoryMapping[];
}

export default function UploadPartCategoryTab({ parts, partCategoryMappings }: UploadPartCategoryTabProps) {
  const getPartName = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    return part ? part.name : 'Unknown Part';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><FolderTree className="mr-2 h-6 w-6" /> Upload Part & Category Data</CardTitle>
        <CardDescription>Upload a CSV or Excel file containing part and their associated categories. Generated mappings are shown below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="partCategoryFile" className="text-sm font-medium">Choose file</label>
          <Input id="partCategoryFile" type="file" className="file:text-sm file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-accent/20"/>
          <p className="text-xs text-muted-foreground">Supported formats: .csv, .xlsx</p>
        </div>
        <Button className="w-full sm:w-auto">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload File
        </Button>
        
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-md font-semibold mb-2 flex items-center">
            <List className="mr-2 h-5 w-5" /> Current Part Category Mappings
          </h4>
          {partCategoryMappings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No category mappings available. Generate data or upload a file.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Category Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partCategoryMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>{getPartName(mapping.partId)} ({parts.find(p=>p.id === mapping.partId)?.partNumber})</TableCell>
                    <TableCell>{mapping.categoryName}</TableCell>
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
