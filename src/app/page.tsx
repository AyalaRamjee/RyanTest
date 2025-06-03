
"use client"; 

import { useState, useEffect, useMemo } from 'react';
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
import { Package, Building, ArrowRightLeft, FolderTree, TrendingUp, Sun, Moon, Sparkles, ToyBrick, Loader2, Download } from "lucide-react";
import type { Part, Supplier, PartCategoryMapping, PartCommodityMapping } from '@/types/spendwise';
import { generateSpendData } from '@/ai/flows/generate-spend-data-flow';

export interface SpendDataPoint {
  name: string;
  spend: number;
}

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
          price: parseFloat((Math.random() * 1000 + 5).toFixed(2)), // Increased price range
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
        supplierId: `#S${String(i + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`, // #SAA#### format
        name: s.name,
        description: s.description,
        address: `${Math.floor(Math.random() * 900) + 100} Industrial Way, Vendor City ${i + 1}`,
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
      partNumber: `P${String(parts.length + 1).padStart(3, '0')}${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`, // Ensure somewhat unique part numbers
      name: "New Custom Part",
      price: 0,
      annualDemand: 0,
    };
    setParts(prev => [...prev, newPart]);
    
    const defaultCategory = partCategoryMappings.length > 0 ? partCategoryMappings[0].categoryName : "Default Category";
    const defaultCommodity = partCommodityMappings.length > 0 ? partCommodityMappings[0].commodityName : "Default Commodity";
    
    if (partCategoryMappings.length > 0 || generatedData?.categories?.length > 0 || parts.length === 0) { // Add default mapping if categories exist or its the first part
      setPartCategoryMappings(prev => [...prev, { id: `pcm${Date.now()}_manual`, partId: newPartId, categoryName: defaultCategory}]);
    }
    if (partCommodityMappings.length > 0 || generatedData?.commodities?.length > 0 || parts.length === 0) {
      setPartCommodityMappings(prev => [...prev, { id: `pcom${Date.now()}_manual`, partId: newPartId, commodityName: defaultCommodity}]);
    }
  };

  const handleAddSupplier = () => {
    const newSupplier: Supplier = {
      id: `s${Date.now()}_manual`,
      supplierId: `#S${String(suppliers.length + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`, // #SAA#### format
      name: "New Custom Supplier",
      description: "Supplier description",
      address: "Supplier address",
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&"']/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return c;
      }
    });
  };

  const handleDownloadXml = () => {
    let xmlString = '<SpendData>\n';

    xmlString += '  <Parts>\n';
    parts.forEach(p => {
      xmlString += `    <Part id="${escapeXml(p.id)}" partNumber="${escapeXml(p.partNumber)}" name="${escapeXml(p.name)}" price="${p.price}" annualDemand="${p.annualDemand}" />\n`;
    });
    xmlString += '  </Parts>\n';

    xmlString += '  <Suppliers>\n';
    suppliers.forEach(s => {
      xmlString += `    <Supplier id="${escapeXml(s.id)}" supplierId="${escapeXml(s.supplierId)}" name="${escapeXml(s.name)}" description="${escapeXml(s.description)}" address="${escapeXml(s.address)}" />\n`;
    });
    xmlString += '  </Suppliers>\n';

    xmlString += '  <PartCategoryMappings>\n';
    partCategoryMappings.forEach(m => {
      xmlString += `    <Mapping id="${escapeXml(m.id)}" partId="${escapeXml(m.partId)}" categoryName="${escapeXml(m.categoryName)}" />\n`;
    });
    xmlString += '  </PartCategoryMappings>\n';

    xmlString += '  <PartCommodityMappings>\n';
    partCommodityMappings.forEach(m => {
      xmlString += `    <Mapping id="${escapeXml(m.id)}" partId="${escapeXml(m.partId)}" commodityName="${escapeXml(m.commodityName)}" />\n`;
    });
    xmlString += '  </PartCommodityMappings>\n';

    xmlString += '</SpendData>';

    const blob = new Blob([xmlString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spend-analysis-config.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Configuration XML downloaded." });
  };

  const spendByPartData: SpendDataPoint[] = useMemo(() => {
    return parts.map(part => ({
      name: part.partNumber, // Using partNumber for brevity in chart
      spend: part.price * part.annualDemand,
    })).sort((a,b) => b.spend - a.spend).slice(0,10); // Top 10 parts by spend
  }, [parts]);

  const spendByCategoryData: SpendDataPoint[] = useMemo(() => {
    const categorySpend: Record<string, number> = {};
    partCategoryMappings.forEach(mapping => {
      const part = parts.find(p => p.id === mapping.partId);
      if (part) {
        const spend = part.price * part.annualDemand;
        categorySpend[mapping.categoryName] = (categorySpend[mapping.categoryName] || 0) + spend;
      }
    });
    return Object.entries(categorySpend)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a,b) => b.spend - a.spend);
  }, [parts, partCategoryMappings]);

  const spendByCommodityData: SpendDataPoint[] = useMemo(() => {
    const commoditySpend: Record<string, number> = {};
    partCommodityMappings.forEach(mapping => {
      const part = parts.find(p => p.id === mapping.partId);
      if (part) {
        const spend = part.price * part.annualDemand;
        commoditySpend[mapping.commodityName] = (commoditySpend[mapping.commodityName] || 0) + spend;
      }
    });
    return Object.entries(commoditySpend)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a,b) => b.spend - a.spend);
  }, [parts, partCommodityMappings]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:px-6 lg:px-8">
          <LogoIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-semibold text-foreground">
            Spend Analysis by !TADA
          </h1>
          <div className="ml-auto flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleDownloadXml} aria-label="Download Configuration XML">
              <Download className="h-5 w-5" />
            </Button>
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
            <UpdatePartsTab parts={parts} onAddPart={handleAddPart} spendData={spendByPartData} />
          </TabsContent>
          <TabsContent value="update-suppliers">
            <UpdateSuppliersTab suppliers={suppliers} onAddSupplier={handleAddSupplier} />
          </TabsContent>
          <TabsContent value="part-supplier-mapping">
            <PartSupplierMappingTab parts={parts} suppliers={suppliers} />
          </TabsContent>
          <TabsContent value="upload-part-category">
            <UploadPartCategoryTab parts={parts} partCategoryMappings={partCategoryMappings} spendData={spendByCategoryData} />
          </TabsContent>
          <TabsContent value="upload-part-commodity">
            <UploadPartCommodityTab parts={parts} partCommodityMappings={partCommodityMappings} spendData={spendByCommodityData} />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {currentDateString || new Date().getFullYear()} Spend Analysis by !TADA. All rights reserved.
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
