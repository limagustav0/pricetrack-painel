"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LineChart, BarChart, SearchX } from 'lucide-react';

interface AnalyticsTabProps {
  products: Product[];
  loading: boolean;
}

interface MarketplaceStats {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  productCount: number;
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
      
      const prices = productList.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

      acc[marketplace] = {
        minPrice,
        maxPrice,
        avgPrice,
        productCount: productList.length,
      };

      return acc;
    }, {} as Record<string, MarketplaceStats>);

  }, [products]);

  if (loading) {
    return (
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
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {Object.entries(statsByMarketplace).map(([marketplace, stats]) => (
        <Card key={marketplace} className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-6 w-6 text-primary" />
              {marketplace}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{stats.productCount} {stats.productCount > 1 ? 'produtos' : 'produto'} encontrado(s)</p>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Preço Mínimo</span>
                <Badge variant="secondary" className="text-base">{formatCurrency(stats.minPrice)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Preço Máximo</span>
                <Badge variant="secondary" className="text-base">{formatCurrency(stats.maxPrice)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Preço Médio</span>
                <Badge variant="default" className="text-base">{formatCurrency(stats.avgPrice)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}