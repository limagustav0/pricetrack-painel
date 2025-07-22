
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from './searchable-select';
import { TrendingUp } from 'lucide-react';

interface PriceComparisonTableProps {
  allProducts: Product[];
  loading: boolean;
}

interface GroupedProduct {
    ean: string;
    name: string;
    brand: string | null;
    image: string;
    offers: Record<string, { price: number; seller: string; change_price: number | null; }>;
}


export function PriceComparisonTable({ allProducts, loading }: PriceComparisonTableProps) {
  const [selectedEans, setSelectedEans] = useState<string[]>([]);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);

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
              change_price: product.change_price,
          };
      }

      return acc;
    }, {} as Record<string, GroupedProduct>);

    return { 
        groupedProducts: Object.values(productsByEan), 
        uniqueMarketplaces: marketplaces 
    };
  }, [allProducts]);
  
  const productOptions = useMemo(() => {
    return groupedProducts.map(p => ({ value: p.ean, label: `${p.name} (${p.ean})` })).sort((a,b) => a.label.localeCompare(b.label));
  }, [groupedProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedEans.length === 0) return groupedProducts;
    return groupedProducts.filter(p => selectedEans.includes(p.ean));
  }, [groupedProducts, selectedEans]);

  const visibleMarketplaces = useMemo(() => {
    if (selectedMarketplaces.length === 0) return uniqueMarketplaces;
    return uniqueMarketplaces.filter(m => selectedMarketplaces.includes(m));
  }, [uniqueMarketplaces, selectedMarketplaces]);

  if (loading) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="flex-1">
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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Comparativo de Preços por Marketplace</CardTitle>
        <CardDescription>
          Visualize os preços de cada produto lado a lado nos diferentes marketplaces.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 min-w-0">
                <SearchableSelect
                    placeholder="Filtrar por Produto..."
                    options={productOptions}
                    selectedValues={selectedEans}
                    onChange={(value) => setSelectedEans(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])}
                />
            </div>
            <div className="flex-1 min-w-0">
                <SearchableSelect
                    placeholder="Filtrar por Marketplace..."
                    options={uniqueMarketplaces.map(m => ({ value: m, label: m }))}
                    selectedValues={selectedMarketplaces}
                    onChange={(value) => setSelectedMarketplaces(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])}
                />
            </div>
        </div>

        <div className="relative overflow-auto border rounded-lg">
            <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                <TableHead className="min-w-[300px] whitespace-nowrap">Produto (EAN/Marca)</TableHead>
                {visibleMarketplaces.map(mp => <TableHead key={mp} className="text-right whitespace-nowrap">{mp}</TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map((product) => {
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
                            {visibleMarketplaces.map(mp => {
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
                                                {offer.change_price && offer.change_price > 0 && (
                                                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        {offer.change_price} alteraç{offer.change_price > 1 ? 'ões' : 'ão'}
                                                    </p>
                                                )}
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
                 {filteredProducts.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={visibleMarketplaces.length + 1}>
                             <div className="text-center py-16 text-muted-foreground">
                                Nenhum produto encontrado para comparar com os filtros aplicados.
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
