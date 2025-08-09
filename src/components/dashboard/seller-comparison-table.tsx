

"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, isValidImageUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SearchX, TrendingUp } from 'lucide-react';
import { SearchableSelect } from './searchable-select';

interface SellerComparisonTableProps {
  allProducts: Product[]; // Now receives filtered products
  loading: boolean;
}

interface GroupedBySeller {
    sellerName: string;
    key_loja: string;
    marketplaces: string[];
    products: Record<string, { // EAN as key
        name: string;
        brand: string | null;
        image: string;
        offers: Record<string, { price: number; change_price: number | null; }>; // Marketplace as key
    }>;
}

export function SellerComparisonTable({ allProducts, loading }: SellerComparisonTableProps) {
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  
  const { groupedSellers, uniqueMarketplaces, sellerOptions } = useMemo(() => {
    // Note: uniqueMarketplaces here are derived from the *filtered* product list
    const marketplaces = [...new Set(allProducts.map(p => p.marketplace).filter(Boolean))].sort();

    const sellersData = allProducts.reduce((acc, product) => {
        if (!product.key_loja || !product.ean) return acc;

        if (!acc[product.key_loja]) {
            acc[product.key_loja] = {
                sellerName: product.seller,
                key_loja: product.key_loja,
                marketplaces: [],
                products: {},
            };
        }
        
        if (product.marketplace && !acc[product.key_loja].marketplaces.includes(product.marketplace)) {
            acc[product.key_loja].marketplaces.push(product.marketplace);
        }

        if (!acc[product.key_loja].products[product.ean]) {
            let image = 'https://placehold.co/100x100.png';
            if (isValidImageUrl(product.image)) {
                image = product.image!;
            } else {
                 // It's tricky to get an image from the original full list here without passing it down.
                 // We'll rely on the filtered list. If no valid image is present for this EAN in the filtered list,
                 // it will fall back to the placeholder.
                 const sameEanProducts = allProducts.filter(p => p.ean === product.ean);
                 const validImageProduct = sameEanProducts.find(p => isValidImageUrl(p.image));
                 if (validImageProduct) {
                     image = validImageProduct.image!;
                 }
            }

            acc[product.key_loja].products[product.ean] = {
                name: product.name,
                brand: product.brand,
                image: image,
                offers: {},
            };
        }
        
        const existingOffer = acc[product.key_loja].products[product.ean].offers[product.marketplace];
        if (!existingOffer || product.price < existingOffer.price) {
            acc[product.key_loja].products[product.ean].offers[product.marketplace] = {
                price: product.price,
                change_price: product.change_price,
            };
        }

        return acc;
    }, {} as Record<string, GroupedBySeller>);
    
    const sortedSellers = Object.values(sellersData).sort((a, b) => a.sellerName.localeCompare(b.sellerName));

    const options = sortedSellers.map(s => ({ value: s.key_loja, label: s.sellerName }));

    return { 
        groupedSellers: sortedSellers, 
        uniqueMarketplaces: marketplaces,
        sellerOptions: options
    };
  }, [allProducts]);
  
  const filteredSellers = useMemo(() => {
      return groupedSellers.filter(seller => {
          const sellerMatch = selectedSellers.length === 0 || selectedSellers.includes(seller.key_loja);
          const marketplaceMatch = selectedMarketplaces.length === 0 || seller.marketplaces.some(m => selectedMarketplaces.includes(m));
          return sellerMatch && marketplaceMatch;
      });
  }, [groupedSellers, selectedSellers, selectedMarketplaces]);

  const handleSellerChange = (value: string) => {
      setSelectedSellers(prev => 
          prev.includes(value) 
              ? prev.filter(v => v !== value) 
              : [...prev, value]
      );
  };
  
  const handleMarketplaceChange = (value: string) => {
    setSelectedMarketplaces(prev => 
        prev.includes(value) 
            ? prev.filter(v => v !== value) 
            : [...prev, value]
    );
  };

  const visibleMarketplaces = useMemo(() => {
      return selectedMarketplaces.length > 0 ? uniqueMarketplaces.filter(m => selectedMarketplaces.includes(m)) : uniqueMarketplaces;
  }, [uniqueMarketplaces, selectedMarketplaces]);

  if (loading) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex gap-4 mb-4">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-10 w-1/3" />
                </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                       <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Análise por Vendedor</CardTitle>
        <CardDescription>
          Visualize e compare os preços de cada produto por vendedor nos diferentes marketplaces. Os dados aqui refletem os filtros globais aplicados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 min-w-0">
                <SearchableSelect
                    placeholder="Filtrar por Vendedor..."
                    options={sellerOptions}
                    selectedValues={selectedSellers}
                    onChange={handleSellerChange}
                />
            </div>
            <div className="flex-1 min-w-0">
                <SearchableSelect
                    placeholder="Filtrar por Marketplace..."
                    options={uniqueMarketplaces.map(m => ({ value: m, label: m }))}
                    selectedValues={selectedMarketplaces}
                    onChange={handleMarketplaceChange}
                />
            </div>
        </div>

        {filteredSellers.length > 0 ? (
            <div className="border rounded-lg">
              <Accordion type="multiple" className="space-y-0">
                  {filteredSellers.map((seller) => (
                      <AccordionItem value={seller.key_loja} key={seller.key_loja} className="border-b last:border-b-0">
                          <AccordionTrigger className="px-4 py-3 text-left hover:no-underline bg-muted/50">
                              <div className="flex-1 text-left">
                                <h3 className="text-lg font-bold">{seller.sellerName}</h3>
                              </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-0">
                              <div className="border-t overflow-auto">
                                  <Table>
                                      <TableHeader className="sticky top-0 bg-background z-10">
                                          <TableRow>
                                              <TableHead className="min-w-[350px]">Produto (EAN/Marca)</TableHead>
                                              {visibleMarketplaces.map(mp => <TableHead key={mp} className="text-right min-w-[150px]">{mp}</TableHead>)}
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {Object.entries(seller.products).map(([ean, product]) => {
                                              const imageSrc = product.image; // Already validated
                                              const prices = Object.values(product.offers).map(o => o.price);
                                              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                                              return (
                                                  <TableRow key={ean}>
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
                                                              <div className="flex-1">
                                                                  <div className="font-medium">{product.name}</div>
                                                                  <div className="text-sm text-muted-foreground">EAN: {ean}</div>
                                                                  <div className="text-xs text-muted-foreground">{product.brand}</div>
                                                              </div>
                                                          </div>
                                                      </TableCell>
                                                      {visibleMarketplaces.map(mp => {
                                                          const offer = product.offers[mp];
                                                          const isMinPrice = offer && offer.price === minPrice;
                                                          return (
                                                              <TableCell key={mp} className="text-right align-top">
                                                                  {offer ? (
                                                                      <div>
                                                                          <p className={`font-bold ${isMinPrice ? 'text-primary' : ''}`}>
                                                                              {formatCurrency(offer.price)}
                                                                          </p>
                                                                          {offer.change_price && offer.change_price > 0 && (
                                                                              <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
                                                                                  <TrendingUp className="h-3 w-3" />
                                                                                  {offer.change_price} alteraç{offer.change_price === 1 ? 'ão' : 'ões'}
                                                                              </p>
                                                                          )}
                                                                          {isMinPrice && prices.length > 1 && <Badge variant="secondary" className="mt-1">Melhor Preço</Badge>}
                                                                      </div>
                                                                  ) : (
                                                                      <span className="text-muted-foreground">-</span>
                                                                  )}
                                                              </TableCell>
                                                          )
                                                      })}
                                                  </TableRow>
                                              )
                                          })}
                                      </TableBody>
                                  </Table>
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                  ))}
              </Accordion>
            </div>
        ) : (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg flex flex-col justify-center">
                <SearchX className="h-10 w-10 mx-auto mb-4" />
                <p className="font-semibold">Nenhum vendedor encontrado</p>
                <p className="text-sm">Tente limpar o filtro ou aguarde a carga dos dados.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
