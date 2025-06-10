
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Part, Supplier, PartCategoryMapping, PartSupplierAssociation } from '@/types/spendwise';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HelpCircle, Info, Percent, DollarSign, Trash2, PlusCircle, ChevronsUpDown, TrendingUp, Save, Upload, Edit3, Layers, BarChart3, Maximize, Minimize, Filter, PackageSearch, Palette, MapPin, Activity } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltipComponent, Cell } from 'recharts';
import { ChartContainer } from "@/components/ui/chart";


interface WhatIfAnalysisTabProps {
  parts: Part[];
  suppliers: Supplier[];
  partCategoryMappings: PartCategoryMapping[];
  partSupplierAssociations: PartSupplierAssociation[];
  originalTotalAnnualSpend: number;
  originalTariffMultiplierPercent: number; 
  originalTotalLogisticsCostPercent: number;
  defaultAnalysisHomeCountry: string;
}

interface CategoryAdjustment {
  categoryName: string;
  costAdjustmentPercent: number;
}

interface CountryTariffAdjustment {
  countryName: string;
  tariffAdjustmentPoints: number; 
}

interface DemandAdjustment {
  id: string; // For unique key in lists
  type: 'global' | 'category' | 'part';
  targetName?: string; // Category name or Part name/number
  targetId?: string;   // Category name or Part ID
  adjustmentPercent: number;
}

interface SavedScenario {
  name: string;
  description: string;
  analysisHomeCountry: string;
  globalTariffAdjustmentPoints: number;
  globalLogisticsAdjustmentPoints: number;
  activeCategoryAdjustments: CategoryAdjustment[];
  activeCountryTariffAdjustments: CountryTariffAdjustment[];
  activeDemandAdjustments: DemandAdjustment[];
}

const LOCAL_STORAGE_SCENARIO_LIST_KEY = "spendwise_scenario_list_v2"; 
const LOCAL_STORAGE_SCENARIO_DATA_PREFIX = "spendwise_scenario_data_v2_";
const BASE_TARIFF_RATE_FOR_WHAT_IF = 0.05; 

interface WaterfallDataPoint {
  name: string;
  value: number; 
  offset?: number; 
  fill: string; 
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
  originalTariffMultiplierPercent,
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

  const [demandAdjustmentType, setDemandAdjustmentType] = useState<'global' | 'category' | 'part'>('global');
  const [selectedCategoryForDemand, setSelectedCategoryForDemand] = useState<string>("");
  const [selectedPartForDemand, setSelectedPartForDemand] = useState<string>("");
  const [demandAdjustmentValue, setDemandAdjustmentValue] = useState(0); 
  const [activeDemandAdjustments, setActiveDemandAdjustments] = useState<DemandAdjustment[]>([]);
  
