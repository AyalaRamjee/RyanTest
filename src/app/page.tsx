
"use client"; 

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpdatePartsTab from "@/components/spendwise/update-parts";
import UpdateSuppliersTab from "@/components/spendwise/update-suppliers";
import PartSupplierMappingTab from "@/components/spendwise/part-supplier-mapping";
import UploadPartCategoryTab from "@/components/spendwise/upload-part-category";
import UploadPartCommodityTab from "@/components/spendwise/upload-part-commodity";
import GenerateDataDialog from "@/components/spendwise/generate-data-dialog";
import { LogoIcon } from "@/components/icons/logo-icon";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Package, Building, ArrowRightLeft, FolderTree, TrendingUp, Sun, Moon, Sparkles, ToyBrick, Loader2 } from "lucide-react";
import type { Part, Supplier, PartCategoryMapping, PartCommodityMapping } from '@/types/spendwise';
import { generateSpendData } from '@/ai/flows/generate-spend-data-flow';

export default function SpendWiseCentralPage() {
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [partCategoryMappings, setPartCategoryMappings] = useState<PartCategoryMapping[]>([]);
  const [partCommodityMappings, setPartCommodityMappings] = useState<PartCommodityMapping[]>([]);
  const [isGenerateDataDialogOpen, setIsGenerateDataDialogOpen] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');

  useEffect(() => {
    setCurrentDateString(new Date().getFullYear().toString());
  }, []);

  const handleGenerateData = async (domain: string, numParts: number, numSuppliers: number, numCategories: number, numCommodities: number) => {
    setIsGeneratingData(true);
    try {
      const generatedData = await generateSpendData({ domain, numParts, numSuppliers, numCategories, numCommodities });
      
      const newParts: Part[] = [];
      const newPartCategoryMappings: PartCategoryMapping[] = [];
      const newPartCommodityMappings: PartCommodityMapping[] = [];

      generatedData.parts.forEach((p, i) => {
        const partId = `p${Date.now()}${i}`;
        newParts.push({
          id: partId,
          partNumber: p.partNumber,
          name: p.name,
          price: parseFloat((Math.random() * 100 + 0.01).toFixed(2)),
          annualDemand: Math.floor(Math.random() * 50000) + 1000,
        });
        if (generatedData.categories.length > 0) {
          newPartCategoryMappings.push({
            id: `pcm${Date.now()}${i}`,
            partId: partId,
            categoryName: generatedData.categories[i % generatedData.categories.length],
          });
        }
        if (generatedData.commodities.length > 0) {
          newPartCommodityMappings.push({
            id: `pcom${Date.now()}${i}`,
            partId: partId,
            commodityName: generatedData.commodities[i % generatedData.commodities.length],
          });
        }
      });

      const newSuppliers: Supplier[] = generatedData.suppliers.map((s, i) => ({
        id: `s${Date.now()}${i}`,
        supplierId: `S${String(i + 1).padStart(3, '0')}`, // Keep local supplier ID generation for now
        name: s.name,
        description: s.description,
        address: `${Math.floor(Math.random() * 900) + 100} Industrial Way, Vendor City ${i + 1}`, // Keep local address generation
      }));

      setParts(newParts);
      setSuppliers(newSuppliers);
      setPartCategoryMappings(newPartCategoryMappings);
      setPartCommodityMappings(newPartCommodityMappings);
      
      toast({ title: "Success", description: "Sample data generated successfully!" });
      setIsGenerateDataDialogOpen(false);
    } catch (error) {
      console.error("Failed to generate AI data:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate data using AI. Please try again." });
    } finally {
      setIsGeneratingData(false);
    }
  };

  const handleAddPart = () => {
    const newPartId = `p${Date.now()}_manual`;
    const newPart: Part = {
      id: newPartId,
      partNumber: `P${String(parts.length + 1).padStart(3, '0')}`,
      name: "New Custom Part",
      price: 0,
      annualDemand: 0,
    };
    setParts(prev => [...prev, newPart]);
    // Optionally add default category/commodity for new parts if available
    const defaultCategory = partCategoryMappings.length > 0 ? partCategoryMappings[0].categoryName : "Default Category";
    const defaultCommodity = partCommodityMappings.length > 0 ? partCommodityMappings[0].commodityName : "Default Commodity";
    
    setPartCategoryMappings(prev => [...prev, { id: `pcm${Date.now()}_manual`, partId: newPartId, categoryName: defaultCategory}]);
    setPartCommodityMappings(prev => [...prev, { id: `pcom${Date.now()}_manual`, partId: newPartId, commodityName: defaultCommodity}]);
  };

  const handleAddSupplier = () => {
    const newSupplier: Supplier = {
      id: `s${Date.now()}_manual`,
      supplierId: `S${String(suppliers.length + 1).padStart(3, '0')}`,
      name: "New Custom Supplier",
      description: "Supplier description",
      address: "Supplier address",
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:px-6 lg:px-8">
          <LogoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-semibold text-foreground">
            SpendWise Central
          </h1>
          <div className="ml-auto flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => setIsGenerateDataDialogOpen(true)} aria-label="Generate Sample Data" disabled={isGeneratingData}>
              {isGeneratingData ? <Loader2 className="h-5 w-5 animate-spin" /> : <ToyBrick className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setTheme('light')} aria-label="Light mode">
              <Sun className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setTheme('dark')} aria-label="Dark mode">
              <Moon className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setTheme('tada')} aria-label="Tada mode">
              <Sparkles className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="update-parts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
            <TabsTrigger value="update-parts" className="flex items-center gap-2">
              <Package className="h-4 w-4" /> 1. Parts
            </TabsTrigger>
            <TabsTrigger value="update-suppliers" className="flex items-center gap-2">
              <Building className="h-4 w-4" /> 2. Suppliers
            </TabsTrigger>
            <TabsTrigger value="part-supplier-mapping" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" /> 3. Source & Mix
            </TabsTrigger>
            <TabsTrigger value="upload-part-category" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" /> 4. Part Category
            </TabsTrigger>
            <TabsTrigger value="upload-part-commodity" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> 5. Part Commodity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="update-parts">
            <UpdatePartsTab parts={parts} onAddPart={handleAddPart} />
          </TabsContent>
          <TabsContent value="update-suppliers">
            <UpdateSuppliersTab suppliers={suppliers} onAddSupplier={handleAddSupplier} />
          </TabsContent>
          <TabsContent value="part-supplier-mapping">
            <PartSupplierMappingTab parts={parts} suppliers={suppliers} />
          </TabsContent>
          <TabsContent value="upload-part-category">
            <UploadPartCategoryTab parts={parts} partCategoryMappings={partCategoryMappings} />
          </TabsContent>
          <TabsContent value="upload-part-commodity">
            <UploadPartCommodityTab parts={parts} partCommodityMappings={partCommodityMappings} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {currentDateString || new Date().getFullYear()} SpendWise Central. All rights reserved.
      </footer>
      <GenerateDataDialog 
        isOpen={isGenerateDataDialogOpen} 
        onClose={() => setIsGenerateDataDialogOpen(false)}
        onGenerate={handleGenerateData}
        isGenerating={isGeneratingData}
      />
    </div>
  );
}
