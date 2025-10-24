
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, isValidImageUrl, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from './searchable-select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { toast } from '@/hooks/use-toast';
import { Bot, HelpCircle, SearchX } from 'lucide-react';

interface AutoPriceChangeProps {
  allProducts: Product[];
  loading: boolean;
}

export function AutoPriceChange({ allProducts, loading }: AutoPriceChangeProps) {
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [pricingData, setPricingData] = useState<Record<string, number | null>>({});

  const sellerOptions = useMemo(() => {
    const sellers = new Map<string, string>();
    allProducts.forEach(p => {
        if (p.key_loja && !sellers.has(p.key_loja)) {
            sellers.set(p.key_loja, p.seller);
        }
    });
    return Array.from(sellers.entries()).map(([key_loja, sellerName]) => ({ value: key_loja, label: sellerName })).sort((a,b) => a.label.localeCompare(b.label));
  }, [allProducts]);
  
  const productsOfSelectedSellers = useMemo(() => {
    if (selectedSellers.length === 0) return [];
    
    const products = allProducts.filter(p => selectedSellers.includes(p.key_loja!));
    
    // Use a unique key combining ean, seller, and marketplace
    const uniqueProducts = products.reduce((acc, product) => {
        const key = `${product.ean}-${product.key_loja}-${product.marketplace}`;
        if (!acc[key] || product.price < acc[key].price) {
            acc[key] = product;
        }
        return acc;
    }, {} as Record<string, Product>);

    return Object.values(uniqueProducts).sort((a,b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        if (a.seller < b.seller) return -1;
        if (a.seller > b.seller) return 1;
        return 0;
    });
  }, [allProducts, selectedSellers]);

  useEffect(() => {
    const initialData = productsOfSelectedSellers.reduce((acc, product) => {
      const key = `${product.ean}-${product.key_loja}-${product.marketplace}`;
      acc[key] = product.preco_pricing;
      return acc;
    }, {} as Record<string, number | null>);
    setPricingData(initialData);
  }, [productsOfSelectedSellers]);

  const handleFilterChange = (value: string) => {
    setSelectedSellers(prev => 
        prev.includes(value) 
            ? prev.filter(v => v !== value) 
            : [...prev, value]
    );
  };
  
  const handlePriceChange = (ean: string, key_loja: string, marketplace: string, value: string) => {
    const newPrice = value === '' ? null : parseFloat(value);
    const key = `${ean}-${key_loja}-${marketplace}`;
    setPricingData(prev => ({ ...prev, [key]: newPrice }));
  };

  const handleUpdatePrice = async (ean: string, key_loja: string, marketplace: string) => {
    const key = `${ean}-${key_loja}-${marketplace}`;
    const newPrice = pricingData[key];

    if (newPrice === undefined) return;

    try {
      const response = await fetch('/api/products/update_pricing/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ean: ean,
          key_loja: key_loja,
          preco_pricing: newPrice,
          marketplace: marketplace, // Pass marketplace if your API supports it
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha ao atualizar o preço. Status: ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: "Preço atualizado com sucesso!",
        description: `O preço mínimo para o EAN ${ean} foi definido como ${formatCurrency(newPrice!)}.`,
      });
      
    } catch (error) {
      console.error("Erro ao atualizar preço:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar o preço.",
        description: "Não foi possível salvar o novo preço mínimo. Tente novamente.",
      });
       const originalProduct = productsOfSelectedSellers.find(p => p.ean === ean && p.key_loja === key_loja && p.marketplace === marketplace);
       if (originalProduct) {
           setPricingData(prev => ({...prev, [key]: originalProduct.preco_pricing}));
       }
    }
  };

  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-10 w-full mb-6" />
                  <div className="border rounded-lg p-4">
                      {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center gap-4 py-2 border-b">
                              <Skeleton className="h-12 w-12" />
                              <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-3 w-1/2" />
                              </div>
                              <Skeleton className="h-10 w-24" />
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot />
                    Configuração de Preço Automático (Beta)
                </CardTitle>
                <CardDescription>
                   Filtre um ou mais vendedores para configurar os preços mínimos de seus produtos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Filtrar Vendedores</Label>
                        <SearchableSelect
                            placeholder="Selecione Vendedor(es)..."
                            options={sellerOptions}
                            selectedValues={selectedSellers}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {selectedSellers.length > 0 ? (
             <Card>
                <CardHeader>
                    <CardTitle>Configurar Preços Mínimos</CardTitle>
                    <CardDescription>
                        Defina o preço mínimo para cada produto. O sistema não permitirá que o preço do produto seja inferior a este valor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[300px]">Produto</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead>Marketplace</TableHead>
                                    <TableHead>Status Buybox</TableHead>
                                    <TableHead className="text-right">Preço Atual</TableHead>
                                    <TableHead className="text-right w-[200px]">Preço Mínimo (Pricing)</TableHead>
                                    <TableHead className="text-right w-[200px]">Preço para Buybox</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsOfSelectedSellers.map((product) => {
                                    const key = `${product.ean}-${product.key_loja}-${product.marketplace}`;
                                    const competitors = allProducts.filter(p => p.ean === product.ean && p.marketplace === product.marketplace && p.key_loja !== product.key_loja);
                                    const bestCompetitorPrice = competitors.length > 0 ? Math.min(...competitors.map(p => p.price)) : Infinity;
                                    const pricingPrice = pricingData[key];
                                    
                                    let buyboxPrice: number | null = null;
                                    let buyboxTooltip = "";

                                    if (pricingPrice !== null && pricingPrice !== undefined) {
                                        if (bestCompetitorPrice !== Infinity && pricingPrice > bestCompetitorPrice) {
                                            buyboxPrice = bestCompetitorPrice - 0.10;
                                            buyboxTooltip = `O preço mínimo (${formatCurrency(pricingPrice)}) é maior que o melhor preço do concorrente (${formatCurrency(bestCompetitorPrice)}). O preço sugerido é o do concorrente - R$ 0,10.`;
                                        } else {
                                            buyboxPrice = pricingPrice;
                                            buyboxTooltip = `O preço mínimo (${formatCurrency(pricingPrice)}) é competitivo. O preço sugerido é o próprio preço mínimo.`;
                                        }
                                    }

                                    const priceDifference = product.price - bestCompetitorPrice;

                                    return (
                                        <TableRow key={key}>
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <Image 
                                                        src={isValidImageUrl(product.image) ? product.image : 'https://placehold.co/100x100.png'} 
                                                        alt={product.name} 
                                                        width={64} 
                                                        height={64} 
                                                        className="rounded-md object-cover border"
                                                    />
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        <p className="text-sm text-muted-foreground">EAN: {product.ean}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{product.seller}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{product.marketplace}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {competitors.length > 0 ? (
                                                    <div className={cn(
                                                        "font-semibold",
                                                        priceDifference < 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {priceDifference < 0 ? `Ganhando por ${formatCurrency(Math.abs(priceDifference))}` : `Perdendo por ${formatCurrency(priceDifference)}`}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Ganhando (sozinho)</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(product.price)}</TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    placeholder="Não definido"
                                                    value={pricingData[key] ?? ''}
                                                    onChange={(e) => handlePriceChange(product.ean, product.key_loja!, product.marketplace, e.target.value)}
                                                    onBlur={() => handleUpdatePrice(product.ean, product.key_loja!, product.marketplace)}
                                                    className="text-right"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {buyboxPrice !== null ? (
                                                    <div className="custom-tooltip flex items-center justify-end gap-1">
                                                        <span className="font-bold text-primary">{formatCurrency(buyboxPrice)}</span>
                                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                        <div className="custom-tooltip-content text-left font-normal">
                                                            <p className="font-bold text-popover-foreground mb-2">Lógica do Preço de Buybox</p>
                                                            <p>{buyboxTooltip}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Defina o preço mínimo</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {productsOfSelectedSellers.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Nenhum produto encontrado para o(s) vendedor(es) selecionado(s).
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
             </Card>
        ) : (
             <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg flex flex-col items-center justify-center">
                <SearchX className="h-10 w-10 mx-auto mb-4" />
                <p className="font-semibold">Nenhum Vendedor Selecionado</p>
                <p className="text-sm">Por favor, selecione um ou mais vendedores para começar a edição.</p>
            </div>
        )}
    </div>
  )
}

    