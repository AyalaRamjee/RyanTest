
import type { Part } from '@/types/spendwise';
import type { SpendDataPoint, CountDataPoint } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, ListOrdered, Package, DollarSign, BarChart3, PlusCircle, TrendingUp as TrendingUpIcon, PieChartIcon, Hash } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';

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
  // Colors for Pie chart slices will be handled by PIE_COLORS array
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
        <CardTitle className="flex items-center"><Package className="mr-2 h-6 w-6" /> Update Parts</CardTitle>
        <CardDescription>Manage individual parts, their pricing, and estimated annual demand. View spend analysis by part and category.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">Part Management</h3>
            <div className="mb-4 flex justify-end">
              <Button onClick={onAddPart}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Part
              </Button>
            </div>
            {parts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No parts available. Generate or add some parts.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]"><ListOrdered className="inline-block mr-1 h-4 w-4" />Part #</TableHead>
                      <TableHead><Package className="inline-block mr-1 h-4 w-4" />Part Name</TableHead>
                      <TableHead className="text-right"><DollarSign className="inline-block mr-1 h-4 w-4" />Price</TableHead>
                      <TableHead className="text-right"><BarChart3 className="inline-block mr-1 h-4 w-4" />Demand</TableHead>
                      <TableHead className="text-center w-[100px]">Actions</TableHead>
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
                          <Button variant="outline" size="icon" aria-label="Edit Part" onClick={() => console.log('Edit part:', part.id)}>
                            <FileEdit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUpIcon className="mr-2 h-5 w-5" />
                Spend by Part
              </CardTitle>
              <CardDescription>Top 10 parts by calculated spend (Price x Demand).</CardDescription>
            </CardHeader>
            <CardContent>
              {spendByPartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No spend data to display. Add parts with price and demand.</p>
              ) : (
                <ChartContainer config={spendByPartChartConfig} className="min-h-[200px] w-full aspect-video">
                  <BarChart accessibilityLayer data={spendByPartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="spend" tickFormatter={formatCurrency} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5" />
                $ Spend by Category
              </CardTitle>
              <CardDescription>Distribution of spend across part categories.</CardDescription>
            </CardHeader>
            <CardContent>
              {spendByCategoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No category spend data.</p>
              ) : (
                <ChartContainer config={spendByCategoryChartConfig} className="min-h-[200px] w-full aspect-square">
                  <PieChart accessibilityLayer>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel formatter={(value, name, props) => <div><span className="font-medium">{props.payload?.name}</span>: {formatCurrency(value as number)}</div>} />}
                    />
                    <Pie data={spendByCategoryData} dataKey="spend" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} 
                         label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (percent as number) * 100 > 5 ? (
                              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs fill-primary-foreground">
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
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-xs">
                          {payload?.map((entry, index) => (
                            <div key={`item-${index}`} className="flex items-center">
                              <span style={{ backgroundColor: entry.color }} className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"></span>
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Hash className="mr-2 h-5 w-5" />
                # Parts by Category
              </CardTitle>
              <CardDescription>Number of unique parts in each category.</CardDescription>
            </CardHeader>
            <CardContent>
              {partsPerCategoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No parts per category data.</p>
              ) : (
                <ChartContainer config={partsPerCategoryChartConfig} className="min-h-[200px] w-full aspect-video">
                  <BarChart accessibilityLayer data={partsPerCategoryData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="count" tickFormatter={formatNumber} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" formatter={(value) => formatNumber(value as number)}/>}
                    />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
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
