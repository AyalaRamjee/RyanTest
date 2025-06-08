
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
import { HelpCircle, Info, Percent, DollarSign, Trash2, PlusCircle, ChevronsUpDown, TrendingUp, Save, Upload, Edit3, Layers } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface WhatIfAnalysisTabProps {
  parts: Part[];
  suppliers: Supplier[];
  partCategoryMappings: PartCategoryMapping[];
  partSupplierAssociations: PartSupplierAssociation[];
  originalTotalAnnualSpend: number;
  originalTariffChargePercent: number;
  originalTotalLogisticsCostPercent: number;
  homeCountry: string; // This is the app's default home country
}

interface CategoryAdjustment {
  categoryName: string;
  costAdjustmentPercent: number;
}

interface CountryTariffAdjustment {
  countryName: string;
  tariffAdjustmentPoints: number;
}

interface SavedScenario {
  name: string;
  description: string;
  analysisHomeCountry: string;
  globalTariffAdjustmentPoints: number;
  globalLogisticsAdjustmentPoints: number;
  activeCategoryAdjustments: CategoryAdjustment[];
  activeCountryTariffAdjustments: CountryTariffAdjustment[];
}

const LOCAL_STORAGE_SCENARIO_LIST_KEY = "spendwise_scenario_list";
const LOCAL_STORAGE_SCENARIO_DATA_PREFIX = "spendwise_scenario_data_";

