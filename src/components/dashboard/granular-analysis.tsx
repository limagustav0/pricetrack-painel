"use client";

import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

interface GranularAnalysisProps {
  allProducts: Product[];
  loading: boolean;
}

export function GranularAnalysis({ allProducts, loading }: GranularAnalysisProps) {
  if (loading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Detalhada</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Em breve, uma análise mais detalhada será exibida aqui.</p>
        <p className="text-sm text-muted-foreground mt-2">
            Produtos selecionados para análise: {allProducts.length}
        </p>
      </CardContent>
    </Card>
  );
}
