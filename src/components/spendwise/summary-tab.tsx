
"use client";

import type { Supplier, Part, PartSupplierAssociation } from '@/types/spendwise';
import type { SpendDataPoint, ABCPieChartDataItem } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, Building, Info, TrendingUp, PieChart as PieChartIcon, BarChart2, Users, Link2, PackageCheck, Blocks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart as RechartsPieChart, Pie, Cell, Legend as RechartsLegend, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltipComponent } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useMemo } from 'react';

interface SummaryTabProps {
  suppliers: Supplier[];
  parts: Part[];
  partSupplierAssociations: PartSupplierAssociation[];
  spendByCategoryData: SpendDataPoint[];
  abcSummaryPieData: ABCPieChartDataItem[];
}

const PIE_COLORS_CATEGORIES = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const barChartConfig = (label: string, colorVar: string) => ({
  dataKey: {
    label: label,
    color: `hsl(var(--${colorVar}))`,
  },
} satisfies import("@/components/ui/chart").ChartConfig);


export default function SummaryTab({ 
  suppliers, 
  parts, 
  partSupplierAssociations, 
  spendByCategoryData,
  abcSummaryPieData
}: SummaryTabProps) {

  const formatCurrency = (value: number) => {
    if (value === undefined || value === null) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  const supplierCountByCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    suppliers.forEach(supplier => {
      counts[supplier.country] = (counts[supplier.country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 countries
  }, [suppliers]);

  const partsBySupplierCountDistribution = useMemo(() => {
    const supplierCountsPerPart: Record<string, number> = {};
    parts.forEach(part => {
      supplierCountsPerPart[part.id] = 0;
    });
    partSupplierAssociations.forEach(assoc => {
      if (supplierCountsPerPart[assoc.partId] !== undefined) {
        supplierCountsPerPart[assoc.partId]++;
      }
    });

    const distribution: Record<number, number> = {};
    Object.values(supplierCountsPerPart).forEach(count => {
      distribution[count] = (distribution[count] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([numSuppliers, partCount]) => ({
        name: `${numSuppliers} Supplier${parseInt(numSuppliers) !== 1 ? 's' : ''}`, // X-axis label
        count: partCount // Y-axis value
      }))
      .sort((a,b) => parseInt(a.name) - parseInt(b.name));
  }, [parts, partSupplierAssociations]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: ABC Parts Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <PackageCheck className="mr-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">ABC Parts Classification</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="ml-1 h-5 w-5"><Info className="h-3 w-3" /></Button></TooltipTrigger>
                <TooltipContent><p className="text-xs">Distribution of parts by A, B, C spend classification (Count of Parts).</p></TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {abcSummaryPieData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No ABC classification data available.</p>
            ) : (
              <ChartContainer config={{}} className="min-h-[200px] w-full aspect-square">
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <RechartsTooltipComponent
                      formatter={(value, name) => [`${formatNumber(value as number)} parts`, name]}
                    />
                    <Pie data={abcSummaryPieData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + 5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (percent as number) * 100 > 3 ? (
                          <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-medium">
                            {`${name} (${((percent as number) * 100).toFixed(0)}%)`}
                          </text>
                        ) : null;
                      }}
                    >
                      {abcSummaryPieData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsLegend wrapperStyle={{fontSize: "11px", marginTop: "10px"}} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Suppliers by Country */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Suppliers by Country (Top 5)</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="ml-1 h-5 w-5"><Info className="h-3 w-3" /></Button></TooltipTrigger>
                <TooltipContent><p className="text-xs">Number of suppliers in the top 5 countries.</p></TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {supplierCountByCountry.length === 0 ? (
               <p className="text-xs text-muted-foreground text-center py-8">No supplier country data available.</p>
            ) : (
              <ChartContainer config={barChartConfig('Suppliers', 'chart-2')} className="min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsBarChart data={supplierCountByCountry} layout="vertical" margin={{left: 10, right: 30}}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="count" tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
                    <Bar dataKey="count" fill="var(--color-dataKey)" radius={3} barSize={15} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Sourcing Complexity */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Link2 className="mr-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Part Sourcing Distribution</CardTitle>
               <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="ml-1 h-5 w-5"><Info className="h-3 w-3" /></Button></TooltipTrigger>
                <TooltipContent><p className="text-xs">Number of parts by how many suppliers they are sourced from.</p></TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {partsBySupplierCountDistribution.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No part sourcing data available.</p>
            ): (
              <ChartContainer config={barChartConfig('Parts', 'chart-3')} className="min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                   <RechartsBarChart data={partsBySupplierCountDistribution} margin={{top: 5, right: 20, left: 10, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={formatNumber} tick={{ fontSize: 10 }} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatNumber(value as number)} />} />
                    <Bar dataKey="count" fill="var(--color-dataKey)" radius={3} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Spend by Category */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Blocks className="mr-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Spend by Category</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="ml-1 h-5 w-5"><Info className="h-3 w-3" /></Button></TooltipTrigger>
                <TooltipContent><p className="text-xs">Total spend distribution across part categories.</p></TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            {spendByCategoryData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No category spend data available.</p>
            ) : (
              <ChartContainer config={{}} className="min-h-[200px] w-full aspect-square">
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <RechartsTooltipComponent
                      formatter={(value, name) => [formatCurrency(value as number), name]}
                    />
                    <Pie data={spendByCategoryData} dataKey="spend" nameKey="name" cx="50%" cy="50%" outerRadius={70} labelLine={false}
                     label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + 5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (percent as number) * 100 > 3 ? (
                          <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-medium">
                             {`${name} (${((percent as number) * 100).toFixed(0)}%)`}
                          </text>
                        ) : null;
                      }}
                    >
                      {spendByCategoryData.map((entry, index) => (
                        <Cell key={`cell-cat-${index}`} fill={PIE_COLORS_CATEGORIES[index % PIE_COLORS_CATEGORIES.length]} />
                      ))}
                    </Pie>
                     <RechartsLegend wrapperStyle={{fontSize: "11px", marginTop: "10px"}} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Globe className="mr-2 h-6 w-6" />
            <CardTitle className="text-lg">Supplier Geo-Distribution</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">Global supplier locations and summary list. Dynamic map requires further integration.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-3">Supplier Locations Map</h3>
            <div className="border rounded-lg overflow-hidden shadow-sm bg-muted/30 flex flex-col items-center justify-center p-4 aspect-[16/7]">
              <Globe className="h-24 w-24 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground font-medium">
                Dynamic Map Placeholder
              </p>
              <p className="text-xs text-muted-foreground mt-2 text-center max-w-md">
                To display suppliers on an interactive map (e.g., Google Maps), you would typically need to:
              </p>
              <ul className="text-xs text-muted-foreground list-disc list-inside mt-1 text-center">
                <li>Install a mapping library (e.g., <code>@react-google-maps/api</code>).</li>
                <li>Obtain and configure a Google Maps API key.</li>
                <li>Implement geocoding to convert addresses to coordinates if not provided by AI.</li>
              </ul>
               <p className="text-xs text-muted-foreground mt-2 text-center">
                This functionality requires additional setup beyond current capabilities.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" /> Supplier List & Locations
            </h3>
            {suppliers.length === 0 ? (
              <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md min-h-[100px] flex flex-col items-center justify-center">
                  <Info className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No suppliers available.</p>
                  <p className="text-xs">Generate or add suppliers to see their locations listed here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Supplier Name</TableHead>
                      <TableHead className="text-xs">Address</TableHead>
                      <TableHead className="text-xs">Country</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-mono text-xs">{supplier.supplierId}</TableCell>
                        <TableCell className="font-medium text-xs">{supplier.name}</TableCell>
                        <TableCell className="text-xs">{supplier.address}</TableCell>
                        <TableCell className="text-xs">{supplier.country}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{supplier.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