  const [isSaveScenarioDialogOpen, setIsSaveScenarioDialogOpen] = useState(false);
  const [currentScenarioName, setCurrentScenarioName] = useState("");
  const [currentScenarioDescription, setCurrentScenarioDescription] = useState("");
  const [savedScenarioNames, setSavedScenarioNames] = useState<string[]>([]);
  const [selectedScenarioToLoad, setSelectedScenarioToLoad] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setAnalysisHomeCountry(defaultAnalysisHomeCountry);
  }, [defaultAnalysisHomeCountry]);

  useEffect(() => {
    const storedNames = localStorage.getItem(LOCAL_STORAGE_SCENARIO_LIST_KEY);
    if (storedNames) {
      setSavedScenarioNames(JSON.parse(storedNames));
    }
  }, []);

  const uniqueCategories = useMemo(() => Array.from(new Set(partCategoryMappings.map(pcm => pcm.categoryName))).sort(), [partCategoryMappings]);
  const partsForSelect = useMemo(() => parts.map(p => ({ value: p.id, label: `${p.partNumber} - ${p.name}` })).sort((a,b) => a.label.localeCompare(b.label)), [parts]);
  
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
    currentGlobalTariffAdjPts: number,
    currentGlobalLogisticsAdjPts: number,
    currentCategoryAdjs: CategoryAdjustment[],
    currentCountryTariffAdjs: CountryTariffAdjustment[],
    currentDemandAdjs: DemandAdjustment[]
  ): number => {
    let adjustedPrice = part.price;
    let adjustedDemand = part.annualDemand;

    const partSpecificDemandAdj = currentDemandAdjs.find(adj => adj.type === 'part' && adj.targetId === part.id);
    const categorySpecificDemandAdjs = currentDemandAdjs.filter(adj => 
        adj.type === 'category' && 
        partCategoryMappings.some(pcm => pcm.partId === part.id && pcm.categoryName === adj.targetId)
    );
    const globalDemandAdj = currentDemandAdjs.find(adj => adj.type === 'global');

    if (partSpecificDemandAdj) {
        adjustedDemand = part.annualDemand * (1 + partSpecificDemandAdj.adjustmentPercent / 100);
    } else if (categorySpecificDemandAdjs.length > 0) {
        // If multiple category adjustments apply, this example takes the first one. 
        // You might need a more sophisticated logic (e.g., average, sum, or specific override)
        adjustedDemand = part.annualDemand * (1 + categorySpecificDemandAdjs[0].adjustmentPercent / 100);
    } else if (globalDemandAdj) {
        adjustedDemand = part.annualDemand * (1 + globalDemandAdj.adjustmentPercent / 100);
    }
    adjustedDemand = Math.max(0, adjustedDemand); // Ensure demand doesn't go negative

    const categoryMappingsForPart = partCategoryMappings.filter(pcm => pcm.partId === part.id);
    for (const mapping of categoryMappingsForPart) {
      const categoryAdjustment = currentCategoryAdjs.find(adj => adj.categoryName === mapping.categoryName);
      if (categoryAdjustment) {
        adjustedPrice *= (1 + categoryAdjustment.costAdjustmentPercent / 100);
      }
    }
    
    let priceAfterTariff = adjustedPrice;
    const partSuppliers = partSupplierAssociations
      .filter(assoc => assoc.partId === part.id)
      .map(assoc => suppliers.find(s => s.id === assoc.supplierId))
      .filter(s => s !== undefined) as Supplier[];

    if (partSuppliers.length > 0) {
      // Simplified: consider imported if *any* supplier is foreign. Could be more nuanced (e.g. % of supply)
      const isEffectivelyImported = partSuppliers.some(s => s.country !== currentAnalysisHomeCountry);
      if (isEffectivelyImported) {
        let effectiveBaseTariffRate = BASE_TARIFF_RATE_FOR_WHAT_IF * (originalTariffMultiplierPercent / 100);
        let finalScenarioTariffRate = effectiveBaseTariffRate + (currentGlobalTariffAdjPts / 100);
        
        // Check for country-specific adjustments, applied on top of global.
        // This logic assumes the first matching foreign supplier's country adjustment is used.
        let countrySpecificApplied = false;
        for (const supplier of partSuppliers) {
            if (supplier.country !== currentAnalysisHomeCountry) { // Only consider foreign suppliers for country-specific
                const countryAdjustment = currentCountryTariffAdjs.find(adj => adj.countryName === supplier.country);
                if (countryAdjustment) {
                    // Country adjustment ADDS to the globally adjusted base tariff rate
                    finalScenarioTariffRate = effectiveBaseTariffRate + (currentGlobalTariffAdjPts / 100) + (countryAdjustment.tariffAdjustmentPoints / 100);
                    countrySpecificApplied = true;
                    break; // Apply first specific country adjustment found
                }
            }
        }
        priceAfterTariff = adjustedPrice * (1 + Math.max(0, finalScenarioTariffRate)); // Ensure tariff doesn't make price negative
      }
    }
    
    const effectiveLogisticsBasePercent = originalTotalLogisticsCostPercent; // This is the base from main page (e.g. 100 means 100%)
    const finalLogisticsPercent = effectiveLogisticsBasePercent + currentGlobalLogisticsAdjPts; // Add/subtract points
    const logisticsRateMultiplier = Math.max(0, finalLogisticsPercent / 100); // Convert to multiplier, e.g., 105% -> 1.05
    const effectiveFreightOhdRate = part.freightOhdCost * logisticsRateMultiplier;
    
    return priceAfterTariff * adjustedDemand * (1 + effectiveFreightOhdRate);
  }, [
    partCategoryMappings, partSupplierAssociations, suppliers,
    originalTariffMultiplierPercent, originalTotalLogisticsCostPercent
  ]);

  const scenarioImpacts = useMemo(() => {
    const results = {
      baseSpend: originalTotalAnnualSpend,
      afterGlobalTariff: originalTotalAnnualSpend,
      afterGlobalLogistics: originalTotalAnnualSpend,
      afterCategoryChanges: originalTotalAnnualSpend,
      afterCountryTariffChanges: originalTotalAnnualSpend, 
      finalWhatIfSpend: originalTotalAnnualSpend, 
      impactGlobalTariff: 0,
      impactGlobalLogistics: 0,
      impactCategory: 0,
      impactCountryTariff: 0,
      impactDemand: 0, 
    };

    if (!parts || parts.length === 0) return results;

    // Calculate spend after each adjustment stage
    // 1. Base spend is originalTotalAnnualSpend
    
    // 2. After Global Tariff Adjustment (only tariff and home country changes)
    results.afterGlobalTariff = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(
      part, analysisHomeCountry, globalTariffAdjustmentPoints, 0, [], [], [] // No logistics, category, country tariff, or demand adjs
    ), 0);
    results.impactGlobalTariff = results.afterGlobalTariff - results.baseSpend;

    // 3. After Global Logistics Adjustment (tariff, home country, AND logistics changes)
    results.afterGlobalLogistics = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(
      part, analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, [], [], [] // No category, country tariff, or demand adjs
    ), 0);
    results.impactGlobalLogistics = results.afterGlobalLogistics - results.afterGlobalTariff; // Impact relative to previous step
    
    // 4. After Category Cost Adjustments
    results.afterCategoryChanges = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(
      part, analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, activeCategoryAdjustments, [], [] // No country tariff or demand adjs
    ), 0);
    results.impactCategory = results.afterCategoryChanges - results.afterGlobalLogistics;

    // 5. After Country Specific Tariff Adjustments (this is spend before demand)
    results.afterCountryTariffChanges = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(
      part, analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, activeCategoryAdjustments, activeCountryTariffAdjustments, [] // No demand adjs
    ), 0);
    results.impactCountryTariff = results.afterCountryTariffChanges - results.afterCategoryChanges;

    // 6. Final What-if Spend (all adjustments including demand)
    results.finalWhatIfSpend = parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(
      part, analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, activeCategoryAdjustments, activeCountryTariffAdjustments, activeDemandAdjustments
    ), 0);
    results.impactDemand = results.finalWhatIfSpend - results.afterCountryTariffChanges; // Impact of demand relative to spend before demand changes
    
    return results;
  }, [
    parts, originalTotalAnnualSpend, calculateAdjustedSpendForPart,
    analysisHomeCountry, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints,
    activeCategoryAdjustments, activeCountryTariffAdjustments, activeDemandAdjustments
  ]);
  
  const whatIfTotalAnnualSpend = scenarioImpacts.finalWhatIfSpend;
  const netChangeAmount = whatIfTotalAnnualSpend - originalTotalAnnualSpend;
  const netChangePercent = originalTotalAnnualSpend !== 0 ? (netChangeAmount / originalTotalAnnualSpend) * 100 : 0;

 const waterfallChartData = useMemo(() => {
    const data: WaterfallDataPoint[] = [];
    let cumulative = 0;

    data.push({ name: "Base Spend", value: scenarioImpacts.baseSpend, offset: 0, fill: "hsl(var(--chart-3))" });
    cumulative = scenarioImpacts.baseSpend;

    const addImpactToWaterfall = (name: string, impact: number) => {
        // Only add if there's a non-zero impact
        if (impact !== 0) {
            data.push({
                name,
                value: impact, // The actual change value
                offset: impact < 0 ? cumulative + impact : cumulative, // Start of the bar
                fill: impact < 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))" // Green for decrease (savings), Red for increase
            });
            cumulative += impact;
        }
    };

    addImpactToWaterfall("Tariff Adj.", scenarioImpacts.impactGlobalTariff);
    addImpactToWaterfall("Logistics Adj.", scenarioImpacts.impactGlobalLogistics);
    addImpactToWaterfall("Category Adj.", scenarioImpacts.impactCategory);
    addImpactToWaterfall("Country Tariff Adj.", scenarioImpacts.impactCountryTariff);
    addImpactToWaterfall("Demand Adj.", scenarioImpacts.impactDemand); 

    // Final "What-if Spend" bar
    data.push({ name: "What-if Spend", value: cumulative, offset: 0, fill: "hsl(var(--chart-1))" });
    
    return data;
  }, [scenarioImpacts]);

  const pnlTableData = [
    { component: "Base Spend", impact: scenarioImpacts.baseSpend, scenarioValue: scenarioImpacts.baseSpend },
    { component: "Global Tariff Impact", impact: scenarioImpacts.impactGlobalTariff, scenarioValue: scenarioImpacts.baseSpend + scenarioImpacts.impactGlobalTariff },
    { component: "Global Logistics Impact", impact: scenarioImpacts.impactGlobalLogistics, scenarioValue: scenarioImpacts.baseSpend + scenarioImpacts.impactGlobalTariff + scenarioImpacts.impactGlobalLogistics },
    { component: "Category Adjustments Impact", impact: scenarioImpacts.impactCategory, scenarioValue: scenarioImpacts.baseSpend + scenarioImpacts.impactGlobalTariff + scenarioImpacts.impactGlobalLogistics + scenarioImpacts.impactCategory },
    { component: "Country Tariff Impact", impact: scenarioImpacts.impactCountryTariff, scenarioValue: scenarioImpacts.baseSpend + scenarioImpacts.impactGlobalTariff + scenarioImpacts.impactGlobalLogistics + scenarioImpacts.impactCategory + scenarioImpacts.impactCountryTariff },
    { component: "Demand Adjustments Impact", impact: scenarioImpacts.impactDemand, scenarioValue: scenarioImpacts.finalWhatIfSpend }, // This is the final calculated value
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

  const handleAddDemandAdjustment = () => {
    let id = `demand_${Date.now()}`;
    let targetName: string | undefined = undefined;
    let targetId: string | undefined = undefined;

    if (demandAdjustmentType === 'category') {
      if (!selectedCategoryForDemand) {
        toast({ title: "Select Category", description: "Please select a category for demand adjustment.", variant: "destructive" });
        return;
      }
      targetName = selectedCategoryForDemand;
      targetId = selectedCategoryForDemand; // For categories, name and ID can be the same
      id = `demand_cat_${selectedCategoryForDemand.replace(/\s+/g, '_')}`; // Make ID more stable
    } else if (demandAdjustmentType === 'part') {
      if (!selectedPartForDemand) {
        toast({ title: "Select Part", description: "Please select a part for demand adjustment.", variant: "destructive" });
        return;
      }
      const partInfo = parts.find(p => p.id === selectedPartForDemand);
      targetName = partInfo ? `${partInfo.partNumber} - ${partInfo.name}` : "Unknown Part";
      targetId = selectedPartForDemand;
      id = `demand_part_${selectedPartForDemand}`;
    } else { // Global
       id = `demand_global`;
    }
    
    const existingAdjustmentIndex = activeDemandAdjustments.findIndex(adj => 
        adj.type === demandAdjustmentType && 
        (demandAdjustmentType === 'global' || adj.targetId === targetId) // Match by targetId for category/part
    );

    if (existingAdjustmentIndex > -1) {
        // Update existing adjustment
        setActiveDemandAdjustments(prev => prev.map((adj, index) => 
            index === existingAdjustmentIndex ? { ...adj, adjustmentPercent: demandAdjustmentValue } : adj
        ));
    } else {
        // Add new adjustment
        setActiveDemandAdjustments(prev => [...prev, { id, type: demandAdjustmentType, targetName, targetId, adjustmentPercent: demandAdjustmentValue }]);
    }

    // Reset fields only if not global, or if you want to always reset
    if(demandAdjustmentType !== 'global') { 
      // Optionally keep global selected, or reset all:
      // setDemandAdjustmentType('global'); 
    }
    setSelectedCategoryForDemand("");
    setSelectedPartForDemand("");
    setDemandAdjustmentValue(0); // Always reset value
  };

  const handleRemoveDemandAdjustment = (idToRemove: string) => {
    setActiveDemandAdjustments(prev => prev.filter(adj => adj.id !== idToRemove));
  };


  const handleOpenSaveDialog = (edit = false) => {
    setIsEditMode(edit);
    if (edit && selectedScenarioToLoad) {
        // If editing, pre-fill with the loaded scenario's details
        const scenarioDataString = localStorage.getItem(LOCAL_STORAGE_SCENARIO_DATA_PREFIX + selectedScenarioToLoad);
        if (scenarioDataString) {
            const scenarioData: SavedScenario = JSON.parse(scenarioDataString);
            setCurrentScenarioName(scenarioData.name);
            setCurrentScenarioDescription(scenarioData.description);
        } else { // Fallback if data is missing for some reason
            setCurrentScenarioName(selectedScenarioToLoad);
            setCurrentScenarioDescription("");
        }
    } else {
        // For a new scenario, suggest a default name
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
      activeDemandAdjustments, 
    };
    localStorage.setItem(LOCAL_STORAGE_SCENARIO_DATA_PREFIX + scenarioData.name, JSON.stringify(scenarioData));
    
    if (!savedScenarioNames.includes(scenarioData.name)) {
      const newNames = [...savedScenarioNames, scenarioData.name].sort();
      setSavedScenarioNames(newNames);
      localStorage.setItem(LOCAL_STORAGE_SCENARIO_LIST_KEY, JSON.stringify(newNames));
    }
    
    toast({ title: "Scenario Saved", description: `Scenario "${scenarioData.name}" has been saved.`});
    setIsSaveScenarioDialogOpen(false);
    setSelectedScenarioToLoad(scenarioData.name); // Set the newly saved/edited scenario as active
  };

  const handleLoadScenario = (scenarioName: string) => {
    if (!scenarioName) return;
    const scenarioDataString = localStorage.getItem(LOCAL_STORAGE_SCENARIO_DATA_PREFIX + scenarioName);
    if (scenarioDataString) {
      const scenarioData: SavedScenario = JSON.parse(scenarioDataString);
      setAnalysisHomeCountry(scenarioData.analysisHomeCountry || defaultAnalysisHomeCountry); // Fallback for older scenarios
      setGlobalTariffAdjustmentPoints(scenarioData.globalTariffAdjustmentPoints);
      setGlobalLogisticsAdjustmentPoints(scenarioData.globalLogisticsAdjustmentPoints);
      setActiveCategoryAdjustments(scenarioData.activeCategoryAdjustments);
      setActiveCountryTariffAdjustments(scenarioData.activeCountryTariffAdjustments);
      setActiveDemandAdjustments(scenarioData.activeDemandAdjustments || []); // Fallback for older scenarios
      setSelectedScenarioToLoad(scenarioName);
      setCurrentScenarioName(scenarioData.name); // For edit consistency
      setCurrentScenarioDescription(scenarioData.description); // For edit consistency
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
    setSelectedScenarioToLoad(""); // Clear selected scenario
    // Optionally reset controls to default/base
    setAnalysisHomeCountry(defaultAnalysisHomeCountry);
    setGlobalTariffAdjustmentPoints(0);
    setGlobalLogisticsAdjustmentPoints(0);
    setActiveCategoryAdjustments([]);
    setActiveCountryTariffAdjustments([]);
    setActiveDemandAdjustments([]); 
  };
  
  const effectiveBaseTariffForDisplay = (BASE_TARIFF_RATE_FOR_WHAT_IF * (originalTariffMultiplierPercent / 100) * 100).toFixed(1);
  const effectiveBaseLogisticsForDisplay = originalTotalLogisticsCostPercent.toFixed(0);

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
              Adjust cost and demand factors to see potential impact. Scenarios can be saved and loaded. Base Tariff Rate for imports is {BASE_TARIFF_RATE_FOR_WHAT_IF * 100}%.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="bg-muted/30 p-3">
              <CardTitle className="text-sm font-medium mb-2 flex items-center">
                <Filter className="mr-2 h-4 w-4"/>Applied What-if Parameters
              </CardTitle>
              <ScrollArea className="h-28 text-xs"> 
                <ul className="list-disc list-inside space-y-1">
                  <li>Analysis Home Country: <strong>{analysisHomeCountry}</strong></li>
                  <li>Global Tariff Adjustment: {globalTariffAdjustmentPoints >= 0 ? "+" : ""}{globalTariffAdjustmentPoints} pts
                    <span className="text-muted-foreground text-2xs"> (Effective Base: {effectiveBaseTariffForDisplay}%)</span>
                  </li>
                  <li>Global Logistics Adj.: {globalLogisticsAdjustmentPoints >= 0 ? "+" : ""}{globalLogisticsAdjustmentPoints} pts
                     <span className="text-muted-foreground text-2xs"> (Base: {effectiveBaseLogisticsForDisplay}%)</span>
                  </li>
                  {activeCategoryAdjustments.map(adj => (
                    <li key={adj.categoryName}>
                      Category '{adj.categoryName}' Cost: {adj.costAdjustmentPercent >= 0 ? "+" : ""}{adj.costAdjustmentPercent}%
                    </li>
                  ))}
                  {activeCountryTariffAdjustments.map(adj => (
                    <li key={adj.countryName}>
                      Country '{adj.countryName}' Add. Tariff: {adj.tariffAdjustmentPoints >= 0 ? "+" : ""}{adj.tariffAdjustmentPoints} pts
                    </li>
                  ))}
                  {activeDemandAdjustments.map(adj => (
                    <li key={adj.id}>
                      Demand '{adj.type === 'global' ? 'Global' : adj.type === 'category' ? `Category: ${adj.targetName}` : `Part: ${adj.targetName}`}' Change: {adj.adjustmentPercent >= 0 ? "+" : ""}{adj.adjustmentPercent}%
                    </li>
                  ))}
                  {(globalTariffAdjustmentPoints === 0 && globalLogisticsAdjustmentPoints === 0 && activeCategoryAdjustments.length === 0 && activeCountryTariffAdjustments.length === 0 && activeDemandAdjustments.length === 0 && analysisHomeCountry === defaultAnalysisHomeCountry) && (
                    <li className="text-muted-foreground italic">No custom scenario adjustments applied. Using app base settings.</li>
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
              <h4 className="font-medium text-sm flex items-center"><Maximize className="h-4 w-4 mr-1.5"/>Global Cost Adjustments</h4>
              <div>
                <Label htmlFor="globalTariffSlider" className="text-xs">Global Tariff Adjustment (pts on effective rate: {effectiveBaseTariffForDisplay}%)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Slider id="globalTariffSlider" min={-100} max={100} step={1} value={[globalTariffAdjustmentPoints]} onValueChange={(val) => setGlobalTariffAdjustmentPoints(val[0])} className="flex-grow" />
                  <Input type="number" value={globalTariffAdjustmentPoints} onChange={(e)=> setGlobalTariffAdjustmentPoints(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                  <span className="text-xs w-5">pts</span>
                </div>
              </div>
              <div>
                <Label htmlFor="globalLogisticsSlider" className="text-xs">Global Logistics Cost Adj. (pts on base: {effectiveBaseLogisticsForDisplay}%)</Label>
                 <div className="flex items-center gap-2 mt-1">
                  <Slider id="globalLogisticsSlider" min={-100} max={100} step={1} value={[globalLogisticsAdjustmentPoints]} onValueChange={(val) => setGlobalLogisticsAdjustmentPoints(val[0])} className="flex-grow" />
                  <Input type="number" value={globalLogisticsAdjustmentPoints} onChange={(e)=> setGlobalLogisticsAdjustmentPoints(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right"/>
                  <span className="text-xs w-5">pts</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium text-sm flex items-center"><Palette className="h-4 w-4 mr-1.5"/>Category Specific Cost Adjustment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2">
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
            
            <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium text-sm flex items-center"><PackageSearch className="h-4 w-4 mr-1.5"/>Source Country Specific Tariff Adjustment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2">
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

            
            <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium text-sm flex items-center"><Activity className="h-4 w-4 mr-1.5"/>Demand Adjustments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pt-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="demandAdjustmentTypeSelect" className="text-xs">Type</Label>
                  <Select value={demandAdjustmentType} onValueChange={(val) => setDemandAdjustmentType(val as 'global' | 'category' | 'part')}>
                    <SelectTrigger id="demandAdjustmentTypeSelect" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global" className="text-xs">Global</SelectItem>
                      <SelectItem value="category" className="text-xs">By Category</SelectItem>
                      <SelectItem value="part" className="text-xs">By Part</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {demandAdjustmentType === 'category' && (
                  <div className="sm:col-span-4">
                    <Label htmlFor="selectCategoryForDemand" className="text-xs">Category</Label>
                    <Select value={selectedCategoryForDemand} onValueChange={setSelectedCategoryForDemand}>
                      <SelectTrigger id="selectCategoryForDemand" className="h-9 text-xs"><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {uniqueCategories.map(cat => <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {demandAdjustmentType === 'part' && (
                  <div className="sm:col-span-4">
                    <Label htmlFor="selectPartForDemand" className="text-xs">Part</Label>
                    <Select value={selectedPartForDemand} onValueChange={setSelectedPartForDemand}>
                      <SelectTrigger id="selectPartForDemand" className="h-9 text-xs"><SelectValue placeholder="Select Part" /></SelectTrigger>
                      <SelectContent>
                        {partsForSelect.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                 <div className={`sm:col-span-${
                    demandAdjustmentType === 'global' ? '8' : '4' 
                  }`}>
                  <Label htmlFor="demandAdjustmentSlider" className="text-xs">Demand Change (%)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Slider id="demandAdjustmentSlider" min={-100} max={200} step={1} value={[demandAdjustmentValue]} onValueChange={(val) => setDemandAdjustmentValue(val[0])} className="flex-grow" />
                    <Input type="number" value={demandAdjustmentValue} onChange={(e) => setDemandAdjustmentValue(parseInt(e.target.value))} className="w-20 h-8 text-xs text-right" />
                    <span className="text-xs w-5">%</span>
                  </div>
                </div>
                <Button 
                    onClick={handleAddDemandAdjustment} 
                    size="sm" 
                    className="h-9 text-xs sm:col-span-2 justify-self-end"
                    disabled={
                        (demandAdjustmentType === 'category' && !selectedCategoryForDemand) ||
                        (demandAdjustmentType === 'part' && !selectedPartForDemand)
                    }
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              {activeDemandAdjustments.length > 0 && (
                <ScrollArea className="mt-2 space-y-1 text-xs max-h-24 border rounded-md p-1.5 bg-background">
                  {activeDemandAdjustments.map(adj => (
                    <div key={adj.id} className="flex justify-between items-center p-1 bg-muted/60 rounded text-2xs my-0.5">
                      <span>
                        {adj.type === 'global' ? 'Global Demand' : adj.type === 'category' ? `Category: ${adj.targetName}` : `Part: ${adj.targetName}`}
                        : {adj.adjustmentPercent > 0 ? '+':''}{adj.adjustmentPercent}%
                      </span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-destructive/10" onClick={() => handleRemoveDemandAdjustment(adj.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
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
                {waterfallChartData.length <= 2 ? // Base and Final only means no intermediate changes
                     (<p className="text-xs text-muted-foreground text-center py-4">Adjust parameters to see detailed breakdown.</p>)
                : (
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
                         <TableRow className="border-t-2 border-foreground/50">
                            <TableCell className="p-1 font-bold">What-if Total Spend</TableCell>
                            <TableCell className="p-1 text-right font-bold"></TableCell>
                            <TableCell className="p-1 text-right font-bold">{formatCurrency(whatIfTotalAnnualSpend)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="p-1 font-bold">Net Change vs. Original</TableCell>
                             <TableCell 
                                className={`p-1 text-right font-bold ${netChangeAmount <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                            >
                                {netChangeAmount >= 0 ? "+" : ""}{formatCurrency(netChangeAmount)}
                            </TableCell>
                            <TableCell 
                                className={`p-1 text-right font-bold ${netChangeAmount <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                            >
                                ({netChangeAmount >= 0 ? "+" : ""}{netChangePercent.toFixed(2)}%)
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <hr />
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


    