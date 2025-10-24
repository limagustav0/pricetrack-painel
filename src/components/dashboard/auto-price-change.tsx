
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, isValidImageUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from './searchable-select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Bot, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AutoPriceChangeProps {
  allProducts: Product[];
  loading: boolean;
}

export function AutoPriceChange({ allProducts, loading }: AutoPriceChangeProps) {
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [activeSeller, setActiveSeller] = useState<string | null>(null);
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
  
  const sellerProducts = useMemo(() => {
    if (!activeSeller) return [];
    
    // Get all products for the selected seller
    const productsOfSeller = allProducts.filter(p => p.key_loja === activeSeller);
    
    // Group by EAN and get the best (lowest) price offered by the seller for that EAN
    const uniqueProductsByEan = productsOfSeller.reduce((acc, product) => {
        if (!acc[product.ean] || product.price < acc[product.ean].price) {
            acc[product.ean] = product;
        }
        return acc;
    }, {} as Record<string, Product>);

    return Object.values(uniqueProductsByEan).sort((a,b) => a.name.localeCompare(b.name));
  }, [allProducts, activeSeller]);

  useEffect(() => {
    // Initialize pricing data when seller products change
    const initialData = sellerProducts.reduce((acc, product) => {
      acc[product.ean] = product.preco_pricing;
      return acc;
    }, {} as Record<string, number | null>);
    setPricingData(initialData);
  }, [sellerProducts]);

  const handleFilterChange = (value: string) => {
    const newSelection = selectedSellers.includes(value)
      ? selectedSellers.filter(v => v !== value)
      : [...selectedSellers, value];
    
    setSelectedSellers(newSelection);

    // If the active seller is removed from the selection, deactivate it
    if (activeSeller && !newSelection.includes(activeSeller)) {
        setActiveSeller(null);
    }
    // If there's only one selected seller, make it active automatically
    if (newSelection.length === 1) {
        setActiveSeller(newSelection[0]);
    }
  };
  
  const handlePriceChange = (ean: string, value: string) => {
    const newPrice = value === '' ? null : parseFloat(value);
    setPricingData(prev => ({ ...prev, [ean]: newPrice }));
  };

  const handleUpdatePrice = async (ean: string, key_loja: string) => {
    const newPrice = pricingData[ean];

    if (newPrice === undefined) return;

    try {
      const response = await fetch('/api/products/update_pricing/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ean: ean,
          key_loja: key_loja,
          preco_pricing: newPrice,
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
       // Revert optimistic update
       const originalProduct = sellerProducts.find(p => p.ean === ean);
       if (originalProduct) {
           setPricingData(prev => ({...prev, [ean]: originalProduct.preco_pricing}));
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="border rounded-lg p-4 mt-6">
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

  const selectedSellerOptions = sellerOptions.filter(s => selectedSellers.includes(s.value));

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot />
                    Configuração de Preço Automático (Beta)
                </CardTitle>
                <CardDescription>
                   Filtre um ou mais vendedores e depois selecione um "Vendedor Ativo" para configurar seus produtos.
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
                     <div>
                        <Label>Vendedor Ativo</Label>
                         <Select onValueChange={setActiveSeller} value={activeSeller || ""} disabled={selectedSellers.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um vendedor para editar" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedSellerOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>

        {activeSeller ? (
             <Card>
                <CardHeader>
                    <CardTitle>Produtos de {sellerOptions.find(s => s.value === activeSeller)?.label}</CardTitle>
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
                                    <TableHead>Marketplace (Referência)</TableHead>
                                    <TableHead className="text-right">Preço Atual</TableHead>
                                    <TableHead className="text-right w-[200px]">Preço Mínimo (Pricing)</TableHead>
                                    <TableHead className="text-right w-[200px]">Preço para Buybox</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sellerProducts.map((product) => {
                                    const competitors = allProducts.filter(p => p.ean === product.ean && p.key_loja !== activeSeller);
                                    const bestCompetitorPrice = competitors.length > 0 ? Math.min(...competitors.map(p => p.price)) : Infinity;
                                    const pricingPrice = pricingData[product.ean];
                                    
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

                                    return (
                                        <TableRow key={product.ean}>
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
                                                <Badge variant="outline">{product.marketplace}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(product.price)}</TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    placeholder="Não definido"
                                                    value={pricingData[product.ean] ?? ''}
                                                    onChange={(e) => handlePriceChange(product.ean, e.target.value)}
                                                    onBlur={() => handleUpdatePrice(product.ean, product.key_loja!)}
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
                                {sellerProducts.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhum produto encontrado para este vendedor.
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
                <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
                <p className="font-semibold">Nenhum Vendedor Ativo</p>
                <p className="text-sm">Por favor, selecione um vendedor para começar a edição.</p>
            </div>
        )}
    </div>
  )
}

    