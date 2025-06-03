
"use client";

import type { Part } from '@/types/spendwise';
import type { SpendDataPoint, CountDataPoint } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileEdit, Package, DollarSign, BarChart3, PlusCircle, TrendingUp as TrendingUpIcon, PieChartIcon, Hash, Info, UploadCloud, Trash2, ListOrdered } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useState } from 'react';

interface UpdatePartsTabProps {
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>; // For direct updates
  onAddPart: () => void;
  spendByPartData: SpendDataPoint[];
  spendByCategoryData: SpendDataPoint[];
  partsPerCategoryData: CountDataPoint[];
  onOpenUploadDialog: () => void;
}

const spendByPartChartConfig = {
  spend: {
    label: "Spend ($)",
    color: "hsl(var(--chart-1))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

const spendByCategoryChartConfig = {
  spend: { label: "Spend ($)" },
} satisfies import("@/components/ui/chart").ChartConfig;

const partsPerCategoryChartConfig = {
  count: {
    label: "# Parts",
    color: "hsl(var(--chart-4))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function UpdatePartsTab({ 
  parts, 
  setParts,
  onAddPart, 
  spendByPartData, 
  spendByCategoryData, 
  partsPerCategoryData, 
  onOpenUploadDialog 
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
          let numericValue = value;
          if (field === 'price' || field === 'annualDemand') {
            numericValue = parseFloat(value as string);
            if (isNaN(numericValue)) numericValue = 0;
          } else if (field === 'profitMargin' || field === 'freightOhdCost') {
            numericValue = parseFloat(value as string) / 100;
             if (isNaN(numericValue)) numericValue = 0;
          }
          return { ...p, [field]: numericValue };
        }
        return p;
      })
    );
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          <CardTitle className="text-lg">1A - Add/Update/Select Product</CardTitle>
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
            <Button onClick={onOpenUploadDialog} size="sm" variant="outline" className="text-xs">
              <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Upload Parts CSV
            </Button>
            <Button onClick={onAddPart} size="sm" className="text-xs">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add New Part
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-8 gap-6 text-xs">
        <div className="md:col-span-5 space-y-3">
          {/* Header Row for Labels */}
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
            <div className="w-10"> {/* Spacer for radio */} </div>
            <div className="w-24 flex-shrink-0">Part #</div>
            <div className="flex-1 min-w-[120px]">Product Name</div>
            <div className="w-24 text-right">Base Cost</div>
            <div className="w-28 text-right">Annual Volume</div>
            <div className="w-24 text-right">Profit Margin</div>
            <div className="w-28 text-right">Freight & OHD</div>
            <div className="w-10"> {/* Spacer for delete */} </div>
          </div>

          {parts.length === 0 ? (
            <p className="text-muted-foreground text-center py-3">No parts available. Generate, add, or upload some parts.</p>
          ) : (
            <ScrollArea className="max-h-[calc(80vh-280px)] min-h-[200px]"> {/* Adjust max-h as needed */}
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
                      placeholder="Product Name"
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
                        type="number"
                        value={part.annualDemand}
                        onChange={(e) => handlePartInputChange(part.id, 'annualDemand', e.target.value)}
                        className="h-8 text-xs w-28 text-right"
                        placeholder="0"
                        step="1"
                      />
                    <div className="relative w-24">
                      <Input
                        type="number"
                        value={parseFloat((part.profitMargin * 100).toFixed(2))}
                        onChange={(e) => handlePartInputChange(part.id, 'profitMargin', e.target.value)}
                        className="h-8 text-xs pr-5 text-right"
                        placeholder="0"
                        step="0.01"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    </div>
                     <div className="relative w-28">
                      <Input
                        type="number"
                        value={parseFloat((part.freightOhdCost * 100).toFixed(2))}
                        onChange={(e) => handlePartInputChange(part.id, 'freightOhdCost', e.target.value)}
                        className="h-8 text-xs pr-5 text-right"
                        placeholder="0"
                        step="0.01"
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
        </div>
        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <TrendingUpIcon className="mr-1.5 h-4 w-4" />
                Spend by Part
              </CardTitle>
               <Tooltip>
                <TooltipTrigger asChild>
                   <span className="text-xs text-muted-foreground cursor-default flex items-center">Top 10 parts by spend <Info className="ml-1 h-3 w-3" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Top 10 parts by calculated spend (Price x Demand).</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="pt-0">
              {spendByPartData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No spend data to display.</p>
              ) : (
                <ChartContainer config={spendByPartChartConfig} className="min-h-[180px] w-full aspect-video">
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
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <PieChartIcon className="mr-1.5 h-4 w-4" />
                $ Spend by Category
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                   <span className="text-xs text-muted-foreground cursor-default flex items-center">Spend distribution <Info className="ml-1 h-3 w-3" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Distribution of spend across part categories.</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="pt-0">
              {spendByCategoryData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No category spend data.</p>
              ) : (
                <ChartContainer config={spendByCategoryChartConfig} className="min-h-[180px] w-full aspect-square">
                  <PieChart accessibilityLayer>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel formatter={(value, name, props) => <div className="text-xs"><span className="font-medium">{props.payload?.name}</span>: {formatCurrency(value as number)}</div>} />}
                    />
                    <Pie data={spendByCategoryData} dataKey="spend" nameKey="name" cx="50%" cy="50%" outerRadius={60} labelLine={false} 
                         label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (percent as number) * 100 > 5 ? (
                              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[8px] fill-primary-foreground">
                                {`${((percent as number) * 100).toFixed(0)}%`}
                              </text>
                            ) : null;
                          }}
                    >
                      {spendByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                     <Legend content={({ payload }) => (
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-2 text-[10px]">
                          {payload?.map((entry, index) => (
                            <div key={`item-${index}`} className="flex items-center">
                              <span style={{ backgroundColor: entry.color }} className="inline-block w-2 h-2 rounded-full mr-1"></span>
                              {entry.value} ({formatCurrency(entry.payload?.payload?.spend as number || 0)})
                            </div>
                          ))}
                        </div>
                      )} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Hash className="mr-1.5 h-4 w-4" />
                # Parts by Category
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                   <span className="text-xs text-muted-foreground cursor-default flex items-center">Part count distribution <Info className="ml-1 h-3 w-3" /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Number of unique parts in each category.</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="pt-0">
              {partsPerCategoryData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No parts per category data.</p>
              ) : (
                <ChartContainer config={partsPerCategoryChartConfig} className="min-h-[180px] w-full aspect-video">
                  <BarChart accessibilityLayer data={partsPerCategoryData} layout="vertical" margin={{ left: 5, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="count" tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} tick={{ fontSize: 10 }} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" formatter={(value) => formatNumber(value as number)}/>}
                    />
                    <Bar dataKey="count" fill="var(--color-count)" radius={3} barSize={10}/>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
