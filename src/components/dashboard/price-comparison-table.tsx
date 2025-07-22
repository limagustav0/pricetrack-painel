"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PriceComparisonTableProps {
  allProducts: Product[];
  loading: boolean;
}

interface GroupedProduct {
    ean: string;
    name: string;
    brand: string | null;
    image: string;
    offers: Record<string, { price: number; seller: string; }>;
}


export function PriceComparisonTable({ allProducts, loading }: PriceComparisonTableProps) {
  const { groupedProducts, uniqueMarketplaces } = useMemo(() => {
    const marketplaces = [...new Set(allProducts.map(p => p.marketplace).filter(Boolean))].sort();

    const productsByEan = allProducts.reduce((acc, product) => {
      if (!product.ean) return acc;
      
      if (!acc[product.ean]) {
        acc[product.ean] = {
            ean: product.ean,
            name: product.name,
            brand: product.brand,
            image: product.image || 'https://placehold.co/100x100.png',
            offers: {},
        };
      }

      const existingOffer = acc[product.ean].offers[product.marketplace];
      // Keep the lowest price for a given marketplace
      if (!existingOffer || product.price < existingOffer.price) {
          acc[product.ean].offers[product.marketplace] = {
              price: product.price,
              seller: product.seller,
          };
      }

      return acc;
    }, {} as Record<string, GroupedProduct>);

    return { 
        groupedProducts: Object.values(productsByEan), 
        uniqueMarketplaces: marketplaces 
    };
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
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-2">
                           <Skeleton className="h-16 w-16" />
                           <div className="flex-1 space-y-2">
                             <Skeleton className="h-4 w-3/4" />
                             <Skeleton className="h-3 w-1/2" />
                           </div>
                           {[...Array(3)].map((_, j) => (
                             <div key={j} className="flex-1 space-y-2">
                               <Skeleton className="h-4 w-1/2" />
                               <Skeleton className="h-3 w-1/3" />
                             </div>
                           ))}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo de Preços por Marketplace</CardTitle>
        <CardDescription>
          Visualize os preços de cada produto lado a lado nos diferentes marketplaces.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[300px]">Produto (EAN/Marca)</TableHead>
              {uniqueMarketplaces.map(mp => <TableHead key={mp} className="text-right">{mp}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedProducts.map((product) => {
                const imageSrc = product.image && product.image.startsWith('http') ? product.image : 'https://placehold.co/100x100.png';
                const prices = Object.values(product.offers).map(o => o.price);
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                
                return (
                    <TableRow key={product.ean}>
                        <TableCell>
                            <div className="flex items-center gap-4">
                                <Image
                                    src={imageSrc}
                                    alt={product.name}
                                    width={64}
                                    height={64}
                                    className="rounded-md object-cover border"
                                    data-ai-hint="cosmetics product"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = 'https://placehold.co/100x100.png';
                                    }}
                                />
                                <div className="flex-1">
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-muted-foreground">EAN: {product.ean}</div>
                                    <div className="text-xs text-muted-foreground">{product.brand}</div>
                                </div>
                            </div>
                        </TableCell>
                        {uniqueMarketplaces.map(mp => {
                            const offer = product.offers[mp];
                            const isMinPrice = offer && offer.price === minPrice;
                            return (
                                <TableCell key={mp} className="text-right align-top">
                                    {offer ? (
                                        <div>
                                            <p className={`font-bold ${isMinPrice ? 'text-primary' : ''}`}>
                                                {formatCurrency(offer.price)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{offer.seller}</p>
                                            {isMinPrice && prices.length > 1 && <Badge variant="secondary" className="mt-1">Melhor Preço</Badge>}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                            )
                        })}
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
         {groupedProducts.length === 0 && !loading && (
            <div className="text-center py-16 text-muted-foreground">
                Nenhum produto encontrado para comparar.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
