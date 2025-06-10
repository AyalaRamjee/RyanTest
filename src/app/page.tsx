
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryTab from "@/components/spendwise/summary-tab";
import UpdatePartsTab from "@/components/spendwise/update-parts";
import UpdateSuppliersTab from "@/components/spendwise/update-suppliers";
import PartSupplierMappingTab from "@/components/spendwise/part-supplier-mapping";
import UploadPartCategoryTab from "@/components/spendwise/upload-part-category";
import WhatIfAnalysisTab from "@/components/spendwise/what-if-analysis-tab";
import GenerateDataDialog from "@/components/spendwise/generate-data-dialog";
import UploadCsvDialog from "@/components/spendwise/upload-csv-dialog";
import SpendWiseBot from "@/components/spendwise/spendwise-bot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/context/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Package, Building, ArrowRightLeft, FolderTree, Sun, Moon, Sparkles, Loader2, Briefcase, Users, DollarSignIcon, Globe, PercentCircle, Shield, Lightbulb, MessageCircle, Wand2, FileX2, ArrowUpToLine, ArrowDownToLine, FileSpreadsheet, HelpCircle, Home } from "lucide-react";
import type { Part, Supplier, PartCategoryMapping, PartSupplierAssociation } from '@/types/spendwise';
import { generateSpendData } from '@/ai/flows/generate-spend-data-flow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';

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
const DEFAULT_HOME_COUNTRY = "USA";
const BASE_TARIFF_RATE = 0.05; // 5% base tariff

const HEADER_HEIGHT_PX = 64;
const SUMMARY_STATS_HEIGHT_PX = 122; // This might need adjustment if cards get significantly shorter and sticky behavior of TabsList is to be precise
const TABSLIST_STICKY_TOP_PX = HEADER_HEIGHT_PX + SUMMARY_STATS_HEIGHT_PX;

