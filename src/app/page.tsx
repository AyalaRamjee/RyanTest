
"use client"; 

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryTab from "@/components/spendwise/summary-tab";
import UpdatePartsTab from "@/components/spendwise/update-parts";
import UpdateSuppliersTab from "@/components/spendwise/update-suppliers";
import PartSupplierMappingTab from "@/components/spendwise/part-supplier-mapping";
import UploadPartCategoryTab from "@/components/spendwise/upload-part-category";
import UploadPartCommodityTab from "@/components/spendwise/upload-part-commodity";
import GenerateDataDialog from "@/components/spendwise/generate-data-dialog";
import UploadCsvDialog from "@/components/spendwise/upload-csv-dialog";
import { LogoIcon } from "@/components/icons/logo-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/context/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Package, Building, ArrowRightLeft, FolderTree, TrendingUp, Sun, Moon, Sparkles, ToyBrick, Loader2, Download, Briefcase, Users, DollarSignIcon, Globe, UploadCloud } from "lucide-react";
import type { Part, Supplier, PartCategoryMapping, PartCommodityMapping } from '@/types/spendwise';
import { generateSpendData } from '@/ai/flows/generate-spend-data-flow';

export interface SpendDataPoint {
  name: string;
  spend: number;
}

export interface CountDataPoint {
  name: string;
  count: number;
}

const DEFAULT_XML_FILENAME = "SpendByTADADef01.xml";
const LAST_LOADED_FILENAME_KEY = "spendwiseLastLoadedFile";
const APP_CONFIG_DATA_KEY_PREFIX = "spendwise_config_";

