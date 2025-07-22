"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PriceComparisonTableProps {
  allProducts: Product[];
  loading: boolean;
}

export function PriceComparisonTable({ allProducts, loading }: PriceComparisonTableProps) {

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
        <CardTitle>Listagem de Produtos</CardTitle>
        <CardDescription>
          Todos os produtos encontrados na base de dados, sem filtros aplicados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Img</TableHead>
              <TableHead>Produto (EAN/Marca)</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Marketplace</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Raspagem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allProducts.map((product) => {
                const imageSrc = product.image && product.image.startsWith('http') ? product.image : 'https://placehold.co/100x100.png';
                return (
                    <TableRow key={`${product.id}-${product.seller}`}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">EAN: {product.ean}</div>
                        <div className="text-xs text-muted-foreground">{product.brand}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{product.seller}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{product.marketplace}</div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                       {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                        {product.updated_at ? format(new Date(product.updated_at), 'dd/MM/yy HH:mm', { locale: ptBR }) : '-'}
                    </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
         {allProducts.length === 0 && !loading && (
            <div className="text-center py-16 text-muted-foreground">
                Nenhum produto encontrado na base de dados.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
