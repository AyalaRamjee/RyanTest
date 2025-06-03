
import type { Part } from '@/types/spendwise';
import type { SpendDataPoint, CountDataPoint } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, ListOrdered, Package, DollarSign, BarChart3, PlusCircle, TrendingUp as TrendingUpIcon, PieChartIcon, Hash, Info } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UpdatePartsTabProps {
  parts: Part[];
  onAddPart: () => void;
  spendByPartData: SpendDataPoint[];
  spendByCategoryData: SpendDataPoint[];
  partsPerCategoryData: CountDataPoint[];
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

export default function UpdatePartsTab({ parts, onAddPart, spendByPartData, spendByCategoryData, partsPerCategoryData }: UpdatePartsTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          <CardTitle className="text-lg">Update Parts</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 h-5 w-5">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">Manage individual parts, their pricing, and estimated annual demand. View spend analysis by part and category.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-8 gap-6 text-xs">
        <div className="md:col-span-5 space-y-4">
          <section>
            <h3 className="text-base font-semibold mb-2">Part Management</h3>
            <div className="mb-3 flex justify-end">
              <Button onClick={onAddPart} size="sm" className="text-xs">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add New Part
              </Button>
            </div>
            {parts.length === 0 ? (
              <p className="text-muted-foreground text-center py-3">No parts available. Generate or add some parts.</p>
            ) : (
              <ScrollArea className="max-h-80 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] text-xs"><ListOrdered className="inline-block mr-1 h-3.5 w-3.5" />Part #</TableHead>
                      <TableHead className="text-xs"><Package className="inline-block mr-1 h-3.5 w-3.5" />Part Name</TableHead>
                      <TableHead className="text-right text-xs"><DollarSign className="inline-block mr-1 h-3.5 w-3.5" />Price</TableHead>
                      <TableHead className="text-right text-xs"><BarChart3 className="inline-block mr-1 h-3.5 w-3.5" />Demand</TableHead>
                      <TableHead className="text-center w-[80px] text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">{part.partNumber}</TableCell>
                        <TableCell>{part.name}</TableCell>
                        <TableCell className="text-right">${part.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{part.annualDemand.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Edit Part" onClick={() => console.log('Edit part:', part.id)}>
                            <FileEdit className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </section>
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
