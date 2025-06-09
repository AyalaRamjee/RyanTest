
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Part, Supplier, PartCategoryMapping, PartSupplierAssociation } from '@/types/spendwise';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HelpCircle, Info, Percent, DollarSign, Trash2, PlusCircle, ChevronsUpDown, TrendingUp, Save, Upload, Edit3, Layers, BarChart3, Maximize, Minimize, Filter, PackageSearch, Palette, MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltipComponent } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";


interface WhatIfAnalysisTabProps {
  parts: Part[];
  suppliers: Supplier[];
  partCategoryMappings: PartCategoryMapping[];
  partSupplierAssociations: PartSupplierAssociation[];
  originalTotalAnnualSpend: number;
  originalTariffChargePercent: number; // Base tariff rate from main page
  originalTotalLogisticsCostPercent: number; // Base logistics rate from main page
  defaultAnalysisHomeCountry: string; // Default home country from app settings
}

interface CategoryAdjustment {
  categoryName: string;
  costAdjustmentPercent: number;
}

interface CountryTariffAdjustment {
  countryName: string;
  tariffAdjustmentPoints: number; // Points to add/subtract from existing tariff
}

interface SavedScenario {
  name: string;
  description: string;
  analysisHomeCountry: string;
  globalTariffAdjustmentPoints: number;
  globalLogisticsAdjustmentPoints: number;
  activeCategoryAdjustments: CategoryAdjustment[];
  activeCountryTariffAdjustments: CountryTariffAdjustment[];
  // Demand adjustments will be added in a later step
}

const LOCAL_STORAGE_SCENARIO_LIST_KEY = "spendwise_scenario_list_v2"; // Updated key for new structure
const LOCAL_STORAGE_SCENARIO_DATA_PREFIX = "spendwise_scenario_data_v2_";

// Waterfall Chart data structure
interface WaterfallDataPoint {
  name: string;
  value: number; // The change amount
  offset?: number; // For stacking to create waterfall effect
  fill: string; // Color for the bar
}

