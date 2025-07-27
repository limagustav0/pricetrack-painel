
"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, isValidImageUrl } from '@/lib/utils';
import { ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface EpocaPriceAnalysisProps {
  allProducts: Product[];
  loading: boolean;
}

const TOP_N = 10;

function ProductTable({ title, description, products, icon: Icon }: { title: string, description: string, products: Product[], icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Icon className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-auto max-h-96">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px]">Produto</TableHead>
                                <TableHead>Marketplace</TableHead>
                                <TableHead className="text-right">Preço</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(product => {
                                const imageSrc = isValidImageUrl(product.image) ? product.image : 'https://placehold.co/100x100.png';
                                return (
                                    <TableRow key={`${product.id}-${product.marketplace}`}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={imageSrc}
                                                    alt={product.name}
                                                    width={48}
                                                    height={48}
                                                    className="rounded-md object-cover border"
                                                    data-ai-hint="cosmetics product"
                                                />
                                                <div>
                                                    <p className="font-medium line-clamp-2">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{product.marketplace}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(product.price)}</TableCell>
                                        <TableCell>
                                             <Button asChild variant="ghost" size="icon" disabled={!product.url}>
                                                <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label="Ver produto">
                                                    <ExternalLink className="h-4 w-4"/>
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                             {products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Nenhum produto encontrado.
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

function LoadingSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg p-2">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                             <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-md" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-5 w-20" />
                            </div>
                        ))}
                    </div>
                 </div>
            </CardContent>
        </Card>
    )
}

export function EpocaPriceAnalysis({ allProducts, loading }: EpocaPriceAnalysisProps) {
    const { cheapestProducts, mostExpensiveProducts } = useMemo(() => {
        if (!allProducts || allProducts.length === 0) {
            return { cheapestProducts: [], mostExpensiveProducts: [] };
        }

        // Create a copy to avoid mutating the original array
        const sortedProducts = [...allProducts].sort((a, b) => a.price - b.price);

        // Remove duplicates by EAN, keeping the one with the lowest price (already sorted)
        const uniqueProducts = Array.from(new Map(sortedProducts.map(p => [p.ean, p])).values());

        const cheapest = uniqueProducts.slice(0, TOP_N);
        const mostExpensive = uniqueProducts.slice(-TOP_N).sort((a,b) => b.price - a.price);

        return {
            cheapestProducts: cheapest,
            mostExpensiveProducts: mostExpensive,
        };
    }, [allProducts]);

    if(loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                <LoadingSkeleton />
                <LoadingSkeleton />
            </div>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <ProductTable
                title={`Top ${TOP_N} Mais Baratos (Todos os Marketplaces)`}
                description="Os produtos com os menores preços encontrados no geral."
                products={cheapestProducts}
                icon={TrendingDown}
            />
            <ProductTable
                title={`Top ${TOP_N} Mais Caros (Todos os Marketplaces)`}
                description="Os produtos com os maiores preços encontrados no geral."
                products={mostExpensiveProducts}
                icon={TrendingUp}
            />
        </div>
    );
}
