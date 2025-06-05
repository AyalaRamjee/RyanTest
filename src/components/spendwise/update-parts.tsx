
"use client";

import type { Part, Supplier, PartSupplierAssociation } from '@/types/spendwise';
import type { SpendDataPoint } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, Info, FileUp, Trash2, Sigma, PlusCircle, Focus } from "lucide-react";
import { Bar, BarChart, Cell, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
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

const abcChartConfig = {
  value: { label: "Value" },
} satisfies import("@/components/ui/chart").ChartConfig;


const ABC_COLORS = {
  A: "hsl(var(--chart-1))",
  B: "hsl(var(--chart-4))",
  C: "hsl(var(--chart-3))",
};


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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const handlePartInputChange = (partId: string, field: keyof Part, value: string | number) => {
    setParts(prevParts =>
      prevParts.map(p => {
        if (p.id === partId) {
          let processedValue = value;
          if (field === 'price' || field === 'annualDemand') {
            const numericValue = typeof value === 'string' ? parseFloat(value) : value;
            processedValue = isNaN(numericValue) ? 0 : numericValue;
          } else if (field === 'freightOhdCost') {
            const numericValue = typeof value === 'string' ? parseFloat(value) / 100 : value / 100;
             processedValue = (isNaN(numericValue) || numericValue < 0) ? 0 : Math.min(numericValue, 1);
          }
          return { ...p, [field]: processedValue };
        }
        return p;
      })
    );
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
      return {
        spendByClass: [],
      };
    }

    const sortedParts = [...partsWithSpend].sort((a, b) => b.annualSpend - a.annualSpend);
    const totalAnnualSpendAllParts = sortedParts.reduce((sum, p) => sum + p.annualSpend, 0);

    if (totalAnnualSpendAllParts === 0) {
        return {
            spendByClass: [
                { name: 'Class A', value: 0, fill: ABC_COLORS.A },
                { name: 'Class B', value: 0, fill: ABC_COLORS.B },
                { name: 'Class C', value: 0, fill: ABC_COLORS.C },
            ],
        };
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

    const spendByClass = [
      { name: 'Class A', value: classifiedParts.filter(p => p.class === 'A').reduce((sum, p) => sum + p.annualSpend, 0), fill: ABC_COLORS.A },
      { name: 'Class B', value: classifiedParts.filter(p => p.class === 'B').reduce((sum, p) => sum + p.annualSpend, 0), fill: ABC_COLORS.B },
      { name: 'Class C', value: classifiedParts.filter(p => p.class === 'C').reduce((sum, p) => sum + p.annualSpend, 0), fill: ABC_COLORS.C },
    ];

    return { spendByClass };
  }, [partsWithSpend]);


  const cumulativeSpendValue = useMemo(() => {
    return partsWithSpend.reduce((sum, p) => sum + p.annualSpend, 0);
  }, [partsWithSpend]);


  const cumulativeVolume = useMemo(() => {
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
                        type="number"
                        value={part.price}
                        onChange={(e) => handlePartInputChange(part.id, 'price', e.target.value)}
                        className="h-8 text-xs pl-5 text-right"
                        placeholder="0.00"
                        step="0.01"
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
                <p className="font-medium">{formatCurrency(cumulativeSpendValue)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Volume:</p>
                <p className="font-medium">{formatNumber(cumulativeVolume)}</p>
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
                ABC - % Total Spend
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                   <span className="text-xs text-muted-foreground cursor-default flex items-center">Spend breakdown by ABC class <Info className="ml-1 h-3 w-3" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    ABC analysis classifies parts based on spend:
                    Class A: Top 80% of spend.
                    Class B: Next 15% of spend.
                    Class C: Bottom 5% of spend.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="pt-0">
              {abcClassificationData.spendByClass.length === 0 || partsWithSpend.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No data for ABC spend analysis.</p>
              ) : (
                <ChartContainer config={abcChartConfig} className="min-h-[180px] w-full aspect-square">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel formatter={(value, name, props) => <div className="text-xs"><span className="font-medium" style={{color: props.payload?.fill}}>{props.payload?.name}</span>: {formatCurrency(value as number)}</div>} />}
                      />
                      <Pie
                        data={abcClassificationData.spendByClass}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (percent as number) * 100 > 3 ? (
                            <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[8px]">
                              {`${name} (${((percent as number) * 100).toFixed(0)}%)`}
                            </text>
                          ) : null;
                        }}
                      >
                        {abcClassificationData.spendByClass.map((entry) => (
                          <Cell key={`cell-abc-spend-${entry.name}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend content={({ payload }) => (
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-2 text-[10px]">
                          {payload?.map((entry) => (
                            <div key={`item-abc-spend-${entry.value}`} className="flex items-center">
                              <span style={{ backgroundColor: entry.color }} className="inline-block w-2 h-2 rounded-full mr-1"></span>
                              {entry.value} ({formatCurrency(entry.payload?.payload?.value as number || 0)})
                            </div>
                          ))}
                        </div>
                      )} />
                    </PieChart>
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

