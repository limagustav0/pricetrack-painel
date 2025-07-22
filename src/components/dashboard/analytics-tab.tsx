"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, SearchX, TrendingDown, TrendingUp, ExternalLink } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface AnalyticsTabProps {
  products: Product[];
  loading: boolean;
}

interface MarketplaceStats {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  productCount: number;
  productWithMinPrice?: Product;
  productWithMaxPrice?: Product;
}

export function AnalyticsTab({ products, loading }: AnalyticsTabProps) {
  const statsByMarketplace = useMemo(() => {
    const groupedByMarketplace = products.reduce((acc, product) => {
      const key = product.marketplace || 'Desconhecido';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    return Object.entries(groupedByMarketplace).reduce((acc, [marketplace, productList]) => {
      if (productList.length === 0) return acc;
      
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let productWithMinPrice: Product | undefined = undefined;
      let productWithMaxPrice: Product | undefined = undefined;
      let sum = 0;

      for (const product of productList) {
          sum += product.price;
          if(product.price < minPrice) {
              minPrice = product.price;
              productWithMinPrice = product;
          }
          if(product.price > maxPrice) {
              maxPrice = product.price;
              productWithMaxPrice = product;
          }
      }
      
      const avgPrice = sum / productList.length;

      acc[marketplace] = {
        minPrice,
        maxPrice,
        avgPrice,
        productCount: productList.length,
        productWithMinPrice,
        productWithMaxPrice
      };

      return acc;
    }, {} as Record<string, MarketplaceStats>);

  }, [products]);

  const chartData = useMemo(() => {
    return Object.entries(statsByMarketplace).map(([marketplace, stats]) => ({
      name: marketplace,
      "Preço Médio": parseFloat(stats.avgPrice.toFixed(2)),
    })).sort((a, b) => a['Preço Médio'] - b['Preço Médio']);
  }, [statsByMarketplace]);

  const chartConfig = {
      "Preço Médio": {
        label: "Preço Médio",
        color: "hsl(var(--primary))",
      },
  };

  if (loading) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-1/4 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-3/4" />
                    </CardContent>
                </Card>
                ))}
            </div>
      </div>
    );
  }

  if (Object.keys(statsByMarketplace).length === 0) {
    return (
      <Card className="text-center py-16 px-4 shadow-none border-dashed">
        <div className="flex justify-center mb-4">
          <div className="bg-secondary p-4 rounded-full">
            <SearchX className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-xl font-semibold">Nenhum dado para análise</h3>
        <p className="text-muted-foreground mt-2">Tente ajustar ou limpar seus filtros para ver os resultados.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
        {chartData.length > 1 && (
            <Card>
                <CardHeader>
                    <CardTitle>Comparativo de Preço Médio por Marketplace</CardTitle>
                    <CardDescription>Visualização do preço médio dos produtos filtrados em cada marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <RechartsBarChart 
                            data={chartData} 
                            margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                            layout="vertical"
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" dataKey="Preço Médio" tickFormatter={(value) => formatCurrency(value as number)} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent 
                                    formatter={(value) => formatCurrency(value as number)} 
                                    labelClassName="font-bold"
                                />}
                            />
                            <Bar dataKey="Preço Médio" fill="var(--color-Preço Médio)" radius={4} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        )}

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {Object.entries(statsByMarketplace).map(([marketplace, stats]) => (
                <Card key={marketplace} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-6 w-6 text-primary" />
                    {marketplace}
                    </CardTitle>
                    <CardDescription>{stats.productCount} {stats.productCount > 1 ? 'produtos' : 'produto'} encontrado(s)</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Preço Médio</span>
                        <Badge variant="default" className="text-base font-semibold">{formatCurrency(stats.avgPrice)}</Badge>
                    </div>
                    
                    <div className="border rounded-lg p-3 space-y-2 bg-secondary/50">
                        <div className="flex items-start justify-between gap-2">
                           <div>
                             <p className="text-sm font-semibold flex items-center gap-1.5"><TrendingDown className="h-4 w-4 text-green-500"/> Menor Preço</p>
                             <p className="text-sm text-muted-foreground truncate" title={stats.productWithMinPrice?.name}>{stats.productWithMinPrice?.name}</p>
                           </div>
                           <Badge variant="secondary" className="text-base shrink-0">{formatCurrency(stats.minPrice)}</Badge>
                        </div>
                        {stats.productWithMinPrice && (
                            <Button asChild size="sm" variant="outline" className="w-full">
                                <a href={stats.productWithMinPrice.url} target="_blank" rel="noopener noreferrer">Ver Produto <ExternalLink className="ml-2 h-3 w-3" /></a>
                            </Button>
                        )}
                    </div>
                    
                    <div className="border rounded-lg p-3 space-y-2 bg-secondary/50">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-red-500"/> Maior Preço</p>
                                <p className="text-sm text-muted-foreground truncate" title={stats.productWithMaxPrice?.name}>{stats.productWithMaxPrice?.name}</p>
                            </div>
                           <Badge variant="secondary" className="text-base shrink-0">{formatCurrency(stats.maxPrice)}</Badge>
                        </div>
                        {stats.productWithMaxPrice && (
                             <Button asChild size="sm" variant="outline" className="w-full">
                                <a href={stats.productWithMaxPrice.url} target="_blank" rel="noopener noreferrer">Ver Produto <ExternalLink className="ml-2 h-3 w-3" /></a>
                            </Button>
                        )}
                    </div>

                </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
