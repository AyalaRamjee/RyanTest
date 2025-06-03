
import type { Part } from '@/types/spendwise';
import type { SpendDataPoint } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, ListOrdered, Package, DollarSign, BarChart3, PlusCircle, TrendingUp as TrendingUpIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';

interface UpdatePartsTabProps {
  parts: Part[];
  onAddPart: () => void;
  spendData: SpendDataPoint[];
}

const chartConfig = {
  spend: {
    label: "Spend ($)",
    color: "hsl(var(--chart-1))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function UpdatePartsTab({ parts, onAddPart, spendData }: UpdatePartsTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Package className="mr-2 h-6 w-6" /> Update Parts</CardTitle>
        <CardDescription>Manage individual parts, their pricing, and estimated annual demand. View spend analysis by part.</CardDescription>
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
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUpIcon className="mr-2 h-5 w-5" />
                Spend by Part
              </CardTitle>
              <CardDescription>Top 10 parts by calculated spend (Price x Demand).</CardDescription>
            </CardHeader>
            <CardContent>
              {spendData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No spend data to display. Add parts with price and demand.</p>
              ) : (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-video">
                  <BarChart accessibilityLayer data={spendData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="spend" tickFormatter={formatCurrency} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot"  formatter={(value) => formatCurrency(value as number)} />}
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
