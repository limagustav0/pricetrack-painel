
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
import { AlertTriangle, Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AutoPriceChangeProps {
  allProducts: Product[];
  loading: boolean;
}

export function AutoPriceChange({ allProducts, loading }: AutoPriceChangeProps) {
  const [filteredSellers, setFilteredSellers] = useState<string[]>([]);
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
  
  const selectedSellerOptions = useMemo(() => {
      return sellerOptions.filter(option => filteredSellers.includes(option.value));
  }, [sellerOptions, filteredSellers]);


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
  
  useEffect(() => {
    // If the active seller is no longer in the filtered list, reset it
    if(activeSeller && !filteredSellers.includes(activeSeller)) {
        setActiveSeller(null);
    }
    // If only one seller is filtered, make it active
    if(filteredSellers.length === 1 && !activeSeller) {
        setActiveSeller(filteredSellers[0]);
    }
  }, [filteredSellers, activeSeller]);


  const handleFilterChange = (value: string) => {
    setFilteredSellers(prev => 
        prev.includes(value) 
            ? prev.filter(v => v !== value) 
            : [...prev, value]
    );
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
                  <Skeleton className="h-10 w-full md:w-1/3 mb-4" />
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
                    Selecione um ou mais vendedores para filtrar e, em seguida, escolha um vendedor ativo para configurar seus produtos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    <div>
                        <Label>Filtrar Vendedores</Label>
                        <SearchableSelect
                            placeholder="Filtrar Vendedor(es)..."
                            options={sellerOptions}
                            selectedValues={filteredSellers}
                            onChange={handleFilterChange}
                        />
                    </div>
                     <div>
                        <Label>Vendedor Ativo</Label>
                        <Select
                            value={activeSeller ?? ""}
                            onValueChange={setActiveSeller}
                            disabled={selectedSellerOptions.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um vendedor para editar" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedSellerOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                                {selectedSellerOptions.length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        Filtre um vendedor primeiro.
                                    </div>
                                )}
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sellerProducts.map((product) => (
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
                                    </TableRow>
                                ))}
                                {sellerProducts.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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

    