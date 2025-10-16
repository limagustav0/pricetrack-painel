
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, isValidImageUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { ExternalLink, Trophy, Users } from 'lucide-react';
import { Input } from '../ui/input';

interface BuyboxAnalysisTableProps {
  allProducts: Product[];
  loading: boolean;
}

interface BuyboxProduct {
    ean: string;
    name: string;
    brand: string | null;
    image: string;
    competitors: number;
    winner: {
        seller: string;
        marketplace: string;
        price: number;
        url: string | null;
    };
}


export function BuyboxAnalysisTable({ allProducts, loading }: BuyboxAnalysisTableProps) {
  const [filter, setFilter] = useState('');
  
  const buyboxData = useMemo(() => {
    const productsByEan = allProducts.reduce((acc, product) => {
      if (!product.ean) return acc;

      if (!acc[product.ean]) {
        acc[product.ean] = [];
      }
      acc[product.ean].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    const result: BuyboxProduct[] = [];

    for (const ean in productsByEan) {
        const products = productsByEan[ean];
        if (products.length === 0) continue;

        const sortedByPrice = [...products].sort((a,b) => a.price - b.price);
        const winner = sortedByPrice[0];

        const firstProduct = products[0];
        const imageProduct = products.find(p => isValidImageUrl(p.image)) || firstProduct;

        result.push({
            ean: ean,
            name: firstProduct.name,
            brand: firstProduct.brand,
            image: imageProduct.image || 'https://placehold.co/100x100.png',
            competitors: products.length,
            winner: {
                seller: winner.seller,
                marketplace: winner.marketplace,
                price: winner.price,
                url: winner.url
            }
        });
    }

    return result.sort((a,b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  const filteredData = useMemo(() => {
      if (!filter) return buyboxData;
      return buyboxData.filter(p => 
        p.ean.toLowerCase().includes(filter.toLowerCase()) ||
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(filter.toLowerCase())) ||
        p.winner.seller.toLowerCase().includes(filter.toLowerCase()) ||
        p.winner.marketplace.toLowerCase().includes(filter.toLowerCase())
      );
  }, [buyboxData, filter])


  if (loading) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="flex-1">
                 <Skeleton className="h-10 w-full md:w-1/3 mb-4" />
                <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-2 border-b">
                           <Skeleton className="h-16 w-16" />
                           <div className="flex-1 space-y-2">
                             <Skeleton className="h-4 w-3/4" />
                             <Skeleton className="h-3 w-1/2" />
                           </div>
                           <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                            </div>
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
        <CardTitle>Análise de Buybox</CardTitle>
        <CardDescription>
          Identifique o vendedor com o menor preço (vencedor do Buybox) para cada produto em todos os marketplaces.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="mb-4">
            <Input
                placeholder="Filtrar por Produto, EAN, Vendedor..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
            />
        </div>
        <div className="relative overflow-auto border rounded-lg flex-1">
            <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                <TableHead className="min-w-[300px]">Produto</TableHead>
                <TableHead>Vencedor do Buybox</TableHead>
                <TableHead className="text-right">Menor Preço</TableHead>
                <TableHead className="text-center">Concorrentes</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredData.map((product) => {
                    const imageSrc = isValidImageUrl(product.image) ? product.image : 'https://placehold.co/100x100.png';
                    
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
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">EAN: {product.ean}</p>
                                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className='flex items-center gap-2'>
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <p className="font-semibold">{product.winner.seller}</p>
                                        <Badge variant="outline">{product.winner.marketplace}</Badge>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <p className="font-bold text-lg text-primary">{formatCurrency(product.winner.price)}</p>
                                    <Button asChild variant="ghost" size="icon" className="h-6 w-6" disabled={!product.winner.url}>
                                        <a href={product.winner.url!} target="_blank" rel="noopener noreferrer" aria-label="Ver produto">
                                            <ExternalLink className="h-4 w-4"/>
                                        </a>
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                     <Users className="h-4 w-4 text-muted-foreground" />
                                     <span className='font-medium'>{product.competitors}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                })}
                 {filteredData.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={4}>
                             <div className="text-center py-16 text-muted-foreground">
                                Nenhum produto encontrado com os filtros aplicados.
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

    