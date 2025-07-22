"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Scale, ShoppingCart } from 'lucide-react';

interface EpocaAnalysisProps {
  allProducts: Product[];
  loading: boolean;
}

const TARGET_MARKETPLACE = "Época Cosméticos";

export function EpocaAnalysis({ allProducts, loading }: EpocaAnalysisProps) {
  const analysis = useMemo(() => {
    const epocaProducts = allProducts.filter(p => p.marketplace === TARGET_MARKETPLACE);
    const otherProducts = allProducts.filter(p => p.marketplace !== TARGET_MARKETPLACE);

    const epocaEans = new Set(epocaProducts.map(p => p.ean));
    const otherEans = new Set(otherProducts.map(p => p.ean));

    const sharedEans = [...epocaEans].filter(ean => otherEans.has(ean));

    let cheaperCount = 0;
    let moreExpensiveCount = 0;

    sharedEans.forEach(ean => {
      const epocaProduct = epocaProducts.find(p => p.ean === ean)!;
      const otherCompetitors = otherProducts.filter(p => p.ean === ean);
      const minPriceElsewhere = Math.min(...otherCompetitors.map(p => p.price));

      if (epocaProduct.price < minPriceElsewhere) {
        cheaperCount++;
      } else if (epocaProduct.price > minPriceElsewhere) {
        moreExpensiveCount++;
      }
    });

    return {
      totalSharedProducts: sharedEans.length,
      cheaperCount,
      moreExpensiveCount,
      totalEpocaProducts: epocaProducts.length,
    };
  }, [allProducts]);

  if (loading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produtos na Época</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produtos em Concorrentes</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mais Barato na Época</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mais Caro na Época</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (analysis.totalEpocaProducts === 0) {
    return null; // Don't show analysis if no Epoca products are found
  }

  return (
    <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Análise Comparativa: {TARGET_MARKETPLACE}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos na Época</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analysis.totalEpocaProducts}</div>
                <p className="text-xs text-muted-foreground">Total de produtos encontrados</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                Produtos em Concorrentes
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{analysis.totalSharedProducts}</div>
            <p className="text-xs text-muted-foreground">
                Produtos que também estão em outros marketplaces
            </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Barato na Época</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{analysis.cheaperCount}</div>
            <p className="text-xs text-muted-foreground">
                Produtos com menor preço vs concorrência
            </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Caro na Época</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{analysis.moreExpensiveCount}</div>
            <p className="text-xs text-muted-foreground">
                Produtos com maior preço vs concorrência
            </p>
            </CardContent>
        </Card>
        </div>
    </div>
  );
}
