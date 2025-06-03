
import type { Part, PartCommodityMapping } from '@/types/spendwise';
import type { SpendDataPoint } from '@/app/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, TrendingUp, List } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';

interface UploadPartCommodityTabProps {
  parts: Part[];
  partCommodityMappings: PartCommodityMapping[];
  spendData: SpendDataPoint[];
}

const chartConfig = {
  spend: {
    label: "Spend ($)",
    color: "hsl(var(--chart-3))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

export default function UploadPartCommodityTab({ parts, partCommodityMappings, spendData }: UploadPartCommodityTabProps) {
   const getPartName = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    return part ? part.name : 'Unknown Part';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><TrendingUp className="mr-2 h-5 w-5" /> Part Commodity Management</CardTitle>
        <CardDescription>Upload part commodity index data or view AI-generated mappings. Analyze spend by commodity.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-8 gap-6 text-xs">
        <div className="md:col-span-5 space-y-4">
          <section>
            <h3 className="text-base font-semibold mb-1.5">Upload Data</h3>
            <div className="space-y-1.5 p-3 border rounded-md shadow-sm bg-muted/20">
              <label htmlFor="partCommodityFile" className="text-xs font-medium">Choose file for Part-Commodity mapping</label>
              <Input id="partCommodityFile" type="file" className="text-xs file:text-xs file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-accent/20 h-9"/>
              <p className="text-[10px] text-muted-foreground">Supported formats: .csv, .xlsx. Ensure columns for Part ID/Number and Commodity Name.</p>
              <Button size="sm" className="w-full sm:w-auto mt-1.5 text-xs">
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Upload File
              </Button>
            </div>
          </section>

          <section className="mt-4 pt-4 border-t">
            <h3 className="text-base font-semibold mb-1.5 flex items-center">
              <List className="mr-1.5 h-4 w-4" /> Current Part Commodity Mappings
            </h3>
            {partCommodityMappings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No commodity mappings available. Generate data or upload a file.</p>
            ) : (
              <div className="overflow-x-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Part Name (Part #)</TableHead>
                      <TableHead className="text-xs">Commodity Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partCommodityMappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell>{getPartName(mapping.partId)} ({parts.find(p=>p.id === mapping.partId)?.partNumber})</TableCell>
                        <TableCell>{mapping.commodityName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>

        <div className="md:col-span-3 space-y-4">
           <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                Spend by Commodity
              </CardTitle>
              <CardDescription className="text-xs">Total spend aggregated by part commodity.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {spendData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No spend data to display.</p>
              ) : (
                 <ChartContainer config={chartConfig} className="min-h-[180px] w-full aspect-video">
                  <BarChart accessibilityLayer data={spendData} layout="vertical" margin={{ left: 5, right: 30, top: 5, bottom: 5 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="spend" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} tick={{ fontSize: 10 }} />
                     <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(value as number)} />}
                    />
                    <Bar dataKey="spend" fill="var(--color-spend)" radius={3} barSize={10}/>
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
