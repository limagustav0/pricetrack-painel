
"use client";

import { useMemo } from 'react';
import type { PriceChange } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, DollarSign, ListFilter, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PriceChangeAnalysisProps {
  priceChanges: PriceChange[];
  loading: boolean;
}

export function PriceChangeAnalysis({ priceChanges, loading }: PriceChangeAnalysisProps) {
  const analysis = useMemo(() => {
    const totalChanges = priceChanges.length;
    const priceIncreases = priceChanges.filter(p => p.preco_novo > p.preco_antigo).length;
    const priceDecreases = priceChanges.filter(p => p.preco_novo < p.preco_antigo).length;
    const uniqueProductsChanged = new Set(priceChanges.map(p => p.ean)).size;

    return {
      totalChanges,
      priceIncreases,
      priceDecreases,
      uniqueProductsChanged,
    };
  }, [priceChanges]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg p-2">
                    <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                             <div key={i} className="flex items-center gap-3 p-2">
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alterações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.totalChanges}</div>
            <p className="text-xs text-muted-foreground">Mudanças de preço registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Afetados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.uniqueProductsChanged}</div>
            <p className="text-xs text-muted-foreground">Produtos únicos com preço alterado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aumentos de Preço</CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.priceIncreases}</div>
            <p className="text-xs text-muted-foreground">Produtos que ficaram mais caros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reduções de Preço</CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.priceDecreases}</div>
            <p className="text-xs text-muted-foreground">Produtos que ficaram mais baratos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mudanças de Preço</CardTitle>
          <CardDescription>
            Lista detalhada de todas as alterações de preço capturadas pelo sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto max-h-[calc(100vh-25rem)]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="min-w-[250px]">Produto</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Preço Antigo</TableHead>
                  <TableHead className="text-right">Preço Novo</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead>Data da Mudança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceChanges
                  .filter(c => c.data_mudanca_timestamp) // Ensure timestamp is valid before sorting
                  .sort((a, b) => b.data_mudanca_timestamp! - a.data_mudanca_timestamp!)
                  .map((change) => {
                    const difference = change.preco_novo - change.preco_antigo;
                    const isIncrease = difference > 0;
                    const isDecrease = difference < 0;
                    return (
                        <TableRow key={change.id}>
                            <TableCell>
                                <div>
                                    <p className="font-medium line-clamp-2">{change.descricao}</p>
                                    <p className="text-xs text-muted-foreground">EAN: {change.ean}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{change.marketplace}</Badge>
                            </TableCell>
                            <TableCell>{change.loja}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                {formatCurrency(change.preco_antigo)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                                {formatCurrency(change.preco_novo)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${isIncrease ? 'text-red-500' : isDecrease ? 'text-green-500' : 'text-muted-foreground'}`}>
                                <div className="flex items-center justify-end gap-1">
                                    {isIncrease && <ArrowUp className="h-3 w-3" />}
                                    {isDecrease && <ArrowDown className="h-3 w-3" />}
                                    {formatCurrency(difference)}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {change.data_mudanca_timestamp ? format(new Date(change.data_mudanca_timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                            </TableCell>
                        </TableRow>
                    )
                })}
                {priceChanges.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                        Nenhuma mudança de preço registrada.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
