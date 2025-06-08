
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import type { Part, Supplier, PartCategoryMapping, PartSupplierAssociation } from '@/types/spendwise';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Info, Percent, DollarSign, Trash2, PlusCircle, ChevronsUpDown, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WhatIfAnalysisTabProps {
  parts: Part[];
  suppliers: Supplier[];
  partCategoryMappings: PartCategoryMapping[];
  partSupplierAssociations: PartSupplierAssociation[];
  originalTotalAnnualSpend: number;
  originalTariffChargePercent: number; // Base tariff effect (e.g., 100 means 1x, 110 means 1.1x)
  originalTotalLogisticsCostPercent: number; // Base logistics effect (e.g., 100 means 1x FOH, 110 means 1.1x FOH)
  homeCountry: string;
}

interface CategoryAdjustment {
  categoryName: string;
  costAdjustmentPercent: number; // e.g., -10 for -10%, 5 for +5%
}

interface CountryTariffAdjustment {
  countryName: string;
  tariffAdjustmentPoints: number; // e.g., 5 for +5 percentage points
}

export default function WhatIfAnalysisTab({
  parts,
  suppliers,
  partCategoryMappings,
  partSupplierAssociations,
  originalTotalAnnualSpend,
  originalTariffChargePercent,
  originalTotalLogisticsCostPercent,
  homeCountry,
}: WhatIfAnalysisTabProps) {
  // State for global adjustments
  const [globalTariffAdjustmentPoints, setGlobalTariffAdjustmentPoints] = useState(0); // Additive points
  const [globalLogisticsAdjustmentPoints, setGlobalLogisticsAdjustmentPoints] = useState(0); // Additive points

  // State for category-specific cost adjustments
  const [selectedCategoryForAdjustment, setSelectedCategoryForAdjustment] = useState<string>("");
  const [categoryCostAdjustmentValue, setCategoryCostAdjustmentValue] = useState(0); // Percentage change
  const [activeCategoryAdjustments, setActiveCategoryAdjustments] = useState<CategoryAdjustment[]>([]);

  // State for country-specific tariff adjustments
  const [selectedCountryForTariff, setSelectedCountryForTariff] = useState<string>("");
  const [countryTariffAdjustmentValue, setCountryTariffAdjustmentValue] = useState(0); // Additive points
  const [activeCountryTariffAdjustments, setActiveCountryTariffAdjustments] = useState<CountryTariffAdjustment[]>([]);

  const uniqueCategories = useMemo(() => Array.from(new Set(partCategoryMappings.map(pcm => pcm.categoryName))).sort(), [partCategoryMappings]);
  const uniqueSupplierCountries = useMemo(() => Array.from(new Set(suppliers.map(s => s.country))).sort(), [suppliers]);

  const formatCurrency = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };

  const calculateAdjustedSpendForPart = useCallback((
    part: Part
  ): number => {
    let adjustedPrice = part.price;

    // 1. Apply category-specific cost adjustments
    const categoryMappingsForPart = partCategoryMappings.filter(pcm => pcm.partId === part.id);
    for (const mapping of categoryMappingsForPart) {
      const categoryAdjustment = activeCategoryAdjustments.find(adj => adj.categoryName === mapping.categoryName);
      if (categoryAdjustment) {
        adjustedPrice *= (1 + categoryAdjustment.costAdjustmentPercent / 100);
      }
    }

    // 2. Determine if imported and base tariff effect
    const partSuppliers = partSupplierAssociations
      .filter(assoc => assoc.partId === part.id)
      .map(assoc => suppliers.find(s => s.id === assoc.supplierId))
      .filter(s => s !== undefined) as Supplier[];

    const isEffectivelyImported = partSuppliers.length > 0 ? partSuppliers.some(s => s.country !== homeCountry) : false;
    
    let currentEffectiveTariffPercent = 100; // Base for non-imported or no suppliers
    if (isEffectivelyImported) {
      currentEffectiveTariffPercent = originalTariffChargePercent + globalTariffAdjustmentPoints;
      // Apply country-specific tariff adjustment if any supplier is from that country
      for (const supplier of partSuppliers) {
        const countryAdjustment = activeCountryTariffAdjustments.find(adj => adj.countryName === supplier.country);
        if (countryAdjustment) {
          currentEffectiveTariffPercent += countryAdjustment.tariffAdjustmentPoints; // Additive points
          break; // Assume first matching supplier's country tariff applies or take max/min (simplifying for now)
        }
      }
    }
    const tariffMultiplier = currentEffectiveTariffPercent / 100;
    adjustedPrice *= tariffMultiplier;

    // 3. Calculate effective logistics cost
    const currentEffectiveLogisticsPercent = originalTotalLogisticsCostPercent + globalLogisticsAdjustmentPoints;
    const logisticsRateMultiplier = currentEffectiveLogisticsPercent / 100;
    const effectiveFreightOhdRate = part.freightOhdCost * logisticsRateMultiplier;
    
    return adjustedPrice * part.annualDemand * (1 + effectiveFreightOhdRate);
  }, [
    partCategoryMappings, activeCategoryAdjustments, 
    partSupplierAssociations, suppliers, homeCountry, 
    originalTariffChargePercent, globalTariffAdjustmentPoints, activeCountryTariffAdjustments,
    originalTotalLogisticsCostPercent, globalLogisticsAdjustmentPoints
  ]);

  const whatIfTotalAnnualSpend = useMemo(() => {
    if (!parts || parts.length === 0) return 0;
    return parts.reduce((sum, part) => sum + calculateAdjustedSpendForPart(part), 0);
  }, [parts, calculateAdjustedSpendForPart]);

  const netChangeAmount = useMemo(() => whatIfTotalAnnualSpend - originalTotalAnnualSpend, [whatIfTotalAnnualSpend, originalTotalAnnualSpend]);
  const netChangePercent = useMemo(() => originalTotalAnnualSpend !== 0 ? (netChangeAmount / originalTotalAnnualSpend) * 100 : 0, [netChangeAmount, originalTotalAnnualSpend]);

  // Handlers for adding/removing category/country adjustments
  const handleAddCategoryAdjustment = () => {
    if (!selectedCategoryForAdjustment || categoryCostAdjustmentValue === 0) return;
    setActiveCategoryAdjustments(prev => {
      const existing = prev.find(adj => adj.categoryName === selectedCategoryForAdjustment);
      if (existing) {
        return prev.map(adj => adj.categoryName === selectedCategoryForAdjustment ? { ...adj, costAdjustmentPercent: categoryCostAdjustmentValue } : adj);
      }
      return [...prev, { categoryName: selectedCategoryForAdjustment, costAdjustmentPercent: categoryCostAdjustmentValue }];
    });
  };

  const handleRemoveCategoryAdjustment = (categoryName: string) => {
    setActiveCategoryAdjustments(prev => prev.filter(adj => adj.categoryName !== categoryName));
  };
  
  const handleAddCountryTariffAdjustment = () => {
    if (!selectedCountryForTariff || countryTariffAdjustmentValue === 0) return;
    setActiveCountryTariffAdjustments(prev => {
      const existing = prev.find(adj => adj.countryName === selectedCountryForTariff);
      if (existing) {
        return prev.map(adj => adj.countryName === selectedCountryForTariff ? { ...adj, tariffAdjustmentPoints: countryTariffAdjustmentValue } : adj);
      }
      return [...prev, { countryName: selectedCountryForTariff, tariffAdjustmentPoints: countryTariffAdjustmentValue }];
    });
  };

  const handleRemoveCountryTariffAdjustment = (countryName: string) => {
    setActiveCountryTariffAdjustments(prev => prev.filter(adj => adj.countryName !== countryName));
  };


  // Impact breakdown (simplified for now)
  const impactSummary = useMemo(() => {
    // This is a simplified calculation. A more precise breakdown would involve
    // calculating spend with only one adjustment at a time vs. baseline.
    const baseTotalSpend = originalTotalAnnualSpend;
    
    // Calculate spend with only global tariff change
    const onlyGlobalTariffParts = parts.map(part => {
        let tempPrice = part.price;
        const partSuppliers = partSupplierAssociations.filter(assoc => assoc.partId === part.id).map(assoc => suppliers.find(s => s.id === assoc.supplierId)).filter(s => s !== undefined) as Supplier[];
        const isEffectivelyImported = partSuppliers.length > 0 ? partSuppliers.some(s => s.country !== homeCountry) : false;
        if (isEffectivelyImported) {
            tempPrice *= (originalTariffChargePercent + globalTariffAdjustmentPoints) / 100;
        }
        const logisticsRateMultiplier = originalTotalLogisticsCostPercent / 100;
        const effectiveFreightOhdRate = part.freightOhdCost * logisticsRateMultiplier;
        return tempPrice * part.annualDemand * (1 + effectiveFreightOhdRate);
    });
    const globalTariffImpact = onlyGlobalTariffParts.reduce((sum, spend) => sum + spend, 0) - baseTotalSpend;

    // Calculate spend with only global logistics change
     const onlyGlobalLogisticsParts = parts.map(part => {
        let tempPrice = part.price;
        const partSuppliers = partSupplierAssociations.filter(assoc => assoc.partId === part.id).map(assoc => suppliers.find(s => s.id === assoc.supplierId)).filter(s => s !== undefined) as Supplier[];
        const isEffectivelyImported = partSuppliers.length > 0 ? partSuppliers.some(s => s.country !== homeCountry) : false;
        if (isEffectivelyImported) {
            tempPrice *= originalTariffChargePercent / 100;
        }
        const logisticsRateMultiplier = (originalTotalLogisticsCostPercent + globalLogisticsAdjustmentPoints) / 100;
        const effectiveFreightOhdRate = part.freightOhdCost * logisticsRateMultiplier;
        return tempPrice * part.annualDemand * (1 + effectiveFreightOhdRate);
    });
    const globalLogisticsImpact = onlyGlobalLogisticsParts.reduce((sum, spend) => sum + spend, 0) - baseTotalSpend;
    
    return {
      globalTariffImpact,
      globalLogisticsImpact,
      // Placeholder for category and country specific impacts
      categoryAdjustmentsImpact: 0, 
      countryTariffAdjustmentsImpact: 0,
    };

  }, [originalTotalAnnualSpend, parts, globalTariffAdjustmentPoints, globalLogisticsAdjustmentPoints, originalTariffChargePercent, originalTotalLogisticsCostPercent, homeCountry, partSupplierAssociations, suppliers]);


  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section 1A: Controls */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <ChevronsUpDown className="mr-2 h-5 w-5 text-primary" />
              What-if Controls
            </CardTitle>
            <CardDescription>
              Adjust cost factors to see their potential impact on total spend. 
              Adjustments are applied on top of the main Tariff and Logistics settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Applied Changes Display */}
            <Card className="bg-muted/50 p-4">
              <CardTitle className="text-sm font-medium mb-2">Current What-if Scenario:</CardTitle>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>Global Tariff Adjustment: {globalTariffAdjustmentPoints >= 0 ? "+" : ""}{globalTariffAdjustmentPoints} points
                  <span className="text-muted-foreground text-2xs"> (New effective base tariff for imports: {originalTariffChargePercent + globalTariffAdjustmentPoints}%)</span>
                </li>
                <li>Global Logistics Adj.: {globalLogisticsAdjustmentPoints >= 0 ? "+" : ""}{globalLogisticsAdjustmentPoints} points
                   <span className="text-muted-foreground text-2xs"> (New effective base logistics rate: {originalTotalLogisticsCostPercent + globalLogisticsAdjustmentPoints}%)</span>
                </li>
                {activeCategoryAdjustments.map(adj => (
                  <li key={adj.categoryName}>
                    Category '{adj.categoryName}' Cost: {adj.costAdjustmentPercent >= 0 ? "+" : ""}{adj.costAdjustmentPercent}%
                  </li>
                ))}
                {activeCountryTariffAdjustments.map(adj => (
                  <li key={adj.countryName}>
                    Country '{adj.countryName}' Additional Tariff: {adj.tariffAdjustmentPoints >= 0 ? "+" : ""}{adj.tariffAdjustmentPoints} points
                  </li>
                ))}
                {(globalTariffAdjustmentPoints === 0 && globalLogisticsAdjustmentPoints === 0 && activeCategoryAdjustments.length === 0 && activeCountryTariffAdjustments.length === 0) && (
                  <li className="text-muted-foreground">No adjustments applied.</li>
                )}
              </ul>
            </Card>

            {/* Global Adjustments */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="font-medium text-sm">Global Adjustments</h4>
              <div>
                <Label htmlFor="globalTariffSlider" className="text-xs">Global Tariff Adjustment (percentage points)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="globalTariffSlider"
                    min={-50} max={50} step={1}
                    value={[globalTariffAdjustmentPoints]}
                    onValueChange={(val) => setGlobalTariffAdjustmentPoints(val[0])}
                    className="flex-grow"
                  />
                  <span className="text-xs w-12 text-right">{globalTariffAdjustmentPoints}%</span>
                </div>
              </div>
              <div>
                <Label htmlFor="globalLogisticsSlider" className="text-xs">Global Logistics Cost Adj. (percentage points)</Label>
                 <div className="flex items-center gap-2">
                  <Slider
                    id="globalLogisticsSlider"
                    min={-50} max={50} step={1}
                    value={[globalLogisticsAdjustmentPoints]}
                    onValueChange={(val) => setGlobalLogisticsAdjustmentPoints(val[0])}
                    className="flex-grow"
                  />
                  <span className="text-xs w-12 text-right">{globalLogisticsAdjustmentPoints}%</span>
                </div>
              </div>
            </div>

            {/* Category-Specific Adjustments */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="font-medium text-sm">Category Cost Adjustment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div className="sm:col-span-1">
                  <Label htmlFor="selectCategoryCost" className="text-xs">Category</Label>
                  <Select value={selectedCategoryForAdjustment} onValueChange={setSelectedCategoryForAdjustment}>
                    <SelectTrigger id="selectCategoryCost" className="h-9 text-xs"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {uniqueCategories.map(cat => <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="categoryCostPercent" className="text-xs">Cost Adj. (%)</Label>
                  <Input id="categoryCostPercent" type="number" value={categoryCostAdjustmentValue} onChange={e => setCategoryCostAdjustmentValue(parseFloat(e.target.value))} placeholder="e.g. -10 or 5" className="h-9 text-xs"/>
                </div>
                <Button onClick={handleAddCategoryAdjustment} size="sm" className="h-9 text-xs" disabled={!selectedCategoryForAdjustment}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Add/Update
                </Button>
              </div>
              {activeCategoryAdjustments.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium">Active Category Adjustments:</p>
                  {activeCategoryAdjustments.map(adj => (
                    <div key={adj.categoryName} className="flex justify-between items-center p-1 bg-muted/30 rounded">
                      <span>{adj.categoryName}: {adj.costAdjustmentPercent > 0 ? '+':''}{adj.costAdjustmentPercent}%</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveCategoryAdjustment(adj.categoryName)}><Trash2 className="h-3 w-3"/></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Country-Specific Tariff Adjustments */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="font-medium text-sm">Source Country Tariff Adjustment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                 <div className="sm:col-span-1">
                  <Label htmlFor="selectCountryTariff" className="text-xs">Country</Label>
                  <Select value={selectedCountryForTariff} onValueChange={setSelectedCountryForTariff}>
                    <SelectTrigger id="selectCountryTariff" className="h-9 text-xs"><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      {uniqueSupplierCountries.map(country => <SelectItem key={country} value={country} className="text-xs">{country}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="countryTariffPoints" className="text-xs">Add. Tariff (points)</Label>
                  <Input id="countryTariffPoints" type="number" value={countryTariffAdjustmentValue} onChange={e => setCountryTariffAdjustmentValue(parseFloat(e.target.value))} placeholder="e.g. 5 or -2" className="h-9 text-xs"/>
                </div>
                <Button onClick={handleAddCountryTariffAdjustment} size="sm" className="h-9 text-xs" disabled={!selectedCountryForTariff}>
                  <PlusCircle className="mr-1 h-4 w-4" /> Add/Update
                </Button>
              </div>
              {activeCountryTariffAdjustments.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium">Active Country Tariff Adjustments:</p>
                  {activeCountryTariffAdjustments.map(adj => (
                    <div key={adj.countryName} className="flex justify-between items-center p-1 bg-muted/30 rounded">
                      <span>{adj.countryName}: {adj.tariffAdjustmentPoints > 0 ? '+':''}{adj.tariffAdjustmentPoints} points</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveCountryTariffAdjustment(adj.countryName)}><Trash2 className="h-3 w-3"/></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Section 1B: Summary of Impact */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              Impact Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Original Total Annual Spend</Label>
              <p className="font-semibold">{formatCurrency(originalTotalAnnualSpend)}</p>
            </div>
            <hr/>
            <div className="font-medium text-xs text-muted-foreground">Incremental Cost Impact:</div>
            <div className="pl-2 space-y-1 text-xs">
                <div className="flex justify-between">
                    <span>Global Tariff Adj.:</span>
                    <span className={impactSummary.globalTariffImpact >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {impactSummary.globalTariffImpact >= 0 ? "+" : ""}{formatCurrency(impactSummary.globalTariffImpact)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Global Logistics Adj.:</span>
                    <span className={impactSummary.globalLogisticsImpact >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {impactSummary.globalLogisticsImpact >= 0 ? "+" : ""}{formatCurrency(impactSummary.globalLogisticsImpact)}
                    </span>
                </div>
                 <p className="text-muted-foreground text-2xs italic">(Category & Country specific impact calculations are placeholders)</p>
            </div>
             <hr/>
            <div>
              <Label className="text-xs text-muted-foreground">What-if Total Annual Spend</Label>
              <p className="font-semibold text-base">{formatCurrency(whatIfTotalAnnualSpend)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Net Change</Label>
              <p className={`font-semibold ${netChangeAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {netChangeAmount >= 0 ? "+" : ""}{formatCurrency(netChangeAmount)} 
                ({netChangeAmount >= 0 ? "+" : ""}{netChangePercent.toFixed(2)}%)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

    