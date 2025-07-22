"use client";

import type { Product } from '@/types';
import { useMemo } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PriceComparisonTableProps {
  allProducts: Product[];
  loading: boolean;
}

interface ComparisonData {
  ean: string;
  name: string;
  sku: string;
  brand: string | null;
  image: string;
  epocaProduct: Product;
  competitorWinner: Product;
  priceDifference: number;
  winner: 'epoca' | 'competitor' | 'tie';
  lastScraped: string;
}

const TARGET_MARKETPLACE = "Epoca Cosmeticos";

export function PriceComparisonTable({ allProducts, loading }: PriceComparisonTableProps) {
  const comparisonData = useMemo(() => {
    const epocaProducts = allProducts.filter(p => p.marketplace === TARGET_MARKETPLACE);
    const competitorProducts = allProducts.filter(p => p.marketplace !== TARGET_MARKETPLACE);

    const epocaEanMap = new Map<string, Product>();
    epocaProducts.forEach(p => {
        if (!epocaEanMap.has(p.ean)) {
            epocaEanMap.set(p.ean, p);
        }
    });

    const competitorEanMap = new Map<string, Product[]>();
    competitorProducts.forEach(p => {
        if (!competitorEanMap.has(p.ean)) {
            competitorEanMap.set(p.ean, []);
        }
        competitorEanMap.get(p.ean)!.push(p);
    });

    const data: ComparisonData[] = [];

    epocaEanMap.forEach((epocaProduct, ean) => {
        const competitors = competitorEanMap.get(ean);
        if (!competitors || competitors.length === 0) {
            return;
        }

        const competitorWinner = competitors.reduce((min, p) => p.price < min.price ? p : min, competitors[0]);
        const priceDifference = Math.abs(epocaProduct.price - competitorWinner.price);
        
        let winner: 'epoca' | 'competitor' | 'tie' = 'tie';
        if (epocaProduct.price < competitorWinner.price) {
            winner = 'epoca';
        } else if (epocaProduct.price > competitorWinner.price) {
            winner = 'competitor';
        }

        data.push({
            ean,
            name: epocaProduct.name,
            sku: epocaProduct.id,
            brand: epocaProduct.brand,
            image: epocaProduct.image,
            epocaProduct,
            competitorWinner,
            priceDifference,
            winner,
            lastScraped: epocaProduct.updated_at
        });
    });

    // Sort by largest price difference where Epoca is losing
    return data.sort((a, b) => {
        if (a.winner === 'competitor' && b.winner !== 'competitor') return -1;
        if (a.winner !== 'competitor' && b.winner === 'competitor') return 1;
        return b.priceDifference - a.priceDifference;
    });

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
                        <div key={i} className="flex items-center gap-4 p-2">
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
                             <Skeleton className="h-3 w-1/3" />
                           </div>
                           <Skeleton className="h-6 w-1/4" />
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
        <CardTitle>Análise de Competitividade de Preços</CardTitle>
        <CardDescription>
          Comparação de preços entre {TARGET_MARKETPLACE} e o concorrente mais barato para cada produto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Img</TableHead>
              <TableHead>Produto (SKU/Marca)</TableHead>
              <TableHead>Vendedor Ofertante (Mktplace)</TableHead>
              <TableHead>Preços</TableHead>
              <TableHead>Vencedor (Dif.)</TableHead>
              <TableHead className="text-right">Raspagem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisonData.map((item) => {
                const imageSrc = item.image && item.image.startsWith('http') ? item.image : 'https://placehold.co/100x100.png';
                return (
                    <TableRow key={item.ean}>
                    <TableCell>
                        <Image
                            src={imageSrc}
                            alt={item.name}
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
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                        <div className="text-xs text-muted-foreground">{item.brand}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{item.competitorWinner.seller}</div>
                        <div className="text-sm text-muted-foreground">{item.competitorWinner.marketplace}</div>
                    </TableCell>
                    <TableCell>
                       <div>
                            <span className="font-semibold">Vencedor: </span>
                            {formatCurrency(item.competitorWinner.price)}
                        </div>
                        <div>
                            <span className="font-semibold">Seu: </span>
                            {formatCurrency(item.epocaProduct.price)}
                        </div>
                    </TableCell>
                    <TableCell>
                         {item.winner === 'competitor' && (
                             <Badge variant="destructive">Perdendo</Badge>
                         )}
                         {item.winner === 'epoca' && (
                             <Badge variant="secondary" className="bg-green-100 text-green-800">Ganhando</Badge>
                         )}
                         {item.winner === 'tie' && (
                             <Badge variant="outline">Empate</Badge>
                         )}
                         <div className="text-sm text-muted-foreground mt-1">
                             {formatCurrency(item.priceDifference)}
                         </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                        {item.lastScraped ? format(new Date(item.lastScraped), 'dd/MM/yy HH:mm', { locale: ptBR }) : '-'}
                    </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
         {comparisonData.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                Nenhum produto para comparar com os filtros atuais.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
