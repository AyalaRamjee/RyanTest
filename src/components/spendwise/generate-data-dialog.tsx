
"use client";

import { useState } from 'react';
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
import { ToyBrick } from "lucide-react";

interface GenerateDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (numParts: number, numSuppliers: number) => void;
}

export default function GenerateDataDialog({ isOpen, onClose, onGenerate }: GenerateDataDialogProps) {
  const [numParts, setNumParts] = useState(5);
  const [numSuppliers, setNumSuppliers] = useState(3);

  const handleGenerateClick = () => {
    onGenerate(numParts, numSuppliers);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ToyBrick className="mr-2 h-5 w-5" />
            Generate Sample Data
          </DialogTitle>
          <DialogDescription>
            Specify the number of sample parts and suppliers to create.
            Categories and commodities will also be generated for each part.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numParts" className="text-right">
              Parts
            </Label>
            <Input
              id="numParts"
              type="number"
              value={numParts}
              onChange={(e) => setNumParts(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="col-span-3"
              min="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numSuppliers" className="text-right">
              Suppliers
            </Label>
            <Input
              id="numSuppliers"
              type="number"
              value={numSuppliers}
              onChange={(e) => setNumSuppliers(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="col-span-3"
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleGenerateClick}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
