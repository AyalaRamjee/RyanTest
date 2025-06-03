
import type { Part, PartCategoryMapping } from '@/types/spendwise';
import type { SpendDataPoint, CountDataPoint } from '@/app/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FolderTree, List, TrendingUp as TrendingUpIcon, PieChartIcon, Hash } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';

interface UploadPartCategoryTabProps {
  parts: Part[];
  partCategoryMappings: PartCategoryMapping[];
  spendByCategoryData: SpendDataPoint[];
  partsPerCategoryData: CountDataPoint[];
}

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


export default function UploadPartCategoryTab({ parts, partCategoryMappings, spendByCategoryData, partsPerCategoryData }: UploadPartCategoryTabProps) {
  const getPartName = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    return part ? part.name : 'Unknown Part';
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg"><FolderTree className="mr-2 h-5 w-5" /> Part Category Management</CardTitle>
        <CardDescription>Upload part category data or view AI-generated mappings. Analyze spend and part distribution by category.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-8 gap-6 text-xs">
        <div className="md:col-span-5 space-y-4">
          <section>
            <h3 className="text-base font-semibold mb-1.5">Upload Data</h3>
            <div className="space-y-1.5 p-3 border rounded-md shadow-sm bg-muted/20">
              <label htmlFor="partCategoryFile" className="text-xs font-medium">Choose file for Part-Category mapping</label>
              <Input id="partCategoryFile" type="file" className="text-xs file:text-xs file:font-medium file:text-primary file:bg-primary-foreground hover:file:bg-accent/20 h-9"/>
              <p className="text-[10px] text-muted-foreground">Supported formats: .csv, .xlsx. Ensure columns for Part ID/Number and Category Name.</p>
              <Button size="sm" className="w-full sm:w-auto mt-1.5 text-xs">
                <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Upload File
              </Button>
            </div>
          </section>
          
          <section className="mt-4 pt-4 border-t">
            <h3 className="text-base font-semibold mb-1.5 flex items-center">
              <List className="mr-1.5 h-4 w-4" /> Current Part Category Mappings
            </h3>
            {partCategoryMappings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No category mappings available. Generate data or upload a file.</p>
            ) : (
              <div className="overflow-x-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Part Name (Part #)</TableHead>
                      <TableHead className="text-xs">Category Name</TableHead>
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

        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <PieChartIcon className="mr-1.5 h-4 w-4" />
                $ Spend by Category
              </CardTitle>
              <CardDescription className="text-xs">Total spend aggregated by part category.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {spendByCategoryData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No spend data to display.</p>
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
              <CardDescription className="text-xs">Number of unique parts in each category.</CardDescription>
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
                      content={<ChartTooltipContent indicator="dot" formatter={(value) => formatNumber(value as number)} />}
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
