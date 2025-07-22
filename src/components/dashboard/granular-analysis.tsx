"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';

interface GranularAnalysisProps {
  allProducts: Product[];
  loading: boolean;
}

interface SellerAnalysis {
    name: string;
    productCount: number;
    marketplaceCount: number;
}

const TARGET_SELLER = "Epoca Cosmeticos";

export function GranularAnalysis({ allProducts, loading }: GranularAnalysisProps) {
    const sellerAnalysis = useMemo(() => {
        if (!allProducts || allProducts.length === 0) {
            return [];
        }

        const sellers = allProducts.reduce((acc, product) => {
            const sellerName = product.seller || 'Desconhecido';
            if (!acc[sellerName]) {
                acc[sellerName] = {
                    products: new Set<string>(),
                    marketplaces: new Set<string>(),
                };
            }
            acc[sellerName].products.add(product.ean || product.id);
            if(product.marketplace) {
               acc[sellerName].marketplaces.add(product.marketplace);
            }
            return acc;
        }, {} as Record<string, { products: Set<string>, marketplaces: Set<string> }>);

        const analysisResult: SellerAnalysis[] = Object.entries(sellers).map(([name, data]) => ({
            name,
            productCount: data.products.size,
            marketplaceCount: data.marketplaces.size,
        }));

        // Sort to prioritize the target seller, then by product count
        analysisResult.sort((a, b) => {
            if (a.name === TARGET_SELLER) return -1;
            if (b.name === TARGET_SELLER) return 1;
            return b.productCount - a.productCount;
        });

        return analysisResult;
    }, [allProducts]);


  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-1/4" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
  }

  if (sellerAnalysis.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Análise de Vendedores</CardTitle>
                <CardDescription>
                    Nenhum dado de vendedor disponível para os filtros selecionados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-8">
                    Ajuste os filtros para ver a análise.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Vendedores</CardTitle>
        <CardDescription>
            Uma visão detalhada dos vendedores, priorizando <strong>{TARGET_SELLER}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Vendedor (Seller)</TableHead>
                    <TableHead className="text-center">Marketplaces</TableHead>
                    <TableHead className="text-right">Produtos Distintos</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sellerAnalysis.map(seller => (
                    <TableRow key={seller.name} className={seller.name === TARGET_SELLER ? "bg-muted/50" : ""}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-secondary rounded-full">
                                    <Building className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="font-medium">{seller.name}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline">{seller.marketplaceCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">{seller.productCount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