export default function WhatIfAnalysisTab({
  parts,
  suppliers,
  partCategoryMappings,
  partSupplierAssociations,
  originalTotalAnnualSpend,
  originalTariffChargePercent,
  originalTotalLogisticsCostPercent,
  homeCountry: appHomeCountry, // Renamed to avoid conflict
}: WhatIfAnalysisTabProps) {
  const { toast } = useToast();

  // State for "What-if" specific home country
  const [analysisHomeCountry, setAnalysisHomeCountry] = useState<string>(appHomeCountry);

  // State for global adjustments
  const [globalTariffAdjustmentPoints, setGlobalTariffAdjustmentPoints] = useState(0);
  const [globalLogisticsAdjustmentPoints, setGlobalLogisticsAdjustmentPoints] = useState(0);

  // State for category-specific cost adjustments
  const [selectedCategoryForAdjustment, setSelectedCategoryForAdjustment] = useState<string>("");
  const [categoryCostAdjustmentValue, setCategoryCostAdjustmentValue] = useState(0);
  const [activeCategoryAdjustments, setActiveCategoryAdjustments] = useState<CategoryAdjustment[]>([]);

  // State for country-specific tariff adjustments
  const [selectedCountryForTariff, setSelectedCountryForTariff] = useState<string>("");
  const [countryTariffAdjustmentValue, setCountryTariffAdjustmentValue] = useState(0);
  const [activeCountryTariffAdjustments, setActiveCountryTariffAdjustments] = useState<CountryTariffAdjustment[]>([]);
  
  // Scenario Management State
  const [isSaveScenarioDialogOpen, setIsSaveScenarioDialogOpen] = useState(false);
  const [currentScenarioName, setCurrentScenarioName] = useState("");
  const [currentScenarioDescription, setCurrentScenarioDescription] = useState("");
  const [savedScenarioNames, setSavedScenarioNames] = useState<string[]>([]);
  const [selectedScenarioToLoad, setSelectedScenarioToLoad] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false); // For determining if saving an existing scenario

  useEffect(() => {
    const storedNames = localStorage.getItem(LOCAL_STORAGE_SCENARIO_LIST_KEY);
    if (storedNames) {
      setSavedScenarioNames(JSON.parse(storedNames));
    }
    // Set initial home country for analysis
    setAnalysisHomeCountry(appHomeCountry);
  }, [appHomeCountry]);

  const uniqueCategories = useMemo(() => Array.from(new Set(partCategoryMappings.map(pcm => pcm.categoryName))).sort(), [partCategoryMappings]);
  const uniqueSupplierCountries = useMemo(() => {
    const countries = Array.from(new Set(suppliers.map(s => s.country)));
    if (!countries.includes(appHomeCountry)) {
        countries.push(appHomeCountry);
    }
    return countries.sort();
  }, [suppliers, appHomeCountry]);


  const formatCurrency = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  const calculateAdjustedSpendForPart = useCallback((part: Part): number => {
    let adjustedPrice = part.price;

    const categoryMappingsForPart = partCategoryMappings.filter(pcm => pcm.partId === part.id);
    for (const mapping of categoryMappingsForPart) {
      const categoryAdjustment = activeCategoryAdjustments.find(adj => adj.categoryName === mapping.categoryName);
      if (categoryAdjustment) {
        adjustedPrice *= (1 + categoryAdjustment.costAdjustmentPercent / 100);
      }
    }

    const partSuppliers = partSupplierAssociations
      .filter(assoc => assoc.partId === part.id)
      .map(assoc => suppliers.find(s => s.id === assoc.supplierId))
      .filter(s => s !== undefined) as Supplier[];

    const isEffectivelyImported = partSuppliers.length > 0 ? partSuppliers.some(s => s.country !== analysisHomeCountry) : false;
    
    let currentEffectiveTariffPercent = 100;
    if (isEffectivelyImported) {
      currentEffectiveTariffPercent = originalTariffChargePercent + globalTariffAdjustmentPoints;
      for (const supplier of partSuppliers) {
        const countryAdjustment = activeCountryTariffAdjustments.find(adj => adj.countryName === supplier.country);
        if (countryAdjustment) {
          currentEffectiveTariffPercent += countryAdjustment.tariffAdjustmentPoints;
          break; 
        }
      }
    }
    const tariffMultiplier = Math.max(0, currentEffectiveTariffPercent / 100); // Ensure tariff multiplier is not negative
    adjustedPrice *= tariffMultiplier;

    const currentEffectiveLogisticsPercent = originalTotalLogisticsCostPercent + globalLogisticsAdjustmentPoints;
    const logisticsRateMultiplier = Math.max(0, currentEffectiveLogisticsPercent / 100); // Ensure logistics multiplier is not negative
    const effectiveFreightOhdRate = part.freightOhdCost * logisticsRateMultiplier;
    
    return adjustedPrice * part.annualDemand * (1 + effectiveFreightOhdRate);
  }, [
    analysisHomeCountry, parts, suppliers, partCategoryMappings, partSupplierAssociations,
    activeCategoryAdjustments, activeCountryTariffAdjustments,
    globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints,
    originalTariffChargePercent, originalTotalLogisticsCostPercent
  ]);

  const whatIfTotalAnnualSpend = useMemo(() => {
    if (!parts || parts.length === 0) return 0;
    return parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(part), 0);
  }, [parts, calculateAdjustedSpendForPart]);

  const netChangeAmount = useMemo(() => whatIfTotalAnnualSpend - originalTotalAnnualSpend, [whatIfTotalAnnualSpend, originalTotalAnnualSpend]);
  const netChangePercent = useMemo(() => originalTotalAnnualSpend !== 0 ? (netChangeAmount / originalTotalAnnualSpend) * 100 : 0, [netChangeAmount, originalTotalAnnualSpend]);

  // Handlers
  const handleAddCategoryAdjustment = () => {
    if (!selectedCategoryForAdjustment) return;
    setActiveCategoryAdjustments(prev => {
      const existing = prev.find(adj => adj.categoryName === selectedCategoryForAdjustment);
      if (existing) {
        return prev.map(adj => adj.categoryName === selectedCategoryForAdjustment ? { ...adj, costAdjustmentPercent: categoryCostAdjustmentValue } : adj);
      }
      return [...prev, { categoryName: selectedCategoryForAdjustment, costAdjustmentPercent: categoryCostAdjustmentValue }];
    });
    setSelectedCategoryForAdjustment(""); // Reset for next entry
    setCategoryCostAdjustmentValue(0);
  };

  const handleRemoveCategoryAdjustment = (categoryName: string) => {
    setActiveCategoryAdjustments(prev => prev.filter(adj => adj.categoryName !== categoryName));
  };
  
  const handleAddCountryTariffAdjustment = () => {
    if (!selectedCountryForTariff) return;
    setActiveCountryTariffAdjustments(prev => {
      const existing = prev.find(adj => adj.countryName === selectedCountryForTariff);
      if (existing) {
        return prev.map(adj => adj.countryName === selectedCountryForTariff ? { ...adj, tariffAdjustmentPoints: countryTariffAdjustmentValue } : adj);
      }
      return [...prev, { countryName: selectedCountryForTariff, tariffAdjustmentPoints: countryTariffAdjustmentValue }];
    });
    setSelectedCountryForTariff(""); // Reset for next entry
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
        } else { // Fallback if data is missing for loaded scenario name
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
    setSelectedScenarioToLoad(scenarioData.name); // Select the newly saved/updated scenario
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
      setCurrentScenarioName(scenarioData.name); // For potential edit
      setCurrentScenarioDescription(scenarioData.description); // For potential edit
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
    setSelectedScenarioToLoad(""); // Reset selection
    // Optionally reset controls to default here
  };

  // Simplified impact breakdown
   const impactSummary = useMemo(() => {
    const baseTotalSpend = originalTotalAnnualSpend;
    let impactFromGlobalTariff = 0;
    let impactFromGlobalLogistics = 0;
    let impactFromCategories = 0;
    let impactFromCountryTariffs = 0;

    parts.forEach(part => {
        const originalPartSpend = calculateAdjustedSpendForPart({
            ...part,
            // Simulate original state for this part by nullifying current adjustments TEMPORARILY for calculation
            // This is tricky because calculateAdjustedSpendForPart uses current states.
            // For a true isolated impact, each adjustment type would need its own calculation loop from base.
            // This is a rough estimate:
        });

        // This is a very simplified way and not perfectly isolated,
        // as calculateAdjustedSpendForPart applies all current states.
        // A more accurate breakdown requires more complex logic.
    });
    // Placeholder logic for now:
    impactFromGlobalTariff = (whatIfTotalAnnualSpend * (globalTariffAdjustmentPoints / (originalTariffChargePercent + globalTariffAdjustmentPoints + 0.0001))) || 0;
    impactFromGlobalLogistics = (whatIfTotalAnnualSpend * (globalLogisticsAdjustmentPoints / (originalTotalLogisticsCostPercent + globalLogisticsAdjustmentPoints + 0.0001))) || 0;
    // Sum of differences for categories and countries would be more complex
    
    return {
      globalTariffImpact: impactFromGlobalTariff,
      globalLogisticsImpact: impactFromGlobalLogistics,
      categoryAdjustmentsImpact: netChangeAmount - impactFromGlobalTariff - impactFromGlobalLogistics, // Remainder
      countryTariffAdjustmentsImpact: 0 // Placeholder
    };

  }, [whatIfTotalAnnualSpend, originalTotalAnnualSpend, parts, calculateAdjustedSpendForPart, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, originalTariffChargePercent, originalTotalLogisticsCostPercent]);


  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section 6A: Controls */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ChevronsUpDown className="mr-2 h-5 w-5 text-primary" />
              What-if Controls
            </CardTitle>
            <CardDescription>
              Adjust cost factors to see potential impact. Scenarios can be saved and loaded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scenario Management */}
            <Card className="bg-muted/30 p-3">
                <CardTitle className="text-sm font-medium mb-2 flex items-center justify-between">
                    <div className="flex items-center"><Layers className="mr-2 h-4 w-4"/>Scenario Management</div>
                    {selectedScenarioToLoad && (
                         <Button onClick={() => handleOpenSaveDialog(true)} size="xs" variant="outline" className="text-xs h-7">
                            <Edit3 className="mr-1 h-3 w-3" /> Edit Current
                        </Button>
                    )}
                </CardTitle>
                <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                        <Label htmlFor="loadScenario" className="text-xs">Load Scenario</Label>
                        <Select value={selectedScenarioToLoad} onValueChange={handleLoadScenario}>
                            <SelectTrigger id="loadScenario" className="h-9 text-xs"><SelectValue placeholder="Select a scenario..." /></SelectTrigger>
                            <SelectContent>
                                {savedScenarioNames.length === 0 && <SelectItem value="no-scenarios" disabled className="text-xs">No saved scenarios</SelectItem>}
                                {savedScenarioNames.map(name => <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={() => handleOpenSaveDialog(false)} size="sm" variant="default" className="h-9 text-xs">
                        <Save className="mr-1 h-4 w-4" /> Save New
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
            </Card>

            {/* Applied Changes Display */}
            <Card className="bg-muted/50 p-4">
              <CardTitle className="text-sm font-medium mb-2">Current What-if Scenario Settings:</CardTitle>
              <ScrollArea className="h-20 text-xs">
                <ul className="list-disc list-inside space-y-1">
                  <li>Analysis Home Country: <strong>{analysisHomeCountry}</strong></li>
                  <li>Global Tariff Adjustment: {globalTariffAdjustmentPoints >= 0 ? "+" : ""}{globalTariffAdjustmentPoints} points
                    <span className="text-muted-foreground text-2xs"> (Base Tariff: {originalTariffChargePercent}%)</span>
                  </li>
                  <li>Global Logistics Adj.: {globalLogisticsAdjustmentPoints >= 0 ? "+" : ""}{globalLogisticsAdjustmentPoints} points
                     <span className="text-muted-foreground text-2xs"> (Base Logistics: {originalTotalLogisticsCostPercent}%)</span>
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
                  {(globalTariffAdjustmentPoints === 0 && globalLogisticsAdjustmentPoints === 0 && activeCategoryAdjustments.length === 0 && activeCountryTariffAdjustments.length === 0 && analysisHomeCountry === appHomeCountry) && (
                    <li className="text-muted-foreground">No custom adjustments applied beyond base settings.</li>
                  )}
                </ul>
              </ScrollArea>
            </Card>
            
            {/* Home Country for Analysis */}
             <div className="space-y-2 p-4 border rounded-md">
                <Label htmlFor="analysisHomeCountrySelect" className="text-sm font-medium">Home Country for Analysis</Label>
                <Select value={analysisHomeCountry} onValueChange={setAnalysisHomeCountry}>
                    <SelectTrigger id="analysisHomeCountrySelect" className="h-9 text-xs">
                        <SelectValue placeholder="Select Home Country for Analysis" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueSupplierCountries.map(country => (
                            <SelectItem key={country} value={country} className="text-xs">{country}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-2xs text-muted-foreground">This country is considered domestic for tariff calculations in this scenario.</p>
            </div>


            {/* Global Adjustments */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="font-medium text-sm">Global Adjustments</h4>
              <div>
                <Label htmlFor="globalTariffSlider" className="text-xs">Global Tariff Adjustment (percentage points on top of base {originalTariffChargePercent}%)</Label>
                <div className="flex items-center gap-2">
                  <Slider id="globalTariffSlider" min={-100} max={100} step={1} value={[globalTariffAdjustmentPoints]} onValueChange={(val) => setGlobalTariffAdjustmentPoints(val[0])} className="flex-grow" />
                  <Input type="number" value={globalTariffAdjustmentPoints} onChange={(e)=> setGlobalTariffAdjustmentPoints(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                  <span className="text-xs w-5">%</span>
                </div>
              </div>
              <div>
                <Label htmlFor="globalLogisticsSlider" className="text-xs">Global Logistics Cost Adj. (percentage points on top of base {originalTotalLogisticsCostPercent}%)</Label>
                 <div className="flex items-center gap-2">
                  <Slider id="globalLogisticsSlider" min={-100} max={100} step={1} value={[globalLogisticsAdjustmentPoints]} onValueChange={(val) => setGlobalLogisticsAdjustmentPoints(val[0])} className="flex-grow" />
                  <Input type="number" value={globalLogisticsAdjustmentPoints} onChange={(e)=> setGlobalLogisticsAdjustmentPoints(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                  <span className="text-xs w-5">%</span>
                </div>
              </div>
            </div>

            {/* Category-Specific Adjustments */}
            <div className="space-y-1 p-4 border rounded-md">
              <h4 className="font-medium text-sm">Category Specific Cost Adjustment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
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
                   <div className="flex items-center gap-2">
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
                <ScrollArea className="mt-2 space-y-1 text-xs max-h-24">
                  {activeCategoryAdjustments.map(adj => (
                    <div key={adj.categoryName} className="flex justify-between items-center p-1.5 bg-muted/40 rounded text-xs my-1">
                      <span>{adj.categoryName}: {adj.costAdjustmentPercent > 0 ? '+':''}{adj.costAdjustmentPercent}%</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveCategoryAdjustment(adj.categoryName)}><Trash2 className="h-3 w-3"/></Button>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
            
            {/* Country-Specific Tariff Adjustments */}
            <div className="space-y-1 p-4 border rounded-md">
              <h4 className="font-medium text-sm">Source Country Specific Tariff Adjustment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                 <div className="sm:col-span-5">
                  <Label htmlFor="selectCountryTariff" className="text-xs">Country</Label>
                  <Select value={selectedCountryForTariff} onValueChange={setSelectedCountryForTariff}>
                    <SelectTrigger id="selectCountryTariff" className="h-9 text-xs"><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      {uniqueSupplierCountries.filter(c => c !== analysisHomeCountry).map(country => <SelectItem key={country} value={country} className="text-xs">{country}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-5">
                  <Label htmlFor="countryTariffPointsSlider" className="text-xs">Additional Tariff (points)</Label>
                  <div className="flex items-center gap-2">
                    <Slider id="countryTariffPointsSlider" min={-100} max={100} step={1} value={[countryTariffAdjustmentValue]} onValueChange={(val) => setCountryTariffAdjustmentValue(val[0])} className="flex-grow" />
                    <Input type="number" value={countryTariffAdjustmentValue} onChange={(e)=> setCountryTariffAdjustmentValue(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                    <span className="text-xs w-5">%</span>
                  </div>
                </div>
                <Button onClick={handleAddCountryTariffAdjustment} size="sm" className="h-9 text-xs sm:col-span-2" disabled={!selectedCountryForTariff}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              {activeCountryTariffAdjustments.length > 0 && (
                <ScrollArea className="mt-2 space-y-1 text-xs max-h-24">
                  {activeCountryTariffAdjustments.map(adj => (
                    <div key={adj.countryName} className="flex justify-between items-center p-1.5 bg-muted/40 rounded text-xs my-1">
                      <span>{adj.countryName}: {adj.tariffAdjustmentPoints > 0 ? '+':''}{adj.tariffAdjustmentPoints} points</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveCountryTariffAdjustment(adj.countryName)}><Trash2 className="h-3 w-3"/></Button>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Section 6B: Summary of Impact */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              Impact Summary
            </CardTitle>
             {selectedScenarioToLoad && <CardDescription className="text-xs">Displaying impact for scenario: <strong>{selectedScenarioToLoad}</strong></CardDescription>}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Original Total Annual Spend (Base)</Label>
              <p className="font-semibold">{formatCurrency(originalTotalAnnualSpend)}</p>
            </div>
            <hr/>
            <div className="font-medium text-xs text-muted-foreground">Incremental Cost Impact (Estimated):</div>
            <ScrollArea className="h-28 text-xs pl-2 space-y-1">
                <div className="flex justify-between">
                    <span>Global Tariff Adj.:</span>
                    <span className={impactSummary.globalTariffImpact <= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {impactSummary.globalTariffImpact >= 0 ? "+" : ""}{formatCurrency(impactSummary.globalTariffImpact)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Global Logistics Adj.:</span>
                     <span className={impactSummary.globalLogisticsImpact <= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {impactSummary.globalLogisticsImpact >= 0 ? "+" : ""}{formatCurrency(impactSummary.globalLogisticsImpact)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Category/Country Specifics:</span>
                     <span className={impactSummary.categoryAdjustmentsImpact <= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {impactSummary.categoryAdjustmentsImpact >= 0 ? "+" : ""}{formatCurrency(impactSummary.categoryAdjustmentsImpact)}
                    </span>
                </div>
                 <p className="text-muted-foreground text-2xs italic pt-1">Note: Isolated impact breakdown is complex and estimated here.</p>
            </ScrollArea>
             <hr/>
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

      {/* Save Scenario Dialog */}
      <Dialog open={isSaveScenarioDialogOpen} onOpenChange={setIsSaveScenarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Scenario" : "Save New Scenario"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? `Update the name and description for "${currentScenarioName}".` : "Enter a name and description for your new scenario."}
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
