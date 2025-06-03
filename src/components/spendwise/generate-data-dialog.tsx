
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
  onGenerate: (domain: string, numParts: number, numSuppliers: number, numCategories: number, numCommodities: number) => void;
  isGenerating: boolean;
}

export default function GenerateDataDialog({ isOpen, onClose, onGenerate, isGenerating }: GenerateDataDialogProps) {
  const [domain, setDomain] = useState("General Manufacturing");
  const [numParts, setNumParts] = useState(50);
  const [numSuppliers, setNumSuppliers] = useState(12);
  const [numCategories, setNumCategories] = useState(5);
  const [numCommodities, setNumCommodities] = useState(6);

  const handleGenerateClick = () => {
    onGenerate(domain, numParts, numSuppliers, numCategories, numCommodities);
    // Don't close immediately, allow parent to close after generation
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ToyBrick className="mr-2 h-5 w-5" />
            Generate Sample Data (AI-Powered)
          </DialogTitle>
          <DialogDescription>
            Specify the domain and number of items to generate. The AI will create contextually relevant data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="domain" className="text-right">
              Domain
            </Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Automotive, Electronics"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numParts" className="text-right">
              Parts
            </Label>
            <Input
              id="numParts"
              type="number"
              value={numParts}
              onChange={(e) => setNumParts(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="col-span-3"
              min="1"
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
              onChange={(e) => setNumSuppliers(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="col-span-3"
              min="1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numCategories" className="text-right">
              Categories
            </Label>
            <Input
              id="numCategories"
              type="number"
              value={numCategories}
              onChange={(e) => setNumCategories(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="col-span-3"
              min="1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numCommodities" className="text-right">
              Commodities
            </Label>
            <Input
              id="numCommodities"
              type="number"
              value={numCommodities}
              onChange={(e) => setNumCommodities(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="col-span-3"
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button type="submit" onClick={handleGenerateClick} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
