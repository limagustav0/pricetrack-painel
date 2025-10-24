
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
import { useToast } from '@/hooks/use-toast';
import { Bot, HelpCircle, SearchX, Save } from 'lucide-react';
import { Button } from '../ui/button';

interface AutoPriceChangeProps {
  allProducts: Product[];
  loading: boolean;
}

interface BuyboxPriceData {
    price: number | null;
    calculationLog: string;
}

export function AutoPriceChange({ allProducts, loading }: AutoPriceChangeProps) {
  const { toast } = useToast();
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [pricingData, setPricingData] = useState<Record<string, number | null>>({});
  const [buyboxPriceData, setBuyboxPriceData] = useState<Record<string, BuyboxPriceData>>({});

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
    const initialPricingData = productsOfSelectedSellers.reduce((acc, product) => {
      const key = `${product.ean}-${product.key_loja}-${product.marketplace}`;
      acc[key] = product.preco_pricing;
      return acc;
    }, {} as Record<string, number | null>);
    setPricingData(initialPricingData);
  }, [productsOfSelectedSellers]);

  // Effect to calculate buybox prices whenever pricingData changes
  useEffect(() => {
      const newBuyboxData: Record<string, BuyboxPriceData> = {};
      productsOfSelectedSellers.forEach(product => {
          const key = `${product.ean}-${product.key_loja}-${product.marketplace}`;
          const minPrice = pricingData[key];
          
          if (minPrice === null || minPrice === undefined) {
              newBuyboxData[key] = { price: null, calculationLog: 'Defina o Preço Mínimo para calcular.' };
              return;
          }

          const competitors = allProducts.filter(p => p.ean === product.ean && p.marketplace === product.marketplace && p.key_loja !== product.key_loja);
          const bestCompetitorPrice = competitors.length > 0 ? Math.min(...competitors.map(p => p.price)) : Infinity;

          let calculatedPrice: number;
          let log: string;

          if (bestCompetitorPrice === Infinity) {
              calculatedPrice = minPrice;
              log = `Não há concorrentes. O preço para Buybox é o seu Preço Mínimo definido: ${formatCurrency(minPrice)}.`;
          } else {
              const suggestedPrice = bestCompetitorPrice - 0.10;
              if (suggestedPrice < minPrice) {
                  calculatedPrice = minPrice;
                  log = `O preço sugerido (${formatCurrency(suggestedPrice)}) é inferior ao seu Mínimo (${formatCurrency(minPrice)}). O Preço para Buybox será o seu Mínimo.`;
              } else {
                  calculatedPrice = suggestedPrice;
                  log = `O Preço para Buybox foi calculado como 10 centavos abaixo do melhor concorrente (${formatCurrency(bestCompetitorPrice)}).`;
              }
          }
          newBuyboxData[key] = { price: calculatedPrice, calculationLog: log };
      });
      setBuyboxPriceData(newBuyboxData);

  }, [pricingData, productsOfSelectedSellers, allProducts]);

  const handleFilterChange = (value: string) => {
    setSelectedSellers(prev => 
        prev.includes(value) 
            ? prev.filter(v => v !== value) 
            : [...prev, value]
    );
  };
  
  const handleMinPriceChange = (ean: string, key_loja: string, marketplace: string, value: string) => {
    const newMinPrice = value === '' ? null : parseFloat(value);
    const key = `${ean}-${key_loja}-${marketplace}`;
    setPricingData(prev => ({ ...prev, [key]: newMinPrice }));
  };

  const handleUpdatePrices = async (product: Product) => {
    const key = `${product.ean}-${product.key_loja}-${product.marketplace}`;
    const buyboxData = buyboxPriceData[key];
    const preco_pricing = pricingData[key];

    const updatePayload: { key_sku: string; preco_pricing?: number; preco_buybox?: number } = {
        key_sku: product.key_sku
    };

    if (preco_pricing !== null && preco_pricing !== undefined) {
        updatePayload.preco_pricing = preco_pricing;
    }

    if (buyboxData?.price !== null && buyboxData?.price !== undefined) {
        updatePayload.preco_buybox = buyboxData.price;
    }
    
    // Validate that at least one price is being sent
    if (updatePayload.preco_pricing === undefined && updatePayload.preco_buybox === undefined) {
         toast({
            variant: "destructive",
            title: "Nenhum preço para atualizar.",
            description: "Defina um Preço Mínimo para poder salvar.",
        });
        return;
    }

    const payload = [updatePayload];

    console.log('Payload enviado para a API:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch('/api/alterar-precos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Step 1: Get the raw response text to see what the server is actually sending.
      const responseText = await response.text();
      console.log("Resposta bruta da API:", responseText);


      if (!response.ok) {
        // If the response is not OK, we throw an error with the text we received.
        throw new Error(`A API retornou um erro. Status: ${response.status}. Resposta: ${responseText}`);
      }
      
      // Step 2: If the response was OK, now we can safely try to parse it as JSON.
      const responseData = JSON.parse(responseText);

      toast({
        title: "Preços salvos com sucesso!",
        description: `Os preços do produto ${product.name} foram atualizados.`,
      });
      
      // Update local state to reflect changes without a full refetch
      const productIndex = allProducts.findIndex(p => p.key_sku === product.key_sku);
      if(productIndex > -1) {
          if (updatePayload.preco_pricing !== undefined) {
            allProducts[productIndex].preco_pricing = updatePayload.preco_pricing;
          }
           if (updatePayload.preco_buybox !== undefined) {
            allProducts[productIndex].preco_buybox = updatePayload.preco_buybox;
           }
      }

    } catch (error) {
      console.error("Erro ao atualizar preços:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar preços.",
        description: `Detalhes: ${(error as Error).message}. Payload enviado: ${JSON.stringify(payload)}`,
      });
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
                    <CardTitle>Configurar Preços</CardTitle>
                    <CardDescription>
                        Defina o preço mínimo para cada produto. O sistema calculará o "Preço para Buybox" e não permitirá que ele seja inferior a este valor.
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
                                    <TableHead className="text-right w-[200px]">Preço Mínimo</TableHead>
                                    <TableHead className="text-right w-[250px]">Preço para Buybox</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productsOfSelectedSellers.map((product) => {
                                    const key = `${product.ean}-${product.key_loja}-${product.marketplace}`;
                                    const competitors = allProducts.filter(p => p.ean === product.ean && p.marketplace === product.marketplace && p.key_loja !== product.key_loja);
                                    const bestCompetitorPrice = competitors.length > 0 ? Math.min(...competitors.map(p => p.price)) : Infinity;
                                    const priceDifference = product.price - bestCompetitorPrice;
                                    
                                    const buyboxInfo = buyboxPriceData[key];

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
                                                        <p className="text-xs text-muted-foreground font-mono">SKU: {product.key_sku}</p>
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
                                                    onChange={(e) => handleMinPriceChange(product.ean, product.key_loja!, product.marketplace, e.target.value)}
                                                    className="text-right"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {buyboxInfo?.price !== null && buyboxInfo?.price !== undefined ? (
                                                        <div className="custom-tooltip flex items-center justify-end gap-1">
                                                            <span className="font-bold text-primary text-lg">{formatCurrency(buyboxInfo.price)}</span>
                                                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                            <div className="custom-tooltip-content text-left font-normal">
                                                                <p className="font-bold text-popover-foreground mb-2">Lógica do Preço de Buybox</p>
                                                                <p>{buyboxInfo.calculationLog}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">Defina o preço mínimo</span>
                                                    )}
                                                     <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => handleUpdatePrices(product)}
                                                        disabled={pricingData[key] === null || pricingData[key] === undefined}
                                                        aria-label="Salvar Preços"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
