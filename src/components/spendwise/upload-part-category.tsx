
import type { Part, PartCategoryMapping } from '@/types/spendwise';
import type { SpendDataPoint } from '@/app/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FolderTree, List, TrendingUp as TrendingUpIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';

interface UploadPartCategoryTabProps {
  parts: Part[];
  partCategoryMappings: PartCategoryMapping[];
  spendData: SpendDataPoint[];
}

const chartConfig = {
  spend: {
    label: "Spend ($)",
    color: "hsl(var(--chart-2))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

export default function UploadPartCategoryTab({ parts, partCategoryMappings, spendData }: UploadPartCategoryTabProps) {
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
        <CardTitle className="flex items-center"><FolderTree className="mr-2 h-6 w-6" /> Part Category Management</CardTitle>
        <CardDescription>Upload part category data or view AI-generated mappings. Analyze spend by category.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">Upload Data</h3>
            <div className="space-y-2 p-4 border rounded-md shadow-sm bg-muted/20">
              <label htmlFor="partCategoryFile" className="text-sm font-medium">Choose file for Part-Category mapping</label>
              <Input id="partCategoryFile" type="file" className="file:text-sm file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-accent/20"/>
              <p className="text-xs text-muted-foreground">Supported formats: .csv, .xlsx. Ensure columns for Part ID/Number and Category Name.</p>
              <Button className="w-full sm:w-auto mt-2">
                <UploadCloud className="mr-2 h-4 w-4" /> Upload File
              </Button>
            </div>
          </section>
          
          <section className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <List className="mr-2 h-5 w-5" /> Current Part Category Mappings
            </h3>
            {partCategoryMappings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No category mappings available. Generate data or upload a file.</p>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name (Part #)</TableHead>
                      <TableHead>Category Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partCategoryMappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell>{getPartName(mapping.partId)} ({parts.find(p=>p.id === mapping.partId)?.partNumber})</TableCell>
                        <TableCell>{mapping.categoryName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUpIcon className="mr-2 h-5 w-5" />
                Spend by Category
              </CardTitle>
              <CardDescription>Total spend aggregated by part category.</CardDescription>
            </CardHeader>
            <CardContent>
              {spendData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No spend data to display.</p>
              ) : (
                 <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-video">
                  <BarChart accessibilityLayer data={spendData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="spend" tickFormatter={formatCurrency} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100}  />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(value as number)} />}
                    />
                    <Bar dataKey="spend" fill="var(--color-spend)" radius={4} />
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
