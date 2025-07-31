

"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight, Scale, ShoppingCart } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ComparativeAnalysisProps {
  allProducts: Product[];
  loading: boolean;
  selectedMarketplace: string;
}

export function ComparativeAnalysis({ allProducts, loading, selectedMarketplace }: ComparativeAnalysisProps) {
  const analysis = useMemo(() => {
    if (!selectedMarketplace) {
      return {
        totalMarketplaceProducts: 0,
        totalSharedProducts: 0,
        cheaperCount: 0,
        moreExpensiveCount: 0,
      };
    }

    const marketplaceProducts = allProducts.filter(p => p.marketplace === selectedMarketplace);
    const otherProducts = allProducts.filter(p => p.marketplace !== selectedMarketplace);

    const marketplaceEans = new Set(marketplaceProducts.map(p => p.ean));
    const otherEans = new Set(otherProducts.map(p => p.ean));

    const sharedEans = [...marketplaceEans].filter(ean => otherEans.has(ean));

    let cheaperCount = 0;
    let moreExpensiveCount = 0;

    sharedEans.forEach(ean => {
      const marketplaceProduct = marketplaceProducts.find(p => p.ean === ean)!;
      const otherCompetitors = otherProducts.filter(p => p.ean === ean);
      
      if(otherCompetitors.length > 0) {
        const minPriceElsewhere = Math.min(...otherCompetitors.map(p => p.price));

        if (marketplaceProduct.price < minPriceElsewhere) {
          cheaperCount++;
        } else if (marketplaceProduct.price > minPriceElsewhere) {
          moreExpensiveCount++;
        }
      }
    });

    return {
      totalMarketplaceProducts: marketplaceProducts.length,
      totalSharedProducts: sharedEans.length,
      cheaperCount,
      moreExpensiveCount,
    };
  }, [allProducts, selectedMarketplace]);

  if (loading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produtos no Marketplace</CardTitle>
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
                    <CardTitle className="text-sm font-medium">Mais Barato</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mais Caro</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!selectedMarketplace || analysis.totalMarketplaceProducts === 0) {
    return null;
  }

  return (
    <div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos em <Badge variant="secondary">{selectedMarketplace}</Badge></CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analysis.totalMarketplaceProducts}</div>
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
            <CardTitle className="text-sm font-medium">Mais Barato no Marketplace</CardTitle>
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
            <CardTitle className="text-sm font-medium">Mais Caro no Marketplace</CardTitle>
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