export default function SpendWiseCentralPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [partCategoryMappings, setPartCategoryMappings] = useState<PartCategoryMapping[]>([]);
  const [partSupplierAssociations, setPartSupplierAssociations] = useState<PartSupplierAssociation[]>([]);

  const [isGenerateDataDialogOpen, setIsGenerateDataDialogOpen] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);

  const [isCategoryUploadDialogOpen, setIsCategoryUploadDialogOpen] = useState(false);
  const [isUploadingCategoryCsv, setIsUploadingCategoryCsv] = useState(false);
  const [isPartsUploadDialogOpen, setIsPartsUploadDialogOpen] = useState(false);
  const [isUploadingPartsCsv, setIsUploadingPartsCsv] = useState(false);
  const [isSuppliersUploadDialogOpen, setIsSuppliersUploadDialogOpen] = useState(false);
  const [isUploadingSuppliersCsv, setIsUploadingSuppliersCsv] = useState(false);
  const [isSourceMixUploadDialogOpen, setIsSourceMixUploadDialogOpen] = useState(false);
  const [isUploadingSourceMixCsv, setIsUploadingSourceMixCsv] = useState(false);

  const [isExcelUploadDialogOpen, setIsExcelUploadDialogOpen] = useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);

  const [tariffRateMultiplierPercent, setTariffRateMultiplierPercent] = useState(100);
  const [totalLogisticsCostPercent, setTotalLogisticsCostPercent] = useState(100);

  const [xmlConfigString, setXmlConfigString] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>(DEFAULT_XML_FILENAME);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formattedDateTime, setFormattedDateTime] = useState<string>('');

  const [appHomeCountry, setAppHomeCountry] = useState<string>(DEFAULT_HOME_COUNTRY);

  const uniqueSupplierCountriesForApp = useMemo(() => {
    const countries = Array.from(new Set(suppliers.map(s => s.country)));
    if (!countries.includes(DEFAULT_HOME_COUNTRY)) {
        countries.push(DEFAULT_HOME_COUNTRY);
    }
    return countries.sort();
  }, [suppliers]);


  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const updateDateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = hours.toString().padStart(2, '0');

      const dayName = days[now.getDay()];
      const day = now.getDate();
      const monthName = monthNames[now.getMonth()];
      const year = now.getFullYear();

      const timeZoneShort = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
                                .formatToParts(now).find(part => part.type === 'timeZoneName')?.value || '';

      setFormattedDateTime(`${dayName}, ${monthName} ${day}, ${year} at ${hoursStr}:${minutes} ${ampm} ${timeZoneShort}`);
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
      setPartSupplierAssociations(newPartSupplierAssociations);
      setCurrentFilename(filename);

      toast({ title: "Success", description: `Configuration from "${filename}" loaded.` });
    } catch (error) {
      console.error("Error processing XML data:", error);
      toast({ variant: "destructive", title: "Error Loading Data", description: "Could not process the XML data." });
    }
  }, [toast, escapeXml]);

  useEffect(() => {
    const lastLoadedFile = typeof window !== 'undefined' ? localStorage.getItem(LAST_LOADED_FILENAME_KEY) : null;
    const filenameToLoad = lastLoadedFile || DEFAULT_XML_FILENAME;

    const storedXmlData = typeof window !== 'undefined' ? localStorage.getItem(APP_CONFIG_DATA_KEY_PREFIX + filenameToLoad) : null;

    if (storedXmlData) {
      parseAndSetXmlData(storedXmlData, filenameToLoad);
    } else {
      setCurrentFilename(DEFAULT_XML_FILENAME);
      if (!parts.length && !suppliers.length) { 
         handleLoadSampleData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseAndSetXmlData]); 

  useEffect(() => {
    let xmlStringGen = '<SpendData>\n';
    xmlStringGen += '  <Parts>\n';
    parts.forEach(p => {
      xmlStringGen += `    <Part id="${escapeXml(p.id)}" partNumber="${escapeXml(p.partNumber)}" name="${escapeXml(p.name)}" price="${p.price}" annualDemand="${p.annualDemand}" freightOhdCost="${p.freightOhdCost}" />\n`;
    });
    xmlStringGen += '  </Parts>\n';

    xmlStringGen += '  <Suppliers>\n';
    suppliers.forEach(s => {
      xmlStringGen += `    <Supplier id="${escapeXml(s.id)}" supplierId="${escapeXml(s.supplierId)}" name="${escapeXml(s.name)}" description="${escapeXml(s.description)}" address="${escapeXml(s.address)}" streetAddress="${escapeXml(s.streetAddress)}" city="${escapeXml(s.city)}" stateOrProvince="${escapeXml(s.stateOrProvince)}" postalCode="${escapeXml(s.postalCode)}" country="${escapeXml(s.country)}" />\n`;
    });
    xmlStringGen += '  </Suppliers>\n';

    xmlStringGen += '  <PartCategoryMappings>\n';
    partCategoryMappings.forEach(m => {
      xmlStringGen += `    <Mapping id="${escapeXml(m.id)}" partId="${escapeXml(m.partId)}" categoryName="${escapeXml(m.categoryName)}" />\n`;
    });
    xmlStringGen += '  </PartCategoryMappings>\n';


    xmlStringGen += '  <PartSupplierAssociations>\n';
    partSupplierAssociations.forEach(a => {
      xmlStringGen += `    <Association id="${escapeXml(a.id)}" partId="${escapeXml(a.partId)}" supplierId="${escapeXml(a.supplierId)}" />\n`;
    });
    xmlStringGen += '  </PartSupplierAssociations>\n';

    xmlStringGen += '</SpendData>';
    setXmlConfigString(xmlStringGen);

    if (currentFilename && typeof window !== 'undefined') {
        localStorage.setItem(APP_CONFIG_DATA_KEY_PREFIX + currentFilename, xmlStringGen);
        localStorage.setItem(LAST_LOADED_FILENAME_KEY, currentFilename);
    }

  }, [parts, suppliers, partCategoryMappings, partSupplierAssociations, escapeXml, currentFilename]);

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

  const handleGenerateData = async (domain: string, numPartsToGen: number, numSuppliersToGen: number, numCategoriesToGen: number) => {
    setIsGeneratingData(true);
    try {
      const generatedData = await generateSpendData({ domain, numParts: numPartsToGen, numSuppliers: numSuppliersToGen, numCategories: numCategoriesToGen });

      const newPartsArr: Part[] = [];
      const newPartCategoryMappingsArr: PartCategoryMapping[] = [];

      generatedData.parts.forEach((p, i) => {
        const partId = `p${Date.now()}${i}`;
        newPartsArr.push({
          id: partId,
          partNumber: p.partNumber,
          name: p.name,
          price: parseFloat((Math.random() * 1000 + 5).toFixed(2)),
          annualDemand: Math.floor(Math.random() * 50000) + 1000,
          freightOhdCost: parseFloat((Math.random() * 0.05).toFixed(4)),
        });
        if (generatedData.categories.length > 0) {
          newPartCategoryMappingsArr.push({
            id: `pcm${Date.now()}${i}`,
            partId: partId,
            categoryName: generatedData.categories[i % generatedData.categories.length],
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

    if (parts.length === 0 || !partCategoryMappings.some(m => m.partId === newPartId)) {
        setPartCategoryMappings(prev => [...prev, { id: `pcm${Date.now()}_manual`, partId: newPartId, categoryName: defaultCategory}]);
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

  const processCsvUpload = async (file: File, type: 'category' | 'part' | 'supplier' | 'sourcemix') => {
    let isProcessingSetter: React.Dispatch<React.SetStateAction<boolean>> | null = null;
    switch(type) {
      case 'category': isProcessingSetter = setIsUploadingCategoryCsv; break;
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

          if (type === 'category') {
            const newMappings: PartCategoryMapping[] = [];
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
              if (columns.length < 2) { errors.push(`Row ${i+1}: Not enough columns.`); skippedCount++; continue; }
              const partNumber = columns[0];
              const name = columns[1];
              if (!partNumber || !name) { errors.push(`Row ${i+1}: Missing PartNumber or Name.`); skippedCount++; continue; }
              const part = parts.find(p => p.partNumber === partNumber);
              if (!part) { errors.push(`Row ${i+1}: PartNumber "${partNumber}" not found.`); skippedCount++; continue; }

              newMappings.push({ id: `pcm_csv_${Date.now()}_${i}`, partId: part.id, categoryName: name });
              processedCount++;
            }
            setPartCategoryMappings(prev => [...prev, ...newMappings]);
          } else if (type === 'part') {
            const newPartsArr: Part[] = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
                if (columns.length < 5) { errors.push(`Row ${i+1}: Not enough columns. Expected PartNumber,Name,Price,AnnualDemand,FreightOhdCost(%).`); skippedCount++; continue; }
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
  
  const handleProcessExcelWorkbook = async (file: File) => {
    setIsUploadingExcel(true);
    
    try {
      const fileBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });

      const workbook = XLSX.read(fileBuffer, { cellStyles: true, cellFormulas: true, cellDates: true, cellNF: true, sheetStubs: true });
      
      const errors: string[] = [];
      const newPartsArr: Part[] = [];
      const newSuppliersArr: Supplier[] = [];
      const newAssociations: PartSupplierAssociation[] = [];

      const findActualSheetName = (searchNames: string[]) => {
        return Object.keys(workbook.Sheets).find(actualSheetName => 
          searchNames.some(searchName => actualSheetName.trim().toLowerCase() === searchName.toLowerCase())
        );
      };

      const partsSheetName = findActualSheetName(['Parts', 'parts', 'PARTS']);
      if (partsSheetName) {
        const partsData = XLSX.utils.sheet_to_json(workbook.Sheets[partsSheetName]);
        partsData.forEach((row: any, index) => {
          try {
            const partNumber = String(row['PartNumber'] || '').trim();
            const name = String(row['Name'] || '').trim();
            const price = parseFloat(row['Price'] || '0');
            const annualDemand = parseInt(row['AnnualDemand'] || '0', 10);
            const freightOhdCostRaw = row['FreightOhdCost'] || row['FreightOhdCost(%)'] || '0';
            let freightOhdCost = 0;
            if (typeof freightOhdCostRaw === 'string' && freightOhdCostRaw.includes('%')) {
                freightOhdCost = parseFloat(freightOhdCostRaw.replace('%','')) / 100;
            } else {
                freightOhdCost = parseFloat(freightOhdCostRaw) / 100; 
            }

            if (!partNumber || !name || isNaN(price) || isNaN(annualDemand) || isNaN(freightOhdCost)) {
              errors.push(`Parts Row ${index + 2}: Invalid data for PartNumber, Name, Price, AnnualDemand, or FreightOhdCost.`); return;
            }
            if (parts.some(p => p.partNumber === partNumber) || newPartsArr.some(p => p.partNumber === partNumber)) return;
            newPartsArr.push({ id: `p_excel_${Date.now()}_${index}`, partNumber, name, price, annualDemand, freightOhdCost });
          } catch (err) { errors.push(`Parts Row ${index + 2}: ${err instanceof Error ? err.message : String(err)}`); }
        });
      }

      const suppliersSheetName = findActualSheetName(['Suppliers', 'suppliers', 'SUPPLIERS']);
      if (suppliersSheetName) {
        const suppliersData = XLSX.utils.sheet_to_json(workbook.Sheets[suppliersSheetName]);
        suppliersData.forEach((row: any, index) => {
          try {
            const supplierId = String(row['SupplierId'] || '').trim();
            const name = String(row['Name'] || '').trim();
            const description = String(row['Description'] || '').trim();
            const streetAddress = String(row['StreetAddress'] || '').trim();
            const city = String(row['City'] || '').trim();
            const stateOrProvince = String(row['StateOrProvince'] || '').trim();
            const postalCode = String(row['PostalCode'] || '').trim();
            const country = String(row['Country'] || '').trim();

            if (!supplierId || !name) { errors.push(`Suppliers Row ${index + 2}: Missing SupplierId or Name`); return; }
            if (suppliers.some(s => s.supplierId === supplierId) || newSuppliersArr.some(s => s.supplierId === supplierId)) return;
            const fullAddress = [streetAddress, city, stateOrProvince, postalCode, country].filter(Boolean).join(', ');
            newSuppliersArr.push({ id: `s_excel_${Date.now()}_${index}`, supplierId, name, description, streetAddress, city, stateOrProvince, postalCode, country, address: fullAddress });
          } catch (err) { errors.push(`Suppliers Row ${index + 2}: ${err instanceof Error ? err.message : String(err)}`); }
        });
      }
      
      const supplierMixSheetName = findActualSheetName(['Supplier Mix', 'SupplierMix', 'SUPPLIER MIX', 'supplier mix', 'Source Mix', 'SourceMix']);
      if (supplierMixSheetName) {
        const mixData = XLSX.utils.sheet_to_json(workbook.Sheets[supplierMixSheetName]);
        const allPartsForMix = [...parts, ...newPartsArr];
        const allSuppliersForMix = [...suppliers, ...newSuppliersArr];
        mixData.forEach((row: any, index) => {
          try {
            const partNumber = String(row['PartNumber'] || '').trim();
            const supplierIdVal = String(row['SupplierId'] || '').trim();
            if (!partNumber || !supplierIdVal) { errors.push(`Mix Row ${index + 2}: Missing PartNumber or SupplierId`); return; }
            const foundPart = allPartsForMix.find(p => p.partNumber === partNumber);
            const foundSupplier = allSuppliersForMix.find(s => s.supplierId === supplierIdVal);
            if (!foundPart) { errors.push(`Mix Row ${index + 2}: PartNumber "${partNumber}" not found`); return; }
            if (!foundSupplier) { errors.push(`Mix Row ${index + 2}: SupplierId "${supplierIdVal}" not found`); return; }
            const exists = partSupplierAssociations.some(a => a.partId === foundPart.id && a.supplierId === foundSupplier.id) || newAssociations.some(a => a.partId === foundPart.id && a.supplierId === foundSupplier.id);
            if (exists) return;
            newAssociations.push({ id: `psa_excel_${Date.now()}_${index}`, partId: foundPart.id, supplierId: foundSupplier.id });
          } catch (err) { errors.push(`Mix Row ${index + 2}: ${err instanceof Error ? err.message : String(err)}`); }
        });
      }

      if (newPartsArr.length > 0) setParts(prev => [...prev, ...newPartsArr]);
      if (newSuppliersArr.length > 0) setSuppliers(prev => [...prev, ...newSuppliersArr]);
      if (newAssociations.length > 0) setPartSupplierAssociations(prev => [...prev, ...newAssociations]);

      const successMessage = `Successfully imported: ${newPartsArr.length} parts, ${newSuppliersArr.length} suppliers, ${newAssociations.length} associations.`;
      if (errors.length > 0) {
        console.warn('Excel Upload Errors:', errors.slice(0, 10));
        toast({ variant: "destructive", title: "Partially Successful", description: `${successMessage} ${errors.length} errors occurred. Check console.`, duration: 5000 });
      } else {
        toast({ title: "Excel Upload Complete", description: successMessage });
      }
      setIsExcelUploadDialogOpen(false);
    } catch (error) {
      console.error("Excel processing error:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: `Could not process Excel file: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const handleLoadSampleData = useCallback(async () => {
    setIsLoadingSampleData(true);
    try {
      const response = await fetch('/Spend Analysis.xlsx');
      if (!response.ok) throw new Error(`Sample file not found (status: ${response.status})`);
      const arrayBuffer = await response.arrayBuffer();
      const file = new File([arrayBuffer], 'Spend Analysis.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      await handleProcessExcelWorkbook(file);
      toast({ title: "Sample Data Loaded!", description: "Successfully loaded sample data from built-in Excel file." });
    } catch (error) {
      console.error('Error loading sample data:', error);
      toast({ variant: "destructive", title: "Sample Data Error", description: `Could not load sample data. ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsLoadingSampleData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); 


  const handleClearAllData = () => {
    setParts([]);
    setSuppliers([]);
    setPartCategoryMappings([]);
    setPartSupplierAssociations([]);
    setTariffRateMultiplierPercent(100);
    setTotalLogisticsCostPercent(100);
    setAppHomeCountry(DEFAULT_HOME_COUNTRY);

    if (typeof window !== 'undefined' && currentFilename) {
      localStorage.removeItem(APP_CONFIG_DATA_KEY_PREFIX + currentFilename);
    }
    
    setCurrentFilename(DEFAULT_XML_FILENAME);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_LOADED_FILENAME_KEY, DEFAULT_XML_FILENAME);
      localStorage.removeItem(APP_CONFIG_DATA_KEY_PREFIX + DEFAULT_XML_FILENAME); 
    }

    toast({ title: "All Data Cleared", description: "Application data has been reset to default." });
  };


  const totalParts = useMemo(() => parts.length, [parts]);
  const totalSuppliers = useMemo(() => suppliers.length, [suppliers]);
  const totalCategories = useMemo(() => new Set(partCategoryMappings.map(m => m.categoryName)).size, [partCategoryMappings]);

  const calculateSpendForPart = useCallback((
    part: Part,
    currentTariffMultiplierPercent: number,
    currentTotalLogisticsCostPercent: number,
    localSuppliers: Supplier[],
    localPartSupplierAssociations: PartSupplierAssociation[],
    homeCountryParam: string
  ): number => {
    let priceAfterTariff = part.price;
    const isImported = localPartSupplierAssociations
      .filter(assoc => assoc.partId === part.id)
      .some(assoc => {
        const supplier = localSuppliers.find(s => s.id === assoc.supplierId);
        return supplier && supplier.country !== homeCountryParam;
      });

    if (isImported) {
      const effectiveTariffRate = BASE_TARIFF_RATE * (currentTariffMultiplierPercent / 100);
      priceAfterTariff = part.price * (1 + effectiveTariffRate);
    }

    const logisticsRateMultiplier = currentTotalLogisticsCostPercent / 100;
    const effectiveFreightOhdRate = part.freightOhdCost * logisticsRateMultiplier;

    return priceAfterTariff * part.annualDemand * (1 + effectiveFreightOhdRate);
  }, []);

  const partsWithSpend = useMemo(() => {
    return parts.map(part => ({
      ...part,
      annualSpend: calculateSpendForPart(
        part,
        tariffRateMultiplierPercent,
        totalLogisticsCostPercent,
        suppliers,
        partSupplierAssociations,
        appHomeCountry
      ),
    }));
  }, [parts, tariffRateMultiplierPercent, totalLogisticsCostPercent, suppliers, partSupplierAssociations, appHomeCountry, calculateSpendForPart]);

  const totalAnnualSpend = useMemo(() => {
    return partsWithSpend.reduce((sum, p) => sum + p.annualSpend, 0);
  }, [partsWithSpend]);

  const formatCurrencyDisplay = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const summaryStats = [
    { Icon: Briefcase, label: "Total Parts", value: totalParts },
    { Icon: Users, label: "Total Suppliers", value: totalSuppliers },
    { Icon: FolderTree, label: "Categories", value: totalCategories },
    { Icon: DollarSignIcon, label: "$ Spend/Year", value: formatCurrencyDisplay(totalAnnualSpend) },
  ];

  const spendByPartData: SpendDataPoint[] = useMemo(() => {
    return partsWithSpend
      .map(part => ({
        name: part.partNumber,
        spend: part.annualSpend,
      }))
      .sort((a,b) => b.spend - a.spend)
      .slice(0,10);
  }, [partsWithSpend]);

  const spendByCategoryData: SpendDataPoint[] = useMemo(() => {
    const categorySpend: Record<string, number> = {};
    partCategoryMappings.forEach(mapping => {
      const part = partsWithSpend.find(p => p.id === mapping.partId);
      if (part) {
        categorySpend[mapping.categoryName] = (categorySpend[mapping.categoryName] || 0) + part.annualSpend;
      }
    });
    return Object.entries(categorySpend)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a,b) => b.spend - a.spend);
  }, [partsWithSpend, partCategoryMappings]);

  const partsPerCategoryData: CountDataPoint[] = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    partCategoryMappings.forEach(mapping => {
      categoryCounts[mapping.categoryName] = (categoryCounts[mapping.categoryName] || 0) + 1;
    });
    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [partCategoryMappings]);

  useEffect(() => {
    const hasExistingData = parts.length > 0 || suppliers.length > 0;
    const lastFile = typeof window !== 'undefined' ? localStorage.getItem(LAST_LOADED_FILENAME_KEY) : null;
    const defaultDataExists = typeof window !== 'undefined' ? localStorage.getItem(APP_CONFIG_DATA_KEY_PREFIX + DEFAULT_XML_FILENAME) : null;
    
    if (!hasExistingData && (!lastFile || lastFile === DEFAULT_XML_FILENAME) && !defaultDataExists) {
        handleLoadSampleData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
          <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:px-6 lg:px-8">
          <img
            src="/TADA_TM-2023_Color-White-Logo.svg"
            alt="TADA Logo"
            className="h-18 w-16 object-contain"
            data-ai-hint="logo company"
          />
          <h1 className="text-xl font-headline font-semibold text-foreground whitespace-nowrap">
            Spend by TADA
          </h1>
            <div className="flex-grow flex items-center space-x-4 ml-4">
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent><p>Application Home Country (for base calculations)</p></TooltipContent>
                </Tooltip>
                 <Select value={appHomeCountry} onValueChange={setAppHomeCountry}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder="Home Country" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueSupplierCountriesForApp.map(country => (
                            <SelectItem key={country} value={country} className="text-xs">{country}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="tariffRateMultiplierSlider" className="text-xs text-muted-foreground whitespace-nowrap">Tariff Mult:</Label>
                 <Slider
                  id="tariffRateMultiplierSlider"
                  min={0} 
                  max={300} 
                  step={1}
                  value={[tariffRateMultiplierPercent]}
                  onValueChange={(value) => setTariffRateMultiplierPercent(value[0])}
                  className="w-24 h-2"
                />
                <span className="text-xs text-foreground w-8 text-right">{tariffRateMultiplierPercent}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <PercentCircle className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="logisticsCostSlider" className="text-xs text-muted-foreground whitespace-nowrap">Logistics:</Label>
                <Slider
                  id="logisticsCostSlider"
                  min={50}
                  max={200}
                  step={1}
                  value={[totalLogisticsCostPercent]}
                  onValueChange={(value) => setTotalLogisticsCostPercent(value[0])}
                  className="w-24 h-2"
                />
                 <span className="text-xs text-foreground w-8 text-right">{totalLogisticsCostPercent}%</span>
              </div>
            </div>

            <div className="ml-auto flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleLoadSampleData} 
                    disabled={isLoadingSampleData || isUploadingExcel} 
                    aria-label="Load Sample Data"
                    className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-200 dark:border-blue-700"
                  >
                    {isLoadingSampleData ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Load Sample Data (Excel)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsExcelUploadDialogOpen(true)} disabled={isUploadingExcel || isLoadingSampleData} aria-label="Upload Excel Workbook">
                    {isUploadingExcel ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload Excel Workbook</p>
                </TooltipContent>
              </Tooltip>

               <SpendWiseBot
                parts={parts}
                suppliers={suppliers}
                partCategoryMappings={partCategoryMappings}
                partSupplierAssociations={partSupplierAssociations}
                tariffChargePercent={tariffRateMultiplierPercent} // This is the multiplier
                totalLogisticsCostPercent={totalLogisticsCostPercent}
                homeCountry={appHomeCountry}
                totalAnnualSpend={totalAnnualSpend}
                totalParts={totalParts}
                totalSuppliers={totalSuppliers}
                totalCategories={totalCategories}
              />
              <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept=".xml" style={{ display: 'none' }} />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleClearAllData} aria-label="Clear All Data">
                    <FileX2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear All Data</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleLoadButtonClick} aria-label="Load Configuration XML">
                    <ArrowUpToLine className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Load Configuration (XML)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleDownloadXml} aria-label="Download Configuration XML">
                    <ArrowDownToLine className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download Configuration (XML)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsGenerateDataDialogOpen(true)} disabled={isGeneratingData} aria-label="Generate Sample Data">
                    {isGeneratingData ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Wand2 className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate Sample Data</p>
                </TooltipContent>
              </Tooltip>
              <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'tada')}>
                <SelectTrigger className="w-[40px] px-2" aria-label="Select Theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light" className="flex justify-center">
                    <Sun className="h-4 w-4" />
                  </SelectItem>
                  <SelectItem value="dark" className="flex justify-center">
                    <Moon className="h-4 w-4" />
                  </SelectItem>
                  <SelectItem value="tada" className="flex justify-center">
                    <Sparkles className="h-4 w-4" />
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 pb-16">
          <section aria-labelledby="summary-stats-title" className={`sticky top-16 z-40 bg-background shadow-sm -mt-1`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 p-2">
              {summaryStats.map(stat => (
                <Card key={stat.label} className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <stat.Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pt-1 pb-2">
                    <div className="text-xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Tabs defaultValue="update-parts" className="w-full mt-0">
            <TabsList className={`sticky z-30 bg-background pt-1 pb-2 shadow-sm grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 text-xs`} style={{top: `${TABSLIST_STICKY_TOP_PX}px`}}>
              <TabsTrigger value="update-parts" className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" /> 1. Add/Update Parts
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
              <TabsTrigger value="summary" className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> 5. Summary
              </TabsTrigger>
              <TabsTrigger value="what-if-analysis" className="flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" /> 6. What-if Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="update-parts" className="mt-4">
              <UpdatePartsTab
                parts={parts}
                setParts={setParts}
                onAddPart={handleAddPart}
                onOpenUploadDialog={() => setIsPartsUploadDialogOpen(true)}
                partsWithSpend={partsWithSpend}
                suppliers={suppliers}
                partSupplierAssociations={partSupplierAssociations}
                partCategoryMappings={partCategoryMappings}
                calculateSpendForSummary={calculateSpendForPart} 
                homeCountry={appHomeCountry} 
                tariffChargePercent={tariffRateMultiplierPercent} 
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
                setPartCategoryMappings={setPartCategoryMappings}
              />
            </TabsContent>
            <TabsContent value="summary" className="mt-4">
              <SummaryTab 
                suppliers={suppliers}
                parts={parts} 
                partsWithSpend={partsWithSpend} 
                partSupplierAssociations={partSupplierAssociations}
                spendByCategoryData={spendByCategoryData}
              />
            </TabsContent>
            <TabsContent value="what-if-analysis" className="mt-4">
              <WhatIfAnalysisTab 
                parts={parts}
                suppliers={suppliers}
                partCategoryMappings={partCategoryMappings}
                partSupplierAssociations={partSupplierAssociations}
                originalTotalAnnualSpend={totalAnnualSpend}
                originalTariffMultiplierPercent={tariffRateMultiplierPercent}
                originalTotalLogisticsCostPercent={totalLogisticsCostPercent}
                defaultAnalysisHomeCountry={appHomeCountry}
              />
            </TabsContent>
          </Tabs>
        </main>
        <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-t bg-card px-4 py-3 text-xs text-muted-foreground sm:px-6 lg:px-8 shadow-md">
          <div>
            <span>Copyright TADA Cognitive 2025</span>
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

        <Dialog open={isExcelUploadDialogOpen} onOpenChange={setIsExcelUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileSpreadsheet className="mr-2 h-5 w-5" />
                Upload Excel Workbook
              </DialogTitle>
              <DialogDescription>
                Upload a single Excel file (.xlsx, .xls) with up to 3 sheets: "Parts", "Suppliers", and "Supplier Mix" (or "SupplierMix", "SourceMix").
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-1.5">
                <Label htmlFor="excelFile">Excel Workbook (.xlsx, .xls)</Label>
                <Input
                  id="excelFile"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        handleProcessExcelWorkbook(file);
                    }
                    if (e.target) e.target.value = '';
                  }}
                  className="text-xs file:text-xs file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-accent/20 h-9"
                  disabled={isUploadingExcel || isLoadingSampleData}
                />
              </div>
               {isUploadingExcel && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing workbook...
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsExcelUploadDialogOpen(false)} disabled={isUploadingExcel || isLoadingSampleData}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

    

    