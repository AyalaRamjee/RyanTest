import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FolderTree } from "lucide-react";

export default function UploadPartCategoryTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><FolderTree className="mr-2 h-6 w-6" /> Upload Part & Category Data</CardTitle>
        <CardDescription>Upload a CSV or Excel file containing part and their associated categories.</CardDescription>
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
          <h4 className="text-md font-semibold mb-2">Upload History (Placeholder)</h4>
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
          {/* Placeholder for upload history list */}
        </div>
      </CardContent>
    </Card>
  );
}
