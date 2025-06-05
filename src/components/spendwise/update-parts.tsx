
"use client";

import type { Part, Supplier, PartSupplierAssociation } from '@/types/spendwise';
import type { SpendDataPoint } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, Info, FileUp, Trash2, Sigma, PlusCircle, Focus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useState, useMemo } from 'react';

interface UpdatePartsTabProps {
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  onAddPart: () => void;
  spendByPartData: SpendDataPoint[];
  onOpenUploadDialog: () => void;
  tariffChargePercent: number;
  totalLogisticsCostPercent: number;
  suppliers: Supplier[];
  partSupplierAssociations: PartSupplierAssociation[];
  homeCountry: string;
  calculateSpendForSummary: (
    part: Part,
    currentTariffChargePercent: number,
    currentTotalLogisticsCostPercent: number,
    localSuppliers: Supplier[],
    localPartSupplierAssociations: PartSupplierAssociation[],
    localHomeCountry: string
  ) => number;
}

const spendByPartChartConfig = {
  spend: {
    label: "Spend ($)",
    color: "hsl(var(--chart-1))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

const ABC_COLORS = {
  A: "hsl(var(--chart-1))", // Blue
  B: "hsl(var(--chart-2))", // Green
  C: "hsl(var(--chart-3))", // Purple/Other
};

const abcBubbleChartConfig = {
  numParts: { label: "Number of Parts" },
  avgSpend: { label: "Avg. Spend/Part" },
  totalSpend: { label: "Total Spend (Bubble Size)" },
  "Class A": { label: "Class A", color: ABC_COLORS.A },
  "Class B": { label: "Class B", color: ABC_COLORS.B },
  "Class C": { label: "Class C", color: ABC_COLORS.C },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function UpdatePartsTab({
  parts,
  setParts,
  onAddPart,
  spendByPartData,
  onOpenUploadDialog,
  tariffChargePercent,
  totalLogisticsCostPercent,
  suppliers, 
  partSupplierAssociations, 
  homeCountry,
  calculateSpendForSummary
}: UpdatePartsTabProps) {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };
  
  const formatCurrencyWithDecimals = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPriceForInput = (value: number): string => {
    const fixedValue = value.toFixed(2);
    const priceParts = fixedValue.split('.');
    const integerPartFormatted = new Intl.NumberFormat('en-US').format(parseInt(priceParts[0], 10));
    return `${integerPartFormatted}.${priceParts[1]}`;
  };

  const handlePartInputChange = (partId: string, field: keyof Part, value: string | number) => {
    setParts(prevParts =>
      prevParts.map(p => {
        if (p.id === partId) {
          let processedValue = value;
          if (field === 'price') {
            const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
            processedValue = isNaN(numericValue) ? 0 : parseFloat(numericValue.toFixed(2));
          } else if (field === 'annualDemand') {
            const numericValue = typeof value === 'string' ? parseInt(String(value).replace(/,/g, ''), 10) : value;
            processedValue = isNaN(numericValue) ? 0 : numericValue;
          } else if (field === 'freightOhdCost') {
            const numericValue = typeof value === 'string' ? parseFloat(value) / 100 : Number(value) / 100;
             processedValue = (isNaN(numericValue) || numericValue < 0) ? 0 : Math.min(numericValue, 1);
          }
          return { ...p, [field]: processedValue };
        }
        return p;
      })
    );
  };
  
  const handlePriceChange = (partId: string, rawValue: string) => {
    handlePartInputChange(partId, 'price', rawValue);
  };

  const handleAnnualDemandChange = (partId: string, rawValue: string) => {
    const cleanedValue = rawValue.replace(/,/g, '');
    if (cleanedValue === '') {
      handlePartInputChange(partId, 'annualDemand', 0);
      return;
    }
    const numericValue = parseInt(cleanedValue, 10);
    if (!isNaN(numericValue)) {
      handlePartInputChange(partId, 'annualDemand', numericValue);
    }
  };

  const handlePartNameChange = (partId: string, value: string) => {
     setParts(prevParts =>
      prevParts.map(p => p.id === partId ? { ...p, name: value } : p)
    );
  };

  const handleDeletePart = (partId: string) => {
    setParts(prevParts => prevParts.filter(p => p.id !== partId));
    if (selectedPartId === partId) {
      setSelectedPartId(null);
    }
  };

  const totalPartsCount = useMemo(() => parts.length, [parts]);

  const partsWithSpend = useMemo(() => {
    return parts.map(part => ({
      ...part,
      annualSpend: calculateSpendForSummary(
        part,
        tariffChargePercent,
        totalLogisticsCostPercent,
        suppliers,
        partSupplierAssociations,
        homeCountry
      ),
    }));
  }, [parts, tariffChargePercent, totalLogisticsCostPercent, suppliers, partSupplierAssociations, homeCountry, calculateSpendForSummary]);

  const abcClassificationData = useMemo(() => {
    if (partsWithSpend.length === 0) {
      return { classBubbleData: { A: null, B: null, C: null } };
    }

    const sortedParts = [...partsWithSpend].sort((a, b) => b.annualSpend - a.annualSpend);
    const totalAnnualSpendAllParts = sortedParts.reduce((sum, p) => sum + p.annualSpend, 0);

    if (totalAnnualSpendAllParts === 0) {
      return { classBubbleData: { A: null, B: null, C: null } };
    }

    let cumulativeSpend = 0;
    const classifiedParts: { part: Part; annualSpend: number; class: 'A' | 'B' | 'C' }[] = [];

    for (const part of sortedParts) {
      cumulativeSpend += part.annualSpend;
      const cumulativePercent = cumulativeSpend / totalAnnualSpendAllParts;
      if (cumulativePercent <= 0.80) {
        classifiedParts.push({ ...part, class: 'A' });
      } else if (cumulativePercent <= 0.95) {
        classifiedParts.push({ ...part, class: 'B' });
      } else {
        classifiedParts.push({ ...part, class: 'C' });
      }
    }
    
    const classAggregatedData: { A: any; B: any; C: any; } = { A: null, B: null, C: null };
    const classTypes: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

    classTypes.forEach(className => {
      const partsInThisClass = classifiedParts.filter(p => p.class === className);
      if (partsInThisClass.length > 0) {
        const totalSpendInClass = partsInThisClass.reduce((sum, p) => sum + p.annualSpend, 0);
        classAggregatedData[className] = {
          name: `Class ${className}`,
          numParts: partsInThisClass.length,
          totalSpend: totalSpendInClass,
          avgSpend: totalSpendInClass / partsInThisClass.length,
          fill: ABC_COLORS[className],
        };
      }
    });
    
    return { classBubbleData: classAggregatedData };

  }, [partsWithSpend]);


  const totalSpend = useMemo(() => {
    return partsWithSpend.reduce((sum, p) => sum + p.annualSpend, 0);
  }, [partsWithSpend]);


  const totalVolume = useMemo(() => {
    return parts.reduce((sum, p) => sum + p.annualDemand, 0);
  }, [parts]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          <CardTitle className="text-lg">1A - Add/Update/Select Part</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">Manage individual parts, their pricing, and estimated annual demand. View spend analysis by part and category. Upload parts via CSV.</p>
            </TooltipContent>
          </Tooltip>
           <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onOpenUploadDialog} size="icon" variant="outline" aria-label="Upload Parts CSV">
                  <FileUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload Parts CSV</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onAddPart} size="icon" aria-label="Add New Part">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add New Part</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-8 gap-6 text-xs">
        <div className="md:col-span-5 space-y-3">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
            <div className="w-10"> {/* Spacer for radio */} </div>
            <div className="w-24 flex-shrink-0">Part #</div>
            <div className="flex-1 min-w-[120px]">Part Name</div>
            <div className="w-24 text-right">Base Cost</div>
            <div className="w-28 text-right">Annual Volume</div>
            <div className="w-28 text-right">Freight & OHD %</div>
            <div className="w-10"> {/* Spacer for delete */} </div>
          </div>

          {parts.length === 0 ? (
            <p className="text-muted-foreground text-center py-3">No parts available. Generate, add, or upload some parts.</p>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-480px)] min-h-[200px]">
              <RadioGroup value={selectedPartId || undefined} onValueChange={setSelectedPartId} className="space-y-2 pr-2">
                {parts.map((part) => (
                  <div key={part.id} className="flex items-center gap-2 p-2.5 rounded-md border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <RadioGroupItem value={part.id} id={`part-${part.id}`} className="h-5 w-5" />

                    <div className="w-24 flex-shrink-0 font-mono text-xs truncate" title={part.partNumber}>
                      {part.partNumber}
                    </div>

                    <Input
                      type="text"
                      value={part.name}
                      onChange={(e) => handlePartNameChange(part.id, e.target.value)}
                      className="h-8 text-xs flex-1 min-w-[120px]"
                      placeholder="Part Name"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="text"
                        value={formatPriceForInput(part.price)}
                        onChange={(e) => handlePriceChange(part.id, e.target.value)}
                        className="h-8 text-xs pl-5 text-right"
                        placeholder="0.00"
                      />
                    </div>
                     <Input
                        type="text"
                        value={formatNumber(part.annualDemand)}
                        onChange={(e) => handleAnnualDemandChange(part.id, e.target.value)}
                        className="h-8 text-xs w-28 text-right"
                        placeholder="0"
                      />
                     <div className="relative w-28">
                      <Input
                        type="number"
                        value={parseFloat((part.freightOhdCost * 100).toFixed(2))}
                        onChange={(e) => handlePartInputChange(part.id, 'freightOhdCost', e.target.value)}
                        className="h-8 text-xs pr-5 text-right"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeletePart(part.id)} aria-label="Delete Part">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          )}
          <div className="mt-4 p-3 border rounded-md bg-muted/50">
            <h4 className="text-sm font-semibold mb-2 flex items-center"><Sigma className="h-4 w-4 mr-1.5"/>Summary</h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Total # Parts:</p>
                <p className="font-medium">{formatNumber(totalPartsCount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Spend:</p>
                <p className="font-medium">{formatCurrency(totalSpend)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Volume:</p>
                <p className="font-medium">{formatNumber(totalVolume)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                 Part Spend Analysis
              </CardTitle>
               <Tooltip>
                <TooltipTrigger asChild>
                   <span className="text-xs text-muted-foreground cursor-default flex items-center">Top 10 parts by spend <Info className="ml-1 h-3 w-3" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Top 10 parts by calculated spend (Base Cost x Annual Volume, adjusted by Tariff & Logistics).</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="pt-0">
              {spendByPartData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No spend data to display.</p>
              ) : (
                <ChartContainer config={spendByPartChartConfig} className="min-h-[180px] w-full aspect-video">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart accessibilityLayer data={spendByPartData} layout="vertical" margin={{ left: 5, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" dataKey="spend" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={60} tick={{ fontSize: 10 }} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(value as number)} />}
                      />
                      <Bar dataKey="spend" fill="var(--color-spend)" radius={3} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Focus className="mr-1.5 h-4 w-4" />
                ABC Analysis by Class
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                   <span className="text-xs text-muted-foreground cursor-default flex items-center">Bubble size by Total Spend. X: # Parts, Y: Avg. Spend/Part. <Info className="ml-1 h-3 w-3" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    ABC analysis classifies parts: Class A (top 80% spend), B (next 15%), C (last 5%).<br/>
                    X-axis: Number of parts in class.<br/>
                    Y-axis: Average spend per part in class.<br/>
                    Bubble Size: Total annual spend for the class.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="pt-0">
              {Object.values(abcClassificationData.classBubbleData).every(c => c === null) ? (
                <p className="text-xs text-muted-foreground text-center py-3">No data for ABC bubble chart analysis.</p>
              ) : (
                <ChartContainer config={abcBubbleChartConfig} className="min-h-[220px] w-full">
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="numParts" name="Number of Parts" tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                      <YAxis type="number" dataKey="avgSpend" name="Avg. Spend/Part" tickFormatter={formatCurrencyWithDecimals} tick={{ fontSize: 10 }} />
                      <ZAxis type="number" dataKey="totalSpend" range={[150, 1500]} name="Total Annual Spend" />
                      <RechartsTooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2.5 shadow-xl text-xs">
                                <p className="font-medium mb-1" style={{color: data.fill}}>{data.name}</p>
                                <p>Parts: {formatNumber(data.numParts)}</p>
                                <p>Avg Spend/Part: {formatCurrencyWithDecimals(data.avgSpend)}</p>
                                <p>Total Spend: {formatCurrency(data.totalSpend)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{fontSize: "10px"}} />
                      {abcClassificationData.classBubbleData.A && (
                        <Scatter name="Class A" data={[abcClassificationData.classBubbleData.A]} fill={abcClassificationData.classBubbleData.A.fill} shape="circle" />
                      )}
                      {abcClassificationData.classBubbleData.B && (
                        <Scatter name="Class B" data={[abcClassificationData.classBubbleData.B]} fill={abcClassificationData.classBubbleData.B.fill} shape="circle" />
                      )}
                      {abcClassificationData.classBubbleData.C && (
                        <Scatter name="Class C" data={[abcClassificationData.classBubbleData.C]} fill={abcClassificationData.classBubbleData.C.fill} shape="circle" />
                      )}
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