export default function SpendWiseCentralPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [partCategoryMappings, setPartCategoryMappings] = useState<PartCategoryMapping[]>([]);
  const [partCommodityMappings, setPartCommodityMappings] = useState<PartCommodityMapping[]>([]);
  
  const [isGenerateDataDialogOpen, setIsGenerateDataDialogOpen] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  
  const [isCategoryUploadDialogOpen, setIsCategoryUploadDialogOpen] = useState(false);
  const [isUploadingCategoryCsv, setIsUploadingCategoryCsv] = useState(false);
  const [isCommodityUploadDialogOpen, setIsCommodityUploadDialogOpen] = useState(false);
  const [isUploadingCommodityCsv, setIsUploadingCommodityCsv] = useState(false);

  const [currentDateString, setCurrentDateString] = useState('');
  const [xmlConfigString, setXmlConfigString] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>(DEFAULT_XML_FILENAME);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const escapeXml = useCallback((unsafe: string | number): string => {
    const str = String(unsafe);
    return str.replace(/[<>&"']/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return c;
      }
    });
  }, []);

  const parseAndSetXmlData = useCallback((xmlString: string, filename: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");
      
      const errorNode = xmlDoc.querySelector("parsererror");
      if (errorNode) {
        console.error("XML Parsing Error:", errorNode.textContent);
        toast({ variant: "destructive", title: "Error Parsing XML", description: "The selected file could not be parsed." });
        return;
      }

      const newParts: Part[] = [];
      xmlDoc.querySelectorAll("Parts Part").forEach(p => {
        newParts.push({
          id: p.getAttribute("id") || `p_parsed_${Date.now()}_${Math.random()}`,
          partNumber: p.getAttribute("partNumber") || "",
          name: p.getAttribute("name") || "Unknown Part",
          price: parseFloat(p.getAttribute("price") || "0"),
          annualDemand: parseInt(p.getAttribute("annualDemand") || "0", 10),
        });
      });

      const newSuppliers: Supplier[] = [];
      xmlDoc.querySelectorAll("Suppliers Supplier").forEach(s => {
        newSuppliers.push({
          id: s.getAttribute("id") || `s_parsed_${Date.now()}_${Math.random()}`,
          supplierId: s.getAttribute("supplierId") || "",
          name: s.getAttribute("name") || "Unknown Supplier",
          description: s.getAttribute("description") || "",
          address: s.getAttribute("address") || "",
          streetAddress: s.getAttribute("streetAddress") || "",
          city: s.getAttribute("city") || "",
          stateOrProvince: s.getAttribute("stateOrProvince") || "",
          postalCode: s.getAttribute("postalCode") || "",
          country: s.getAttribute("country") || "",
        });
      });

      const newPartCategoryMappings: PartCategoryMapping[] = [];
      xmlDoc.querySelectorAll("PartCategoryMappings Mapping").forEach(m => {
        newPartCategoryMappings.push({
          id: m.getAttribute("id") || `pcm_parsed_${Date.now()}_${Math.random()}`,
          partId: m.getAttribute("partId") || "",
          categoryName: m.getAttribute("categoryName") || "Unknown Category",
        });
      });
      
      const newPartCommodityMappings: PartCommodityMapping[] = [];
      xmlDoc.querySelectorAll("PartCommodityMappings Mapping").forEach(m => {
        newPartCommodityMappings.push({
          id: m.getAttribute("id") || `pcom_parsed_${Date.now()}_${Math.random()}`,
          partId: m.getAttribute("partId") || "",
          commodityName: m.getAttribute("commodityName") || "Unknown Commodity",
        });
      });

      setParts(newParts);
      setSuppliers(newSuppliers);
      setPartCategoryMappings(newPartCategoryMappings);
      setPartCommodityMappings(newPartCommodityMappings);
      setCurrentFilename(filename);
      
      toast({ title: "Success", description: `Configuration from "${filename}" loaded.` });
    } catch (error) {
      console.error("Error processing XML data:", error);
      toast({ variant: "destructive", title: "Error Loading Data", description: "Could not process the XML data." });
    }
  }, [toast]);

  useEffect(() => {
    setCurrentDateString(new Date().getFullYear().toString());

    const lastLoadedFile = localStorage.getItem(LAST_LOADED_FILENAME_KEY);
    const filenameToLoad = lastLoadedFile || DEFAULT_XML_FILENAME;
    
    const storedXmlData = localStorage.getItem(APP_CONFIG_DATA_KEY_PREFIX + filenameToLoad);

    if (storedXmlData) {
      parseAndSetXmlData(storedXmlData, filenameToLoad);
    } else {
      setCurrentFilename(DEFAULT_XML_FILENAME); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    let xmlString = '<SpendData>\n';
    xmlString += '  <Parts>\n';
    parts.forEach(p => {
      xmlString += `    <Part id="${escapeXml(p.id)}" partNumber="${escapeXml(p.partNumber)}" name="${escapeXml(p.name)}" price="${p.price}" annualDemand="${p.annualDemand}" />\n`;
    });
    xmlString += '  </Parts>\n';

    xmlString += '  <Suppliers>\n';
    suppliers.forEach(s => {
      xmlString += `    <Supplier id="${escapeXml(s.id)}" supplierId="${escapeXml(s.supplierId)}" name="${escapeXml(s.name)}" description="${escapeXml(s.description)}" address="${escapeXml(s.address)}" streetAddress="${escapeXml(s.streetAddress)}" city="${escapeXml(s.city)}" stateOrProvince="${escapeXml(s.stateOrProvince)}" postalCode="${escapeXml(s.postalCode)}" country="${escapeXml(s.country)}" />\n`;
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
    setXmlConfigString(xmlString);

    if (currentFilename && typeof window !== 'undefined') {
        localStorage.setItem(APP_CONFIG_DATA_KEY_PREFIX + currentFilename, xmlString);
        localStorage.setItem(LAST_LOADED_FILENAME_KEY, currentFilename);
    }

  }, [parts, suppliers, partCategoryMappings, partCommodityMappings, escapeXml, currentFilename]);

  const handleDownloadXml = () => {
    if (!xmlConfigString) {
      toast({ variant: "destructive", title: "Error", description: "No configuration data available to download." });
      return;
    }
    const blob = new Blob([xmlConfigString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: `${currentFilename} downloaded.` });
  };

  const handleLoadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          parseAndSetXmlData(content, file.name);
          if(fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } else {
          toast({ variant: "destructive", title: "Error", description: "Could not read file content." });
        }
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to read the file." });
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateData = async (domain: string, numParts: number, numSuppliers: number, numCategories: number, numCommodities: number) => {
    setIsGeneratingData(true);
    try {
      const generatedData = await generateSpendData({ domain, numParts, numSuppliers, numCategories, numCommodities });
      
      const newPartsArr: Part[] = [];
      const newPartCategoryMappingsArr: PartCategoryMapping[] = [];
      const newPartCommodityMappingsArr: PartCommodityMapping[] = [];

      generatedData.parts.forEach((p, i) => {
        const partId = `p${Date.now()}${i}`;
        newPartsArr.push({
          id: partId,
          partNumber: p.partNumber,
          name: p.name,
          price: parseFloat((Math.random() * 1000 + 5).toFixed(2)),
          annualDemand: Math.floor(Math.random() * 50000) + 1000,
        });
        if (generatedData.categories.length > 0) {
          newPartCategoryMappingsArr.push({
            id: `pcm${Date.now()}${i}`,
            partId: partId,
            categoryName: generatedData.categories[i % generatedData.categories.length],
          });
        }
        if (generatedData.commodities.length > 0) {
          newPartCommodityMappingsArr.push({
            id: `pcom${Date.now()}${i}`,
            partId: partId,
            commodityName: generatedData.commodities[i % generatedData.commodities.length],
          });
        }
      });

      const newSuppliersArr: Supplier[] = generatedData.suppliers.map((s, i) => {
        const fullAddress = `${s.streetAddress}, ${s.city}, ${s.stateOrProvince} ${s.postalCode}, ${s.country}`;
        return {
          id: `s${Date.now()}${i}`,
          supplierId: `#S${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i+5) % 26))}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          name: s.name,
          description: s.description,
          streetAddress: s.streetAddress,
          city: s.city,
          stateOrProvince: s.stateOrProvince,
          postalCode: s.postalCode,
          country: s.country,
          address: fullAddress,
        };
      });

      setParts(newPartsArr);
      setSuppliers(newSuppliersArr);
      setPartCategoryMappings(newPartCategoryMappingsArr);
      setPartCommodityMappings(newPartCommodityMappingsArr);
      
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
      partNumber: `P${String(parts.length + 1).padStart(3, '0')}${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`,
      name: "New Custom Part",
      price: 0,
      annualDemand: 0,
    };
    setParts(prev => [...prev, newPart]);
    
    const defaultCategory = partCategoryMappings.length > 0 ? partCategoryMappings[0].categoryName : "Default Category";
    const defaultCommodity = partCommodityMappings.length > 0 ? partCommodityMappings[0].commodityName : "Default Commodity";
    
    if (parts.length === 0 || !partCategoryMappings.some(m => m.partId === newPartId)) {
        setPartCategoryMappings(prev => [...prev, { id: `pcm${Date.now()}_manual`, partId: newPartId, categoryName: defaultCategory}]);
    }
    if (parts.length === 0 || !partCommodityMappings.some(m => m.partId === newPartId)) {
        setPartCommodityMappings(prev => [...prev, { id: `pcom${Date.now()}_manual`, partId: newPartId, commodityName: defaultCommodity}]);
    }
  };

  const handleAddSupplier = () => {
    const i = suppliers.length;
    const newSupplier: Supplier = {
      id: `s${Date.now()}_manual`,
      supplierId: `#S${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i+3) % 26))}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      name: "New Custom Supplier",
      description: "Supplier description",
      streetAddress: "123 Main St",
      city: "Anytown",
      stateOrProvince: "CA",
      postalCode: "90210",
      country: "USA",
      address: "123 Main St, Anytown, CA 90210, USA",
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const processCsvUpload = async (file: File, type: 'category' | 'commodity') => {
    const isCategoryUpload = type === 'category';
    if (isCategoryUpload) setIsUploadingCategoryCsv(true);
    else setIsUploadingCommodityCsv(true);

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
          
          if (lines.length <= 1) { // Header only or empty
             toast({ variant: "destructive", title: "CSV Error", description: "CSV file is empty or contains only a header." });
             if (isCategoryUpload) setIsUploadingCategoryCsv(false); else setIsUploadingCommodityCsv(false);
             reject(new Error("CSV empty or header only"));
             return;
          }

          const newMappings: (PartCategoryMapping | PartCommodityMapping)[] = [];
          const errors: string[] = [];
          let processedCount = 0;

          // Skip header row (lines[0])
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, '')); // Basic CSV parsing, handles quotes
            
            if (columns.length < 2) {
              errors.push(`Row ${i+1}: Not enough columns.`);
              continue;
            }
            const partNumber = columns[0];
            const name = columns[1];

            if (!partNumber || !name) {
              errors.push(`Row ${i+1}: Missing PartNumber or ${isCategoryUpload ? 'CategoryName' : 'CommodityName'}.`);
              continue;
            }

            const part = parts.find(p => p.partNumber === partNumber);
            if (!part) {
              errors.push(`Row ${i+1}: PartNumber "${partNumber}" not found.`);
              continue;
            }

            if (isCategoryUpload) {
              newMappings.push({
                id: `pcm_csv_${Date.now()}_${i}`,
                partId: part.id,
                categoryName: name,
              } as PartCategoryMapping);
            } else {
              newMappings.push({
                id: `pcom_csv_${Date.now()}_${i}`,
                partId: part.id,
                commodityName: name,
              } as PartCommodityMapping);
            }
            processedCount++;
          }

          if (isCategoryUpload) {
            setPartCategoryMappings(prev => [...prev, ...newMappings as PartCategoryMapping[]]);
          } else {
            setPartCommodityMappings(prev => [...prev, ...newMappings as PartCommodityMapping[]]);
          }
          
          let description = `${processedCount} mappings added.`;
          if (errors.length > 0) {
            description += ` ${errors.length} rows skipped.`;
            console.warn("CSV Upload Errors:", errors);
             toast({ variant: "destructive", title: "Upload Partially Successful", description: `${description} Check console for details.`, duration: 7000 });
          } else {
            toast({ title: "Upload Successful", description });
          }
          resolve();
        } catch (err) {
          console.error(`Error processing CSV for ${type}:`, err);
          toast({ variant: "destructive", title: "Processing Error", description: `Could not process the CSV file for ${type}.` });
          reject(err);
        } finally {
          if (isCategoryUpload) setIsUploadingCategoryCsv(false);
          else setIsUploadingCommodityCsv(false);
        }
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Failed to read the file." });
        if (isCategoryUpload) setIsUploadingCategoryCsv(false); else setIsUploadingCommodityCsv(false);
        reject(new Error("File read error"));
      };
      reader.readAsText(file);
    });
  };

  const handleProcessCategoryCsv = async (file: File) => {
    await processCsvUpload(file, 'category');
    setIsCategoryUploadDialogOpen(false); // Close dialog after processing
  };

  const handleProcessCommodityCsv = async (file: File) => {
    await processCsvUpload(file, 'commodity');
    setIsCommodityUploadDialogOpen(false); // Close dialog after processing
  };


  const totalParts = useMemo(() => parts.length, [parts]);
  const totalSuppliers = useMemo(() => suppliers.length, [suppliers]);
  const totalCategories = useMemo(() => new Set(partCategoryMappings.map(m => m.categoryName)).size, [partCategoryMappings]);
  const totalCommodities = useMemo(() => new Set(partCommodityMappings.map(m => m.commodityName)).size, [partCommodityMappings]);
  const totalAnnualSpend = useMemo(() => {
    return parts.reduce((sum, p) => sum + (p.price * p.annualDemand), 0);
  }, [parts]);

  const formatCurrencyDisplay = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(0);
  };
  
  const summaryStats = [
    { Icon: Briefcase, label: "Total Parts", value: totalParts },
    { Icon: Users, label: "Total Suppliers", value: totalSuppliers },
    { Icon: FolderTree, label: "Categories", value: totalCategories },
    { Icon: TrendingUp, label: "Commodities", value: totalCommodities },
    { Icon: DollarSignIcon, label: "$ Spend/Year", value: formatCurrencyDisplay(totalAnnualSpend) },
  ];

  const spendByPartData: SpendDataPoint[] = useMemo(() => {
    return parts.map(part => ({
      name: part.partNumber,
      spend: part.price * part.annualDemand,
    })).sort((a,b) => b.spend - a.spend).slice(0,10);
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

  const partsPerCategoryData: CountDataPoint[] = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    partCategoryMappings.forEach(mapping => {
      categoryCounts[mapping.categoryName] = (categoryCounts[mapping.categoryName] || 0) + 1;
    });
    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [partCategoryMappings]);

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
            <span className="text-sm text-muted-foreground mr-2">Source: {currentFilename}</span>
            <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept=".xml" style={{ display: 'none' }} />
            <Button variant="outline" size="icon" onClick={handleLoadButtonClick} aria-label="Load Configuration XML">
              <UploadCloud className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownloadXml} aria-label="Download Configuration XML">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsGenerateDataDialogOpen(true)} aria-label="Generate Sample Data" disabled={isGeneratingData}>
              {isGeneratingData ? <Loader2 className="h-5 w-5 animate-spin" /> : <ToyBrick className="h-5 w-5" />}
            </Button>
            <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'tada')}>
              <SelectTrigger className="w-[120px] text-xs" aria-label="Select Theme">
                <SelectValue placeholder="Select Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center">
                    <Sun className="mr-2 h-4 w-4" /> Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center">
                    <Moon className="mr-2 h-4 w-4" /> Dark
                  </div>
                </SelectItem>
                <SelectItem value="tada">
                  <div className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" /> Tada
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <section aria-labelledby="summary-stats-title" className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {summaryStats.map(stat => (
              <Card key={stat.label} className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Tabs defaultValue="update-parts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-6 text-xs">
            <TabsTrigger value="update-parts" className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> 1. Parts
            </TabsTrigger>
            <TabsTrigger value="update-suppliers" className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5" /> 2. Suppliers
            </TabsTrigger>
            <TabsTrigger value="part-supplier-mapping" className="flex items-center gap-1">
              <ArrowRightLeft className="h-3.5 w-3.5" /> 3. Source & Mix
            </TabsTrigger>
            <TabsTrigger value="upload-part-category" className="flex items-center gap-1">
              <FolderTree className="h-3.5 w-3.5" /> 4. Part Category
            </TabsTrigger>
            <TabsTrigger value="upload-part-commodity" className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> 5. Part Commodity
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> 6. Summary
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="update-parts">
            <UpdatePartsTab 
              parts={parts} 
              onAddPart={handleAddPart} 
              spendByPartData={spendByPartData} 
              spendByCategoryData={spendByCategoryData}
              partsPerCategoryData={partsPerCategoryData}
            />
          </TabsContent>
          <TabsContent value="update-suppliers">
            <UpdateSuppliersTab suppliers={suppliers} onAddSupplier={handleAddSupplier} />
          </TabsContent>
          <TabsContent value="part-supplier-mapping">
            <PartSupplierMappingTab parts={parts} suppliers={suppliers} />
          </TabsContent>
          <TabsContent value="upload-part-category">
            <UploadPartCategoryTab 
              parts={parts} 
              partCategoryMappings={partCategoryMappings} 
              spendByCategoryData={spendByCategoryData}
              partsPerCategoryData={partsPerCategoryData}
              onOpenUploadDialog={() => setIsCategoryUploadDialogOpen(true)}
            />
          </TabsContent>
          <TabsContent value="upload-part-commodity">
            <UploadPartCommodityTab 
              parts={parts} 
              partCommodityMappings={partCommodityMappings} 
              spendData={spendByCommodityData} 
              onOpenUploadDialog={() => setIsCommodityUploadDialogOpen(true)}
            />
          </TabsContent>
          <TabsContent value="summary">
            <SummaryTab suppliers={suppliers} />
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
      <UploadCsvDialog
        isOpen={isCategoryUploadDialogOpen}
        onClose={() => setIsCategoryUploadDialogOpen(false)}
        onUpload={handleProcessCategoryCsv}
        uploadType="category"
        isUploading={isUploadingCategoryCsv}
      />
      <UploadCsvDialog
        isOpen={isCommodityUploadDialogOpen}
        onClose={() => setIsCommodityUploadDialogOpen(false)}
        onUpload={handleProcessCommodityCsv}
        uploadType="commodity"
        isUploading={isUploadingCommodityCsv}
      />
    </div>
  );
}