const chartConfigWaterfall = {
  value: { label: "Spend" },
  offset: { label: "Offset" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function WhatIfAnalysisTab({
  parts,
  suppliers,
  partCategoryMappings,
  partSupplierAssociations,
  originalTotalAnnualSpend,
  originalTariffChargePercent,
  originalTotalLogisticsCostPercent,
  defaultAnalysisHomeCountry,
}: WhatIfAnalysisTabProps) {
  const { toast } = useToast();

  const [analysisHomeCountry, setAnalysisHomeCountry] = useState<string>(defaultAnalysisHomeCountry);
  const [globalTariffAdjustmentPoints, setGlobalTariffAdjustmentPoints] = useState(0);
  const [globalLogisticsAdjustmentPoints, setGlobalLogisticsAdjustmentPoints] = useState(0);
  
  const [selectedCategoryForAdjustment, setSelectedCategoryForAdjustment] = useState<string>("");
  const [categoryCostAdjustmentValue, setCategoryCostAdjustmentValue] = useState(0);
  const [activeCategoryAdjustments, setActiveCategoryAdjustments] = useState<CategoryAdjustment[]>([]);

  const [selectedCountryForTariff, setSelectedCountryForTariff] = useState<string>("");
  const [countryTariffAdjustmentValue, setCountryTariffAdjustmentValue] = useState(0);
  const [activeCountryTariffAdjustments, setActiveCountryTariffAdjustments] = useState<CountryTariffAdjustment[]>([]);
  
  const [isSaveScenarioDialogOpen, setIsSaveScenarioDialogOpen] = useState(false);
  const [currentScenarioName, setCurrentScenarioName] = useState("");
  const [currentScenarioDescription, setCurrentScenarioDescription] = useState("");
  const [savedScenarioNames, setSavedScenarioNames] = useState<string[]>([]);
  const [selectedScenarioToLoad, setSelectedScenarioToLoad] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const storedNames = localStorage.getItem(LOCAL_STORAGE_SCENARIO_LIST_KEY);
    if (storedNames) {
      setSavedScenarioNames(JSON.parse(storedNames));
    }
    setAnalysisHomeCountry(defaultAnalysisHomeCountry); // Initialize with default from props
  }, [defaultAnalysisHomeCountry]);

  const uniqueCategories = useMemo(() => Array.from(new Set(partCategoryMappings.map(pcm => pcm.categoryName))).sort(), [partCategoryMappings]);
  
  const uniqueSupplierCountriesForAnalysis = useMemo(() => {
    const countries = Array.from(new Set(suppliers.map(s => s.country)));
    if (defaultAnalysisHomeCountry && !countries.includes(defaultAnalysisHomeCountry)) {
        countries.push(defaultAnalysisHomeCountry);
    }
    return countries.sort();
  }, [suppliers, defaultAnalysisHomeCountry]);

  const formatCurrency = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  const calculateAdjustedSpendForPart = useCallback((
    part: Part,
    currentAnalysisHomeCountry: string,
    currentGlobalTariffAdj: number,
    currentGlobalLogisticsAdj: number,
    currentCategoryAdjs: CategoryAdjustment[],
    currentCountryTariffAdjs: CountryTariffAdjustment[]
  ): number => {
    let adjustedPrice = part.price;

    // 1. Apply Category Cost Adjustments
    const categoryMappingsForPart = partCategoryMappings.filter(pcm => pcm.partId === part.id);
    for (const mapping of categoryMappingsForPart) {
      const categoryAdjustment = currentCategoryAdjs.find(adj => adj.categoryName === mapping.categoryName);
      if (categoryAdjustment) {
        adjustedPrice *= (1 + categoryAdjustment.costAdjustmentPercent / 100);
      }
    }
    
    // 2. Determine if imported & Apply Tariffs
    const partSuppliers = partSupplierAssociations
      .filter(assoc => assoc.partId === part.id)
      .map(assoc => suppliers.find(s => s.id === assoc.supplierId))
      .filter(s => s !== undefined) as Supplier[];

    let tariffMultiplier = 1.0; // Default for domestic
    if (partSuppliers.length > 0) { // Only apply tariff if there's a supplier
      // If any supplier is foreign relative to currentAnalysisHomeCountry, the part is considered imported
      const isEffectivelyImported = partSuppliers.some(s => s.country !== currentAnalysisHomeCountry);
      
      if (isEffectivelyImported) {
        let effectiveTariffPercent = originalTariffChargePercent + currentGlobalTariffAdj;
        // Apply country-specific tariff adjustment (if one matches, it takes precedence for this part's suppliers)
        // For simplicity, using the first matching supplier's country adjustment if multiple foreign suppliers
        const foreignSupplierCountries = partSuppliers.filter(s => s.country !== currentAnalysisHomeCountry).map(s => s.country);
        let countrySpecificApplied = false;
        for (const country of foreignSupplierCountries) {
            const countryAdjustment = currentCountryTariffAdjs.find(adj => adj.countryName === country);
            if (countryAdjustment) {
                effectiveTariffPercent += countryAdjustment.tariffAdjustmentPoints;
                countrySpecificApplied = true; 
                break; 
            }
        }
        tariffMultiplier = Math.max(0, effectiveTariffPercent / 100);
      }
    }
    adjustedPrice *= tariffMultiplier;
    
    // 3. Apply Logistics Costs
    const effectiveLogisticsPercent = originalTotalLogisticsCostPercent + currentGlobalLogisticsAdj;
    const logisticsRateMultiplier = Math.max(0, effectiveLogisticsPercent / 100);
    const effectiveFreightOhdRate = part.freightOhdCost * logisticsRateMultiplier;
    
    return adjustedPrice * part.annualDemand * (1 + effectiveFreightOhdRate);
  }, [
    partCategoryMappings, partSupplierAssociations, suppliers,
    originalTariffChargePercent, originalTotalLogisticsCostPercent
  ]);

  const scenarioImpacts = useMemo(() => {
    const results = {
      baseSpend: originalTotalAnnualSpend,
      afterGlobalTariff: originalTotalAnnualSpend,
      afterGlobalLogistics: originalTotalAnnualSpend,
      afterCategoryChanges: originalTotalAnnualSpend,
      finalWhatIfSpend: originalTotalAnnualSpend,
      impactGlobalTariff: 0,
      impactGlobalLogistics: 0,
      impactCategory: 0,
      impactCountryTariff: 0, // This will be part of the final spend calculation
    };

    if (!parts || parts.length === 0) return results;

    // Calculate spend with only global tariff adjustment
    results.afterGlobalTariff = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(part, analysisHomeCountry, globalTariffAdjustmentPoints, 0, [], []), 0);
    results.impactGlobalTariff = results.afterGlobalTariff - results.baseSpend;

    // Calculate spend with global tariff AND global logistics
    results.afterGlobalLogistics = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(part, analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, [], []), 0);
    results.impactGlobalLogistics = results.afterGlobalLogistics - results.afterGlobalTariff;
    
    // Calculate spend with global tariff, global logistics, AND category changes
    results.afterCategoryChanges = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(part, analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, activeCategoryAdjustments, []), 0);
    results.impactCategory = results.afterCategoryChanges - results.afterGlobalLogistics;

    // Final What-if Spend (includes all adjustments, including country-specific tariffs)
    results.finalWhatIfSpend = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(part, analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, activeCategoryAdjustments, activeCountryTariffAdjustments), 0);
    // The impact of country-specific tariffs is the remainder to reach the final spend
    results.impactCountryTariff = results.finalWhatIfSpend - results.afterCategoryChanges;
    
    return results;
  }, [
    parts, originalTotalAnnualSpend, calculateAdjustedSpendForPart,
    analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints,
    activeCategoryAdjustments, activeCountryTariffAdjustments
  ]);
  
  const whatIfTotalAnnualSpend = scenarioImpacts.finalWhatIfSpend;
  const netChangeAmount = whatIfTotalAnnualSpend - originalTotalAnnualSpend;
  const netChangePercent = originalTotalAnnualSpend !== 0 ? (netChangeAmount / originalTotalAnnualSpend) * 100 : 0;

  const waterfallChartData = useMemo(() => {
    const data: WaterfallDataPoint[] = [];
    let cumulative = 0;

    data.push({ name: "Base Spend", value: scenarioImpacts.baseSpend, offset: 0, fill: "hsl(var(--chart-3))" });
    cumulative = scenarioImpacts.baseSpend;

    if (scenarioImpacts.impactGlobalTariff !== 0) {
      data.push({ 
        name: "Tariff Adj.", 
        value: scenarioImpacts.impactGlobalTariff, 
        offset: scenarioImpacts.impactGlobalTariff < 0 ? cumulative + scenarioImpacts.impactGlobalTariff : cumulative,
        fill: scenarioImpacts.impactGlobalTariff < 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))" // Green for decrease, Red for increase
      });
      cumulative += scenarioImpacts.impactGlobalTariff;
    }

    if (scenarioImpacts.impactGlobalLogistics !== 0) {
      data.push({ 
        name: "Logistics Adj.", 
        value: scenarioImpacts.impactGlobalLogistics, 
        offset: scenarioImpacts.impactGlobalLogistics < 0 ? cumulative + scenarioImpacts.impactGlobalLogistics : cumulative,
        fill: scenarioImpacts.impactGlobalLogistics < 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"
      });
      cumulative += scenarioImpacts.impactGlobalLogistics;
    }
    
    if (scenarioImpacts.impactCategory !== 0) {
      data.push({ 
        name: "Category Adj.", 
        value: scenarioImpacts.impactCategory, 
        offset: scenarioImpacts.impactCategory < 0 ? cumulative + scenarioImpacts.impactCategory : cumulative,
        fill: scenarioImpacts.impactCategory < 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"
      });
      cumulative += scenarioImpacts.impactCategory;
    }

    if (scenarioImpacts.impactCountryTariff !== 0) {
       data.push({ 
        name: "Country Tariff Adj.", 
        value: scenarioImpacts.impactCountryTariff, 
        offset: scenarioImpacts.impactCountryTariff < 0 ? cumulative + scenarioImpacts.impactCountryTariff : cumulative,
        fill: scenarioImpacts.impactCountryTariff < 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"
      });
      cumulative += scenarioImpacts.impactCountryTariff;
    }

    data.push({ name: "What-if Spend", value: cumulative, offset: 0, fill: "hsl(var(--chart-1))" });
    
    return data;
  }, [scenarioImpacts]);

  const pnlTableData = [
    { component: "Base Spend", impact: scenarioImpacts.baseSpend, scenarioValue: scenarioImpacts.baseSpend },
    { component: "Global Tariff Impact", impact: scenarioImpacts.impactGlobalTariff, scenarioValue: scenarioImpacts.baseSpend + scenarioImpacts.impactGlobalTariff },
    { component: "Global Logistics Impact", impact: scenarioImpacts.impactGlobalLogistics, scenarioValue: scenarioImpacts.baseSpend + scenarioImpacts.impactGlobalTariff + scenarioImpacts.impactGlobalLogistics },
    { component: "Category Adjustments Impact", impact: scenarioImpacts.impactCategory, scenarioValue: scenarioImpacts.baseSpend + scenarioImpacts.impactGlobalTariff + scenarioImpacts.impactGlobalLogistics + scenarioImpacts.impactCategory },
    { component: "Country Tariff Impact", impact: scenarioImpacts.impactCountryTariff, scenarioValue: scenarioImpacts.finalWhatIfSpend },
  ];


  const handleAddCategoryAdjustment = () => {
    if (!selectedCategoryForAdjustment) {
      toast({title: "Select Category", description: "Please select a category to apply adjustment.", variant: "destructive"});
      return;
    }
    setActiveCategoryAdjustments(prev => {
      const existing = prev.find(adj => adj.categoryName === selectedCategoryForAdjustment);
      if (existing) {
        return prev.map(adj => adj.categoryName === selectedCategoryForAdjustment ? { ...adj, costAdjustmentPercent: categoryCostAdjustmentValue } : adj);
      }
      return [...prev, { categoryName: selectedCategoryForAdjustment, costAdjustmentPercent: categoryCostAdjustmentValue }];
    });
    setSelectedCategoryForAdjustment(""); 
    setCategoryCostAdjustmentValue(0);
  };

  const handleRemoveCategoryAdjustment = (categoryName: string) => {
    setActiveCategoryAdjustments(prev => prev.filter(adj => adj.categoryName !== categoryName));
  };
  
  const handleAddCountryTariffAdjustment = () => {
     if (!selectedCountryForTariff) {
      toast({title: "Select Country", description: "Please select a country to apply tariff adjustment.", variant: "destructive"});
      return;
    }
    setActiveCountryTariffAdjustments(prev => {
      const existing = prev.find(adj => adj.countryName === selectedCountryForTariff);
      if (existing) {
        return prev.map(adj => adj.countryName === selectedCountryForTariff ? { ...adj, tariffAdjustmentPoints: countryTariffAdjustmentValue } : adj);
      }
      return [...prev, { countryName: selectedCountryForTariff, tariffAdjustmentPoints: countryTariffAdjustmentValue }];
    });
    setSelectedCountryForTariff(""); 
    setCountryTariffAdjustmentValue(0);
  };

  const handleRemoveCountryTariffAdjustment = (countryName: string) => {
    setActiveCountryTariffAdjustments(prev => prev.filter(adj => adj.countryName !== countryName));
  };

  const handleOpenSaveDialog = (edit = false) => {
    setIsEditMode(edit);
    if (edit && selectedScenarioToLoad) {
        const scenarioDataString = localStorage.getItem(LOCAL_STORAGE_SCENARIO_DATA_PREFIX + selectedScenarioToLoad);
        if (scenarioDataString) {
            const scenarioData: SavedScenario = JSON.parse(scenarioDataString);
            setCurrentScenarioName(scenarioData.name);
            setCurrentScenarioDescription(scenarioData.description);
        } else { 
            setCurrentScenarioName(selectedScenarioToLoad);
            setCurrentScenarioDescription("");
        }
    } else {
        const defaultScenarioNumber = savedScenarioNames.length + 1;
        setCurrentScenarioName(`Scenario Def ${String(defaultScenarioNumber).padStart(2, '0')}`);
        setCurrentScenarioDescription("");
    }
    setIsSaveScenarioDialogOpen(true);
  };
  
  const handleSaveScenario = () => {
    if (!currentScenarioName.trim()) {
      toast({ title: "Error", description: "Scenario name cannot be empty.", variant: "destructive"});
      return;
    }
    const scenarioData: SavedScenario = {
      name: currentScenarioName.trim(),
      description: currentScenarioDescription.trim(),
      analysisHomeCountry,
      globalTariffAdjustmentPoints,
      globalLogisticsAdjustmentPoints,
      activeCategoryAdjustments,
      activeCountryTariffAdjustments,
    };
    localStorage.setItem(LOCAL_STORAGE_SCENARIO_DATA_PREFIX + scenarioData.name, JSON.stringify(scenarioData));
    
    if (!savedScenarioNames.includes(scenarioData.name)) {
      const newNames = [...savedScenarioNames, scenarioData.name].sort();
      setSavedScenarioNames(newNames);
      localStorage.setItem(LOCAL_STORAGE_SCENARIO_LIST_KEY, JSON.stringify(newNames));
    }
    
    toast({ title: "Scenario Saved", description: `Scenario "${scenarioData.name}" has been saved.`});
    setIsSaveScenarioDialogOpen(false);
    setSelectedScenarioToLoad(scenarioData.name); 
  };

  const handleLoadScenario = (scenarioName: string) => {
    if (!scenarioName) return;
    const scenarioDataString = localStorage.getItem(LOCAL_STORAGE_SCENARIO_DATA_PREFIX + scenarioName);
    if (scenarioDataString) {
      const scenarioData: SavedScenario = JSON.parse(scenarioDataString);
      setAnalysisHomeCountry(scenarioData.analysisHomeCountry);
      setGlobalTariffAdjustmentPoints(scenarioData.globalTariffAdjustmentPoints);
      setGlobalLogisticsAdjustmentPoints(scenarioData.globalLogisticsAdjustmentPoints);
      setActiveCategoryAdjustments(scenarioData.activeCategoryAdjustments);
      setActiveCountryTariffAdjustments(scenarioData.activeCountryTariffAdjustments);
      setSelectedScenarioToLoad(scenarioName);
      setCurrentScenarioName(scenarioData.name); 
      setCurrentScenarioDescription(scenarioData.description); 
      toast({ title: "Scenario Loaded", description: `Scenario "${scenarioName}" has been loaded.`});
    } else {
      toast({ title: "Error", description: `Could not load scenario "${scenarioName}".`, variant: "destructive"});
    }
  };

  const handleDeleteScenario = () => {
    if (!selectedScenarioToLoad) {
        toast({ title: "Error", description: "No scenario selected to delete.", variant: "destructive"});
        return;
    }
    localStorage.removeItem(LOCAL_STORAGE_SCENARIO_DATA_PREFIX + selectedScenarioToLoad);
    const newNames = savedScenarioNames.filter(name => name !== selectedScenarioToLoad);
    setSavedScenarioNames(newNames);
    localStorage.setItem(LOCAL_STORAGE_SCENARIO_LIST_KEY, JSON.stringify(newNames));
    toast({ title: "Scenario Deleted", description: `Scenario "${selectedScenarioToLoad}" has been deleted.`});
    setSelectedScenarioToLoad(""); 
    // Reset controls to default
    setAnalysisHomeCountry(defaultAnalysisHomeCountry);
    setGlobalTariffAdjustmentPoints(0);
    setGlobalLogisticsAdjustmentPoints(0);
    setActiveCategoryAdjustments([]);
    setActiveCountryTariffAdjustments([]);
  };
  
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <ChevronsUpDown className="mr-2 h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">What-if Controls</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedScenarioToLoad} onValueChange={handleLoadScenario}>
                        <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Load Scenario..." /></SelectTrigger>
                        <SelectContent>
                            {savedScenarioNames.length === 0 && <SelectItem value="no-scenarios" disabled className="text-xs">No saved scenarios</SelectItem>}
                            {savedScenarioNames.map(name => <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {selectedScenarioToLoad && (
                         <Button onClick={() => handleOpenSaveDialog(true)} size="sm" variant="outline" className="text-xs h-9">
                            <Edit3 className="mr-1 h-3 w-3" /> Edit
                        </Button>
                   )}
                    <Button onClick={() => handleOpenSaveDialog(false)} size="sm" variant="default" className="text-xs h-9">
                        <Save className="mr-1 h-3 w-3" /> Save New
                    </Button>
                   {selectedScenarioToLoad && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={handleDeleteScenario} size="icon" variant="destructive" className="h-9 w-9">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete '{selectedScenarioToLoad}'</p></TooltipContent>
                    </Tooltip>
                   )}
                </div>
            </div>
             <CardDescription className="text-xs mt-1">
              Adjust cost factors to see potential impact. Scenarios can be saved and loaded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="bg-muted/30 p-3">
              <CardTitle className="text-sm font-medium mb-2 flex items-center">
                <Filter className="mr-2 h-4 w-4"/>Applied What-if Parameters
              </CardTitle>
              <ScrollArea className="h-24 text-xs">
                <ul className="list-disc list-inside space-y-1">
                  <li>Analysis Home Country: <strong>{analysisHomeCountry}</strong></li>
                  <li>Global Tariff Adjustment: {globalTariffAdjustmentPoints >= 0 ? "+" : ""}{globalTariffAdjustmentPoints} points
                    <span className="text-muted-foreground text-2xs"> (Base App Tariff: {originalTariffChargePercent}%)</span>
                  </li>
                  <li>Global Logistics Adj.: {globalLogisticsAdjustmentPoints >= 0 ? "+" : ""}{globalLogisticsAdjustmentPoints} points
                     <span className="text-muted-foreground text-2xs"> (Base App Logistics: {originalTotalLogisticsCostPercent}%)</span>
                  </li>
                  {activeCategoryAdjustments.map(adj => (
                    <li key={adj.categoryName}>
                      Category '{adj.categoryName}' Cost: {adj.costAdjustmentPercent >= 0 ? "+" : ""}{adj.costAdjustmentPercent}%
                    </li>
                  ))}
                  {activeCountryTariffAdjustments.map(adj => (
                    <li key={adj.countryName}>
                      Country '{adj.countryName}' Add. Tariff: {adj.tariffAdjustmentPoints >= 0 ? "+" : ""}{adj.tariffAdjustmentPoints} points
                    </li>
                  ))}
                  {(globalTariffAdjustmentPoints === 0 && globalLogisticsAdjustmentPoints === 0 && activeCategoryAdjustments.length === 0 && activeCountryTariffAdjustments.length === 0 && analysisHomeCountry === defaultAnalysisHomeCountry) && (
                    <li className="text-muted-foreground italic">No custom scenario adjustments applied. Using base settings.</li>
                  )}
                </ul>
              </ScrollArea>
            </Card>
            
             <div className="space-y-2 p-3 border rounded-md">
                <Label htmlFor="analysisHomeCountrySelect" className="text-sm font-medium flex items-center"><MapPin className="h-4 w-4 mr-1.5"/>Scenario Home Country</Label>
                <Select value={analysisHomeCountry} onValueChange={setAnalysisHomeCountry}>
                    <SelectTrigger id="analysisHomeCountrySelect" className="h-9 text-xs">
                        <SelectValue placeholder="Select Home Country for Analysis" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueSupplierCountriesForAnalysis.map(country => (
                            <SelectItem key={country} value={country} className="text-xs">{country}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-2xs text-muted-foreground">This country is domestic for tariff calculations in this specific scenario.</p>
            </div>

            <div className="space-y-3 p-3 border rounded-md">
              <h4 className="font-medium text-sm flex items-center"><Maximize className="h-4 w-4 mr-1.5"/>Global Adjustments</h4>
              <div>
                <Label htmlFor="globalTariffSlider" className="text-xs">Global Tariff Adjustment (percentage points on Base: {originalTariffChargePercent}%)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Slider id="globalTariffSlider" min={-100} max={100} step={1} value={[globalTariffAdjustmentPoints]} onValueChange={(val) => setGlobalTariffAdjustmentPoints(val[0])} className="flex-grow" />
                  <Input type="number" value={globalTariffAdjustmentPoints} onChange={(e)=> setGlobalTariffAdjustmentPoints(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                  <span className="text-xs w-5">pts</span>
                </div>
              </div>
              <div>
                <Label htmlFor="globalLogisticsSlider" className="text-xs">Global Logistics Cost Adj. (percentage points on Base: {originalTotalLogisticsCostPercent}%)</Label>
                 <div className="flex items-center gap-2 mt-1">
                  <Slider id="globalLogisticsSlider" min={-100} max={100} step={1} value={[globalLogisticsAdjustmentPoints]} onValueChange={(val) => setGlobalLogisticsAdjustmentPoints(val[0])} className="flex-grow" />
                  <Input type="number" value={globalLogisticsAdjustmentPoints} onChange={(e)=> setGlobalLogisticsAdjustmentPoints(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                  <span className="text-xs w-5">pts</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 p-3 border rounded-md">
              <h4 className="font-medium text-sm flex items-center"><Palette className="h-4 w-4 mr-1.5"/>Category Specific Cost Adjustment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-1">
                <div className="sm:col-span-5">
                  <Label htmlFor="selectCategoryCost" className="text-xs">Category</Label>
                  <Select value={selectedCategoryForAdjustment} onValueChange={setSelectedCategoryForAdjustment}>
                    <SelectTrigger id="selectCategoryCost" className="h-9 text-xs"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {uniqueCategories.map(cat => <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-5">
                  <Label htmlFor="categoryCostPercentSlider" className="text-xs">Cost Adj. (%)</Label>
                   <div className="flex items-center gap-2 mt-1">
                        <Slider id="categoryCostPercentSlider" min={-100} max={100} step={1} value={[categoryCostAdjustmentValue]} onValueChange={(val) => setCategoryCostAdjustmentValue(val[0])} className="flex-grow" />
                        <Input type="number" value={categoryCostAdjustmentValue} onChange={(e)=> setCategoryCostAdjustmentValue(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                         <span className="text-xs w-5">%</span>
                   </div>
                </div>
                <Button onClick={handleAddCategoryAdjustment} size="sm" className="h-9 text-xs sm:col-span-2" disabled={!selectedCategoryForAdjustment}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              {activeCategoryAdjustments.length > 0 && (
                <ScrollArea className="mt-2 space-y-1 text-xs max-h-20 border rounded-md p-1.5 bg-background">
                  {activeCategoryAdjustments.map(adj => (
                    <div key={adj.categoryName} className="flex justify-between items-center p-1 bg-muted/60 rounded text-2xs my-0.5">
                      <span>{adj.categoryName}: {adj.costAdjustmentPercent > 0 ? '+':''}{adj.costAdjustmentPercent}%</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-destructive/10" onClick={() => handleRemoveCategoryAdjustment(adj.categoryName)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
            
            <div className="space-y-1 p-3 border rounded-md">
              <h4 className="font-medium text-sm flex items-center"><PackageSearch className="h-4 w-4 mr-1.5"/>Source Country Specific Tariff Adjustment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end pt-1">
                 <div className="sm:col-span-5">
                  <Label htmlFor="selectCountryTariff" className="text-xs">Supplier Country (Foreign)</Label>
                  <Select value={selectedCountryForTariff} onValueChange={setSelectedCountryForTariff}>
                    <SelectTrigger id="selectCountryTariff" className="h-9 text-xs"><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      {uniqueSupplierCountriesForAnalysis.filter(c => c !== analysisHomeCountry).map(country => <SelectItem key={country} value={country} className="text-xs">{country}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-5">
                  <Label htmlFor="countryTariffPointsSlider" className="text-xs">Additional Tariff (points)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Slider id="countryTariffPointsSlider" min={-100} max={100} step={1} value={[countryTariffAdjustmentValue]} onValueChange={(val) => setCountryTariffAdjustmentValue(val[0])} className="flex-grow" />
                    <Input type="number" value={countryTariffAdjustmentValue} onChange={(e)=> setCountryTariffAdjustmentValue(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                    <span className="text-xs w-5">pts</span>
                  </div>
                </div>
                <Button onClick={handleAddCountryTariffAdjustment} size="sm" className="h-9 text-xs sm:col-span-2" disabled={!selectedCountryForTariff}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              {activeCountryTariffAdjustments.length > 0 && (
                <ScrollArea className="mt-2 space-y-1 text-xs max-h-20 border rounded-md p-1.5 bg-background">
                  {activeCountryTariffAdjustments.map(adj => (
                    <div key={adj.countryName} className="flex justify-between items-center p-1 bg-muted/60 rounded text-2xs my-0.5">
                      <span>{adj.countryName}: {adj.tariffAdjustmentPoints > 0 ? '+':''}{adj.tariffAdjustmentPoints} points</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-destructive/10" onClick={() => handleRemoveCountryTariffAdjustment(adj.countryName)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              Impact Summary
            </CardTitle>
             {selectedScenarioToLoad && <CardDescription className="text-xs">Scenario: <strong>{selectedScenarioToLoad}</strong></CardDescription>}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
             <div>
              <Label className="text-xs text-muted-foreground">Base Total Annual Spend</Label>
              <p className="font-semibold">{formatCurrency(originalTotalAnnualSpend)}</p>
            </div>
            <hr />

            <div className="my-2">
                <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">Waterfall Chart: Spend Breakdown</h4>
                {waterfallChartData.length <= 2 ? ( // Base and Final only
                     <p className="text-xs text-muted-foreground text-center py-4">Adjust parameters to see detailed breakdown.</p>
                ) : (
                <ChartContainer config={chartConfigWaterfall} className="min-h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={waterfallChartData} layout="vertical" margin={{left: 10, right: 30, top:5, bottom:5}}>
                        <CartesianGrid horizontal={false} strokeDasharray="3 3"/>
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(value,0).replace('$', '')[0] + (Math.abs(value) > 1e6 ? (value/1e6).toFixed(0)+'M' : Math.abs(value) > 1e3 ? (value/1e3).toFixed(0)+'K' : value )  } domain={['dataMin - 10000', 'dataMax + 10000']} tick={{fontSize:9}}/>
                        <YAxis dataKey="name" type="category" width={85} tick={{fontSize:9}}/>
                        <RechartsTooltipComponent 
                            formatter={(value:number, name:string, props:any) => [formatCurrency(props.payload.value), props.payload.name]}
                            cursor={{fill: 'hsla(var(--muted)/0.3)'}}
                            contentStyle={{fontSize:'10px', padding:'2px 8px'}}
                        />
                        <Bar dataKey="offset" stackId="a" fill="transparent" />
                        <Bar dataKey="value" stackId="a" radius={[2,2,0,0]}>
                            {waterfallChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                )}
            </div>
            <hr />
             <div className="my-2">
                <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">P&L Impact Table</h4>
                <Table className="text-xs">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="h-7 p-1.5">Component</TableHead>
                            <TableHead className="h-7 p-1.5 text-right">Impact</TableHead>
                            <TableHead className="h-7 p-1.5 text-right">Subtotal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pnlTableData.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell className="p-1 font-medium">{row.component}</TableCell>
                                <TableCell className={`p-1 text-right ${row.impact !== scenarioImpacts.baseSpend && row.impact !==0 ? (row.impact < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : ''}`}>
                                    {row.impact === scenarioImpacts.baseSpend ? formatCurrency(row.impact) : (row.impact >=0 ? '+' : '') + formatCurrency(row.impact) }
                                </TableCell>
                                <TableCell className="p-1 text-right font-semibold">{formatCurrency(row.scenarioValue)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <hr />
            <div>
              <Label className="text-xs text-muted-foreground">What-if Total Annual Spend</Label>
              <p className="font-semibold text-base">{formatCurrency(whatIfTotalAnnualSpend)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Net Change vs. Original</Label>
              <p className={`font-semibold ${netChangeAmount <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {netChangeAmount >= 0 ? "+" : ""}{formatCurrency(netChangeAmount)} 
                ({netChangeAmount >= 0 ? "+" : ""}{netChangePercent.toFixed(2)}%)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSaveScenarioDialogOpen} onOpenChange={setIsSaveScenarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Scenario" : "Save New Scenario"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? `Update the name and description for "${currentScenarioName}". Current settings will be saved.` : "Enter a name and description for your new scenario."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="scenarioName">Scenario Name</Label>
              <Input id="scenarioName" value={currentScenarioName} onChange={(e) => setCurrentScenarioName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="scenarioDescription">Description (Optional)</Label>
              <Input id="scenarioDescription" value={currentScenarioDescription} onChange={(e) => setCurrentScenarioDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveScenarioDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveScenario}>Save Scenario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
