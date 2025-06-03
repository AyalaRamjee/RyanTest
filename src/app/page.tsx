
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
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/context/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Package, Building, ArrowRightLeft, FolderTree, TrendingUp, Sun, Moon, Sparkles, ToyBrick, Loader2, Download, Briefcase, Users, DollarSignIcon, Globe, UploadCloud, PercentCircle, Landmark } from "lucide-react";
import type { Part, Supplier, PartCategoryMapping, PartCommodityMapping, PartSupplierAssociation } from '@/types/spendwise';
import { generateSpendData } from '@/ai/flows/generate-spend-data-flow';
import { TooltipProvider } from "@/components/ui/tooltip";

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

const HEADER_HEIGHT_PX = 64;
const SUMMARY_STATS_HEIGHT_PX = 122; 
const TABSLIST_STICKY_TOP_PX = HEADER_HEIGHT_PX + SUMMARY_STATS_HEIGHT_PX; 

export default function SpendWiseCentralPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [partCategoryMappings, setPartCategoryMappings] = useState<PartCategoryMapping[]>([]);
  const [partCommodityMappings, setPartCommodityMappings] = useState<PartCommodityMapping[]>([]);
  const [partSupplierAssociations, setPartSupplierAssociations] = useState<PartSupplierAssociation[]>([]);
  
  const [isGenerateDataDialogOpen, setIsGenerateDataDialogOpen] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  
  const [isCategoryUploadDialogOpen, setIsCategoryUploadDialogOpen] = useState(false);
  const [isUploadingCategoryCsv, setIsUploadingCategoryCsv] = useState(false);
  const [isCommodityUploadDialogOpen, setIsCommodityUploadDialogOpen] = useState(false);
  const [isUploadingCommodityCsv, setIsUploadingCommodityCsv] = useState(false);
  const [isPartsUploadDialogOpen, setIsPartsUploadDialogOpen] = useState(false);
  const [isUploadingPartsCsv, setIsUploadingPartsCsv] = useState(false);
  const [isSuppliersUploadDialogOpen, setIsSuppliersUploadDialogOpen] = useState(false);
  const [isUploadingSuppliersCsv, setIsUploadingSuppliersCsv] = useState(false);
  const [isSourceMixUploadDialogOpen, setIsSourceMixUploadDialogOpen] = useState(false);
  const [isUploadingSourceMixCsv, setIsUploadingSourceMixCsv] = useState(false);

  const [factoryInventoryOHPercent, setFactoryInventoryOHPercent] = useState(100); // Default 100% (no change)
  const [totalLogisticsCostPercent, setTotalLogisticsCostPercent] = useState(100); // Default 100% (no change)

  const [xmlConfigString, setXmlConfigString] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>(DEFAULT_XML_FILENAME);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formattedDateTime, setFormattedDateTime] = useState<string>('');

  useEffect(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const updateDateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const dayName = days[now.getDay()];
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      setFormattedDateTime(`${hours}:${minutes}, ${dayName}, ${day}/${month}/${year}`);
    };

    updateDateTime(); 
    const intervalId = setInterval(updateDateTime, 1000); 

    return () => clearInterval(intervalId); 
  }, []);


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
          freightOhdCost: parseFloat(p.getAttribute("freightOhdCost") || "0.00"),
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
          streetAddress: s.getAttribute("streetAddress") || s.getAttribute("address") || "", 
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

      const newPartSupplierAssociations: PartSupplierAssociation[] = [];
      xmlDoc.querySelectorAll("PartSupplierAssociations Association").forEach(a => {
        newPartSupplierAssociations.push({
          id: a.getAttribute("id") || `psa_parsed_${Date.now()}_${Math.random()}`,
          partId: a.getAttribute("partId") || "",
          supplierId: a.getAttribute("supplierId") || "",
        });
      });

      setParts(newParts);
      setSuppliers(newSuppliers);
      setPartCategoryMappings(newPartCategoryMappings);
      setPartCommodityMappings(newPartCommodityMappings);
      setPartSupplierAssociations(newPartSupplierAssociations);
      setCurrentFilename(filename);
      
      toast({ title: "Success", description: `Configuration from "${filename}" loaded.` });
    } catch (error) {
      console.error("Error processing XML data:", error);
      toast({ variant: "destructive", title: "Error Loading Data", description: "Could not process the XML data." });
    }
  }, [toast]);

  useEffect(() => {
    const lastLoadedFile = typeof window !== 'undefined' ? localStorage.getItem(LAST_LOADED_FILENAME_KEY) : null;
    const filenameToLoad = lastLoadedFile || DEFAULT_XML_FILENAME;
    
    const storedXmlData = typeof window !== 'undefined' ? localStorage.getItem(APP_CONFIG_DATA_KEY_PREFIX + filenameToLoad) : null;

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
      xmlString += `    <Part id="${escapeXml(p.id)}" partNumber="${escapeXml(p.partNumber)}" name="${escapeXml(p.name)}" price="${p.price}" annualDemand="${p.annualDemand}" freightOhdCost="${p.freightOhdCost}" />\n`;
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

    xmlString += '  <PartSupplierAssociations>\n';
    partSupplierAssociations.forEach(a => {
      xmlString += `    <Association id="${escapeXml(a.id)}" partId="${escapeXml(a.partId)}" supplierId="${escapeXml(a.supplierId)}" />\n`;
    });
    xmlString += '  </PartSupplierAssociations>\n';

    xmlString += '</SpendData>';
    setXmlConfigString(xmlString);

    if (currentFilename && typeof window !== 'undefined') {
        localStorage.setItem(APP_CONFIG_DATA_KEY_PREFIX + currentFilename, xmlString);
        localStorage.setItem(LAST_LOADED_FILENAME_KEY, currentFilename);
    }

  }, [parts, suppliers, partCategoryMappings, partCommodityMappings, partSupplierAssociations, escapeXml, currentFilename]);

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

  const handleGenerateData = async (domain: string, numPartsToGen: number, numSuppliersToGen: number, numCategoriesToGen: number, numCommoditiesToGen: number) => {
    setIsGeneratingData(true);
    try {
      const generatedData = await generateSpendData({ domain, numParts: numPartsToGen, numSuppliers: numSuppliersToGen, numCategories: numCategoriesToGen, numCommodities: numCommoditiesToGen });
      
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
          freightOhdCost: parseFloat((Math.random() * 0.05).toFixed(4)), // 0-5%
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

      const newPartSupplierAssociationsArr: PartSupplierAssociation[] = [];
      if (generatedData.partSupplierAssociations) {
        generatedData.partSupplierAssociations.forEach((assoc, i) => {
          const part = newPartsArr.find(p => p.partNumber === assoc.partNumber);
          const supplier = newSuppliersArr.find(s => s.name === assoc.supplierName);
          if (part && supplier) {
            newPartSupplierAssociationsArr.push({
              id: `psa_ai_${Date.now()}_${i}`,
              partId: part.id,
              supplierId: supplier.id,
            });
          }
        });
      }
      
      setParts(newPartsArr);
      setSuppliers(newSuppliersArr);
      setPartCategoryMappings(newPartCategoryMappingsArr);
      setPartCommodityMappings(newPartCommodityMappingsArr);
      setPartSupplierAssociations(newPartSupplierAssociationsArr); 
      
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
      freightOhdCost: 0.00,
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

  const processCsvUpload = async (file: File, type: 'category' | 'commodity' | 'part' | 'supplier' | 'sourcemix') => {
    let isProcessingSetter: React.Dispatch<React.SetStateAction<boolean>> | null = null;
    switch(type) {
      case 'category': isProcessingSetter = setIsUploadingCategoryCsv; break;
      case 'commodity': isProcessingSetter = setIsUploadingCommodityCsv; break;
      case 'part': isProcessingSetter = setIsUploadingPartsCsv; break;
      case 'supplier': isProcessingSetter = setIsUploadingSuppliersCsv; break;
      case 'sourcemix': isProcessingSetter = setIsUploadingSourceMixCsv; break;
    }
    if (isProcessingSetter) isProcessingSetter(true);

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
          
          if (lines.length <= 1) { 
             toast({ variant: "destructive", title: "CSV Error", description: "CSV file is empty or contains only a header." });
             reject(new Error("CSV empty or header only"));
             return;
          }

          const errors: string[] = [];
          let processedCount = 0;
          let skippedCount = 0;

          if (type === 'category' || type === 'commodity') {
            const newMappings: (PartCategoryMapping | PartCommodityMapping)[] = [];
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
              if (columns.length < 2) { errors.push(`Row ${i+1}: Not enough columns.`); skippedCount++; continue; }
              const partNumber = columns[0];
              const name = columns[1];
              if (!partNumber || !name) { errors.push(`Row ${i+1}: Missing PartNumber or Name.`); skippedCount++; continue; }
              const part = parts.find(p => p.partNumber === partNumber);
              if (!part) { errors.push(`Row ${i+1}: PartNumber "${partNumber}" not found.`); skippedCount++; continue; }
              if (type === 'category') newMappings.push({ id: `pcm_csv_${Date.now()}_${i}`, partId: part.id, categoryName: name } as PartCategoryMapping);
              else newMappings.push({ id: `pcom_csv_${Date.now()}_${i}`, partId: part.id, commodityName: name } as PartCommodityMapping);
              processedCount++;
            }
            if (type === 'category') setPartCategoryMappings(prev => [...prev, ...newMappings as PartCategoryMapping[]]);
            else setPartCommodityMappings(prev => [...prev, ...newMappings as PartCommodityMapping[]]);
          } else if (type === 'part') {
            const newPartsArr: Part[] = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
                if (columns.length < 4) { errors.push(`Row ${i+1}: Not enough columns. Expected PartNumber,Name,Price,AnnualDemand,FreightOhdCost(%).`); skippedCount++; continue; }
                const [partNumber, name, priceStr, annualDemandStr, freightOhdCostStr] = columns;
                const price = parseFloat(priceStr);
                const annualDemand = parseInt(annualDemandStr, 10);
                const freightOhdCost = parseFloat(freightOhdCostStr) / 100; 
                if (!partNumber || !name || isNaN(price) || isNaN(annualDemand) || isNaN(freightOhdCost)) { errors.push(`Row ${i+1}: Invalid data for PartNumber, Name, Price, AnnualDemand, or FreightOhdCost.`); skippedCount++; continue; }
                if (parts.some(p => p.partNumber === partNumber)) { errors.push(`Row ${i+1}: PartNumber "${partNumber}" already exists. Skipped.`); skippedCount++; continue; }
                newPartsArr.push({ id: `p_csv_${Date.now()}_${i}`, partNumber, name, price, annualDemand, freightOhdCost });
                processedCount++;
            }
            setParts(prev => [...prev, ...newPartsArr]);
          } else if (type === 'supplier') {
            const newSuppliersArr: Supplier[] = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
                if (columns.length < 8) { errors.push(`Row ${i+1}: Not enough columns. Expected SupplierId, Name, Description, StreetAddress, City, StateOrProvince, PostalCode, Country.`); skippedCount++; continue; }
                const [supplierId, name, description, streetAddress, city, stateOrProvince, postalCode, country] = columns;
                if (!supplierId || !name) { errors.push(`Row ${i+1}: Missing SupplierId or Name.`); skippedCount++; continue; }
                if (suppliers.some(s => s.supplierId === supplierId)) { errors.push(`Row ${i+1}: SupplierId "${supplierId}" already exists. Skipped.`); skippedCount++; continue; }
                const fullAddress = `${streetAddress}, ${city}, ${stateOrProvince} ${postalCode}, ${country}`;
                newSuppliersArr.push({ id: `s_csv_${Date.now()}_${i}`, supplierId, name, description, streetAddress, city, stateOrProvince, postalCode, country, address: fullAddress });
                processedCount++;
            }
            setSuppliers(prev => [...prev, ...newSuppliersArr]);
          } else if (type === 'sourcemix') {
            const newAssociations: PartSupplierAssociation[] = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
                if (columns.length < 2) { errors.push(`Row ${i+1}: Not enough columns. Expected PartNumber, SupplierId.`); skippedCount++; continue; }
                const [partNumber, supplierIdVal] = columns;
                if (!partNumber || !supplierIdVal) { errors.push(`Row ${i+1}: Missing PartNumber or SupplierId.`); skippedCount++; continue; }
                const part = parts.find(p => p.partNumber === partNumber);
                const supplier = suppliers.find(s => s.supplierId === supplierIdVal);
                if (!part) { errors.push(`Row ${i+1}: PartNumber "${partNumber}" not found.`); skippedCount++; continue; }
                if (!supplier) { errors.push(`Row ${i+1}: SupplierId "${supplierIdVal}" not found.`); skippedCount++; continue; }
                if (partSupplierAssociations.some(a => a.partId === part.id && a.supplierId === supplier.id)) { errors.push(`Row ${i+1}: Association between "${partNumber}" and "${supplierIdVal}" already exists. Skipped.`); skippedCount++; continue; }
                newAssociations.push({ id: `psa_csv_${Date.now()}_${i}`, partId: part.id, supplierId: supplier.id });
                processedCount++;
            }
            setPartSupplierAssociations(prev => [...prev, ...newAssociations]);
          }
          
          let description = `${processedCount} items/mappings added.`;
          if (skippedCount > 0 || errors.length > 0) {
            description += ` ${skippedCount + errors.filter(e => !e.includes("already exists")).length} rows skipped due to errors or duplicates.`;
            console.warn(`CSV Upload Errors/Skipped (${type}):`, errors);
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
          if (isProcessingSetter) isProcessingSetter(false);
        }
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error", description: "Failed to read the file." });
        if (isProcessingSetter) isProcessingSetter(false);
        reject(new Error("File read error"));
      };
      reader.readAsText(file);
    });
  };

  const handleProcessCategoryCsv = async (file: File) => {
    await processCsvUpload(file, 'category');
    setIsCategoryUploadDialogOpen(false); 
  };

  const handleProcessCommodityCsv = async (file: File) => {
    await processCsvUpload(file, 'commodity');
    setIsCommodityUploadDialogOpen(false); 
  };

  const handleProcessPartsCsv = async (file: File) => {
    await processCsvUpload(file, 'part');
    setIsPartsUploadDialogOpen(false);
  };

  const handleProcessSuppliersCsv = async (file: File) => {
    await processCsvUpload(file, 'supplier');
    setIsSuppliersUploadDialogOpen(false);
  };

  const handleProcessSourceMixCsv = async (file: File) => {
    await processCsvUpload(file, 'sourcemix');
    setIsSourceMixUploadDialogOpen(false);
  };


  const totalParts = useMemo(() => parts.length, [parts]);
  const totalSuppliers = useMemo(() => suppliers.length, [suppliers]);
  const totalCategories = useMemo(() => new Set(partCategoryMappings.map(m => m.categoryName)).size, [partCategoryMappings]);
  const totalCommodities = useMemo(() => new Set(partCommodityMappings.map(m => m.commodityName)).size, [partCommodityMappings]);

  const calculateSpend = (part: Part) => {
    const inventoryMultiplier = factoryInventoryOHPercent / 100;
    const logisticsMultiplier = totalLogisticsCostPercent / 100;
    const effectivePrice = part.price * inventoryMultiplier;
    const effectiveFreightOhdRate = part.freightOhdCost * logisticsMultiplier;
    return effectivePrice * part.annualDemand * (1 + effectiveFreightOhdRate);
  };
  
  const totalAnnualSpend = useMemo(() => {
    return parts.reduce((sum, p) => sum + calculateSpend(p), 0);
  }, [parts, factoryInventoryOHPercent, totalLogisticsCostPercent]);

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
      spend: calculateSpend(part),
    })).sort((a,b) => b.spend - a.spend).slice(0,10);
  }, [parts, factoryInventoryOHPercent, totalLogisticsCostPercent]);

  const spendByCategoryData: SpendDataPoint[] = useMemo(() => {
    const categorySpend: Record<string, number> = {};
    partCategoryMappings.forEach(mapping => {
      const part = parts.find(p => p.id === mapping.partId);
      if (part) {
        const spend = calculateSpend(part);
        categorySpend[mapping.categoryName] = (categorySpend[mapping.categoryName] || 0) + spend;
      }
    });
    return Object.entries(categorySpend)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a,b) => b.spend - a.spend);
  }, [parts, partCategoryMappings, factoryInventoryOHPercent, totalLogisticsCostPercent]);

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
        const spend = calculateSpend(part);
        commoditySpend[mapping.commodityName] = (commoditySpend[mapping.commodityName] || 0) + spend;
      }
    });
    return Object.entries(commoditySpend)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a,b) => b.spend - a.spend);
  }, [parts, partCommodityMappings, factoryInventoryOHPercent, totalLogisticsCostPercent]);


  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
          <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:px-6 lg:px-8">
            <LogoIcon className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-headline font-semibold text-foreground whitespace-nowrap">
              Spend Analysis by !TADA
            </h1>
            <div className="flex-grow flex items-center space-x-4 ml-4">
              <div className="flex items-center space-x-2">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="factoryOHDSlider" className="text-xs text-muted-foreground whitespace-nowrap">Inv. OHD:</Label>
                <Slider
                  id="factoryOHDSlider"
                  min={0}
                  max={200}
                  step={1}
                  value={[factoryInventoryOHPercent]}
                  onValueChange={(value) => setFactoryInventoryOHPercent(value[0])}
                  className="w-24 md:w-32"
                />
                <span className="text-xs text-foreground w-10 text-right">{factoryInventoryOHPercent}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <PercentCircle className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="logisticsCostInput" className="text-xs text-muted-foreground whitespace-nowrap">Logistics:</Label>
                <Input
                  id="logisticsCostInput"
                  type="number"
                  min={0}
                  max={200}
                  step={1}
                  value={totalLogisticsCostPercent}
                  onChange={(e) => setTotalLogisticsCostPercent(parseInt(e.target.value, 10) || 0)}
                  className="h-7 w-16 text-xs"
                />
                 <span className="text-xs text-foreground">%</span>
              </div>
            </div>

            <div className="ml-auto flex items-center space-x-2">
              <span className="text-sm text-muted-foreground mr-2 hidden md:inline">Source: {currentFilename}</span>
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

        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 pb-16"> 
          <section aria-labelledby="summary-stats-title" className={`sticky top-16 z-40 bg-background py-4 shadow-sm`}>
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

          <Tabs defaultValue="update-parts" className="w-full mt-4"> 
            <TabsList className={`sticky z-30 bg-background pt-1 pb-2 shadow-sm grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 text-xs`} style={{top: `${TABSLIST_STICKY_TOP_PX}px`}}>
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
            
            <TabsContent value="update-parts" className="mt-4"> 
              <UpdatePartsTab 
                parts={parts} 
                setParts={setParts}
                onAddPart={handleAddPart} 
                spendByPartData={spendByPartData} 
                spendByCategoryData={spendByCategoryData}
                partsPerCategoryData={partsPerCategoryData}
                onOpenUploadDialog={() => setIsPartsUploadDialogOpen(true)}
                factoryInventoryOHPercent={factoryInventoryOHPercent}
                totalLogisticsCostPercent={totalLogisticsCostPercent}
              />
            </TabsContent>
            <TabsContent value="update-suppliers" className="mt-4"> 
              <UpdateSuppliersTab 
                suppliers={suppliers} 
                setSuppliers={setSuppliers}
                onAddSupplier={handleAddSupplier} 
                onOpenUploadDialog={() => setIsSuppliersUploadDialogOpen(true)}
              />
            </TabsContent>
            <TabsContent value="part-supplier-mapping" className="mt-4"> 
              <PartSupplierMappingTab 
                parts={parts} 
                suppliers={suppliers} 
                partSupplierAssociations={partSupplierAssociations}
                setPartSupplierAssociations={setPartSupplierAssociations}
                onOpenUploadDialog={() => setIsSourceMixUploadDialogOpen(true)}
              />
            </TabsContent>
            <TabsContent value="upload-part-category" className="mt-4"> 
              <UploadPartCategoryTab 
                parts={parts} 
                partCategoryMappings={partCategoryMappings} 
                spendByCategoryData={spendByCategoryData}
                partsPerCategoryData={partsPerCategoryData}
                onOpenUploadDialog={() => setIsCategoryUploadDialogOpen(true)}
              />
            </TabsContent>
            <TabsContent value="upload-part-commodity" className="mt-4"> 
              <UploadPartCommodityTab 
                parts={parts} 
                partCommodityMappings={partCommodityMappings} 
                spendData={spendByCommodityData} 
                onOpenUploadDialog={() => setIsCommodityUploadDialogOpen(true)}
              />
            </TabsContent>
            <TabsContent value="summary" className="mt-4"> 
              <SummaryTab suppliers={suppliers} />
            </TabsContent>
          </Tabs>
        </main>
        <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-t bg-card px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8 shadow-md">
          <div>
            <span>&lt;Spend for Supply-Chains by Design&gt; Copyright TADA Cognitive 2025</span>
          </div>
          <div>
            <span>{formattedDateTime || "Loading time..."}</span>
          </div>
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
        <UploadCsvDialog
          isOpen={isPartsUploadDialogOpen}
          onClose={() => setIsPartsUploadDialogOpen(false)}
          onUpload={handleProcessPartsCsv}
          uploadType="part"
          isUploading={isUploadingPartsCsv}
        />
        <UploadCsvDialog
          isOpen={isSuppliersUploadDialogOpen}
          onClose={() => setIsSuppliersUploadDialogOpen(false)}
          onUpload={handleProcessSuppliersCsv}
          uploadType="supplier"
          isUploading={isUploadingSuppliersCsv}
        />
        <UploadCsvDialog
          isOpen={isSourceMixUploadDialogOpen}
          onClose={() => setIsSourceMixUploadDialogOpen(false)}
          onUpload={handleProcessSourceMixCsv}
          uploadType="sourcemix"
          isUploading={isUploadingSourceMixCsv}
        />
      </div>
    </TooltipProvider>
  );
}

    
