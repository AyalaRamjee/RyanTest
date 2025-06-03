
"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadCsvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  uploadType: 'category' | 'commodity' | 'part' | 'supplier' | 'sourcemix';
  isUploading: boolean;
}

export default function UploadCsvDialog({ isOpen, onClose, onUpload, uploadType, isUploading }: UploadCsvDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please select a .csv file."});
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; 
        }
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadClick = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
      // Parent component should close the dialog upon successful upload or display error
    } else {
      toast({ variant: "destructive", title: "No File Selected", description: "Please select a CSV file to upload."});
    }
  };

  let dialogTitle = "Upload CSV";
  let expectedFormat = "";
  switch(uploadType) {
    case 'category':
      dialogTitle = "Upload Part-Category CSV";
      expectedFormat = "Column 1: PartNumber, Column 2: CategoryName";
      break;
    case 'commodity':
      dialogTitle = "Upload Part-Commodity CSV";
      expectedFormat = "Column 1: PartNumber, Column 2: CommodityName";
      break;
    case 'part':
      dialogTitle = "Upload Parts CSV";
      expectedFormat = "Cols: PartNumber, Name, Price, AnnualDemand, FreightOhdCost(%)";
      break;
    case 'supplier':
      dialogTitle = "Upload Suppliers CSV";
      expectedFormat = "Cols: SupplierId, Name, Description, StreetAddress, City, StateOrProvince, PostalCode, Country";
      break;
    case 'sourcemix':
      dialogTitle = "Upload Source Mix CSV";
      expectedFormat = "Column 1: PartNumber, Column 2: SupplierId";
      break;
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectedFile(null); 
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UploadCloud className="mr-2 h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            Select a .csv file. Ensure your Excel file is saved as CSV. Expected format: <br />
            <strong>{expectedFormat}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-1.5">
            <Label htmlFor={`csvFile-${uploadType}`}>CSV File</Label>
            <Input
              id={`csvFile-${uploadType}`}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="text-xs file:text-xs file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-accent/20 h-9"
            />
          </div>
           {selectedFile && <p className="text-xs text-muted-foreground">Selected file: {selectedFile.name}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
             setSelectedFile(null); 
             if (fileInputRef.current) {
               fileInputRef.current.value = "";
             }
             onClose();
          }} disabled={isUploading}>Cancel</Button>
          <Button type="button" onClick={handleUploadClick} disabled={!selectedFile || isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Upload & Process
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
