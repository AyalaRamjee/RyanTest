
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Part, Supplier, PartCategoryMapping, PartSupplierAssociation } from '@/types/spendwise';
import type { SpendDataPoint, DemandDataPoint, CountDataPoint } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, DollarSign, Package, Users, FolderTree, TrendingUp, ShoppingCart } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

const LOCAL_STORAGE_SCENARIO_LIST_KEY = "spendwise_scenario_list_v2"; 
const LOCAL_STORAGE_SCENARIO_DATA_PREFIX = "spendwise_scenario_data_v2_";
const VIEW_CURRENT_DATA_VALUE = "__VIEW_CURRENT_DATA__"; // Constant for special value

interface SavedScenario {
  name: string;
  description: string;
  analysisHomeCountry: string;
  globalTariffAdjustmentPoints: number;
  globalLogisticsAdjustmentPoints: number;
  activeCategoryAdjustments: { categoryName: string; costAdjustmentPercent: number }[];
  activeCountryTariffAdjustments: { countryName: string; tariffAdjustmentPoints: number }[];
  activeDemandAdjustments: { id: string; type: 'global' | 'category' | 'part'; targetName?: string; targetId?: string; adjustmentPercent: number }[];
}

interface ReviewSummaryTabProps {
  parts: Part[];
  suppliers: Supplier[];
  partCategoryMappings: PartCategoryMapping[];
  partSupplierAssociations: PartSupplierAssociation[];
  partsWithSpend: (Part & { annualSpend: number })[]; // Based on main app's current settings
  spendByCategoryData: SpendDataPoint[]; // Based on main app's current settings
  defaultAnalysisHomeCountry: string;
  originalTariffMultiplierPercent: number;
  originalTotalLogisticsCostPercent: number;
  totalAnnualSpend: number;
  totalParts: number;
  totalSuppliers: number;
  totalCategories: number;
}

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ReviewSummaryTab({
  parts,
  suppliers,
  partCategoryMappings,
  partSupplierAssociations,
  partsWithSpend, // Use this for current app state display
  spendByCategoryData: initialSpendByCategory, // Use this for current app state display
  defaultAnalysisHomeCountry,
  originalTariffMultiplierPercent,
  originalTotalLogisticsCostPercent,
  totalAnnualSpend,
  totalParts,
  totalSuppliers,
  totalCategories
}: ReviewSummaryTabProps) {
  const [selectedScenarioName, setSelectedScenarioName] = useState<string>("");
  const [loadedScenario, setLoadedScenario] = useState<SavedScenario | null>(null);
  const [savedScenarioNames, setSavedScenarioNames] = useState<string[]>([]);

  useEffect(() => {
    const storedNames = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_SCENARIO_LIST_KEY) : null;
    if (storedNames) {
      setSavedScenarioNames(JSON.parse(storedNames));
    }
  }, []);

  const handleLoadScenario = (scenarioName: string) => {
    if (scenarioName === VIEW_CURRENT_DATA_VALUE || typeof window === 'undefined') {
      setLoadedScenario(null);
      setSelectedScenarioName(""); // Set to empty to show placeholder
      return;
    }
    const scenarioDataString = localStorage.getItem(LOCAL_STORAGE_SCENARIO_DATA_PREFIX + scenarioName);
    if (scenarioDataString) {
      const scenarioData: SavedScenario = JSON.parse(scenarioDataString);
      setLoadedScenario(scenarioData);
      setSelectedScenarioName(scenarioName); // Keep actual scenario name
    } else {
      setLoadedScenario(null);
      setSelectedScenarioName(""); // Fallback if scenario data not found
    }
  };

  const formatCurrency = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  };
  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

  // Data for charts - initially based on main app state
  // In a future iteration, these would be recalculated if a scenario is loaded and applied
  const currentSpendByCategoryData = initialSpendByCategory;

  const currentSpendByTopPartsData: SpendDataPoint[] = useMemo(() => {
    return [...partsWithSpend]
      .sort((a, b) => b.annualSpend - a.annualSpend)
      .slice(0, 5)
      .map(p => ({ name: p.partNumber, spend: p.annualSpend }));
  }, [partsWithSpend]);

  const currentDemandByTopPartsData: DemandDataPoint[] = useMemo(() => {
    return [...parts]
      .sort((a,b) => b.annualDemand - a.annualDemand)
      .slice(0,5)
      .map(p => ({ name: p.partNumber, demand: p.annualDemand }));
  }, [parts]);

  const displayMetrics = useMemo(() => {
    // Placeholder: In a future state, if loadedScenario is not null, recalculate these metrics
    // based on scenario parameters. For now, it shows main app metrics.
    return {
      spend: totalAnnualSpend,
      parts: totalParts,
      suppliers: totalSuppliers,
      categories: totalCategories,
    };
  }, [totalAnnualSpend, totalParts, totalSuppliers, totalCategories, loadedScenario]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Review Summary
            </CardTitle>
            <div className="w-64">
              <Select value={selectedScenarioName} onValueChange={handleLoadScenario}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Load Scenario for Context (View Only)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VIEW_CURRENT_DATA_VALUE} className="text-xs">View Current App Data</SelectItem>
                  {savedScenarioNames.map(name => (
                    <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {loadedScenario && (
            <CardDescription className="text-xs mt-1">
              Viewing context for scenario: <strong>{loadedScenario.name}</strong>. 
              <span className="italic"> (Charts currently show main app data, not scenario-specific calculations).</span>
              <br/>{loadedScenario.description}
            </CardDescription>
          )}
           {!loadedScenario && (
            <CardDescription className="text-xs mt-1">
              Displaying metrics and charts based on the current main application data.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Spend</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(displayMetrics.spend)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Parts</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatNumber(displayMetrics.parts)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Suppliers</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatNumber(displayMetrics.suppliers)}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Categories</CardTitle><FolderTree className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatNumber(displayMetrics.categories)}</div></CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader><CardTitle className="text-base flex items-center"><TrendingUp className="mr-1.5 h-4 w-4"/>Spend by Category</CardTitle></CardHeader>
                    <CardContent>
                        {currentSpendByCategoryData.length === 0 ? (<p className="text-xs text-muted-foreground text-center py-8">No category spend data.</p>) : (
                        <ChartContainer config={{}} className="min-h-[250px] w-full text-xs">
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsBarChart data={currentSpendByCategoryData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3"/>
                                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value).replace('$', '')[0] + (Math.abs(value) > 1e6 ? (value/1e6).toFixed(0)+'M' : Math.abs(value) > 1e3 ? (value/1e3).toFixed(0)+'K' : value )} tick={{fontSize:10}} />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize:10}}/>
                                    <RechartsTooltip formatter={(value:number) => formatCurrency(value)} contentStyle={{fontSize:'10px', padding:'2px 8px'}}/>
                                    <Bar dataKey="spend" barSize={15} radius={[0, 3, 3, 0]}>
                                       {currentSpendByCategoryData.map((entry, index) => (
                                          <Cell key={`cell-cat-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        )}
                    </CardContent>
                </Card>
                <Card className="md:col-span-1">
                    <CardHeader><CardTitle className="text-base flex items-center"><DollarSign className="mr-1.5 h-4 w-4"/>Top 5 Parts by Spend</CardTitle></CardHeader>
                    <CardContent>
                         {currentSpendByTopPartsData.length === 0 ? (<p className="text-xs text-muted-foreground text-center py-8">No part spend data.</p>) : (
                        <ChartContainer config={{}} className="min-h-[250px] w-full text-xs">
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsBarChart data={currentSpendByTopPartsData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3"/>
                                     <XAxis type="number" tickFormatter={(value) => formatCurrency(value).replace('$', '')[0] + (Math.abs(value) > 1e6 ? (value/1e6).toFixed(0)+'M' : Math.abs(value) > 1e3 ? (value/1e3).toFixed(0)+'K' : value )} tick={{fontSize:10}} />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize:10}}/>
                                    <RechartsTooltip formatter={(value:number) => formatCurrency(value)} contentStyle={{fontSize:'10px', padding:'2px 8px'}}/>
                                    <Bar dataKey="spend" barSize={15} radius={[0, 3, 3, 0]}>
                                       {currentSpendByTopPartsData.map((entry, index) => (
                                          <Cell key={`cell-psp-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                         )}
                    </CardContent>
                </Card>
                 <Card className="md:col-span-1">
                    <CardHeader><CardTitle className="text-base flex items-center"><ShoppingCart className="mr-1.5 h-4 w-4"/>Top 5 Parts by Demand</CardTitle></CardHeader>
                    <CardContent>
                         {currentDemandByTopPartsData.length === 0 ? (<p className="text-xs text-muted-foreground text-center py-8">No part demand data.</p>) : (
                        <ChartContainer config={{}} className="min-h-[250px] w-full text-xs">
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsBarChart data={currentDemandByTopPartsData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3"/>
                                    <XAxis type="number" tickFormatter={(value) => formatNumber(value).length > 6 ? (value/1e6).toFixed(1)+'M' : (value/1e3).toFixed(1)+'K'} tick={{fontSize:10}} />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize:10}}/>
                                    <RechartsTooltip formatter={(value:number) => formatNumber(value) + " units"} contentStyle={{fontSize:'10px', padding:'2px 8px'}}/>
                                    <Bar dataKey="demand" barSize={15} radius={[0, 3, 3, 0]}>
                                         {currentDemandByTopPartsData.map((entry, index) => (
                                          <Cell key={`cell-pdp-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                         )}
                    </CardContent>
                </Card>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    