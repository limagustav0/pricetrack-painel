"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle, Menu } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersGroup } from './filters-group';
import { ProductAccordion } from './product-accordion';
import { EpocaAnalysis } from './epoca-analysis';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceComparisonTable } from './price-comparison-table';
import { SellerComparisonTable } from './seller-comparison-table';

// Helper to adapt the new API response to the existing Product type
function adaptApiData(apiProduct: any): Product {
  return {
    id: apiProduct.sku,
    ean: apiProduct.ean,
    name: apiProduct.descricao,
    brand: apiProduct.marca,
    marketplace: apiProduct.marketplace,
    seller: apiProduct.loja,
    key_loja: apiProduct.key_loja,
    price: parseFloat(apiProduct.preco_final),
    url: apiProduct.url,
    image: apiProduct.imagem,
    updated_at: apiProduct.data_hora,
  };
}

export type Filters = {
  ean: string[];
  marketplace: string[];
  seller: string[];
  description: string[];
  brand: string[];
};


function DashboardContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    ean: [],
    marketplace: [],
    seller: [],
    description: [],
    brand: [],
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsResponse, urlsResponse] = await Promise.all([
            fetch('/api/price-data'),
            fetch('/api/url-data')
        ]);

        if (!productsResponse.ok) {
          throw new Error(`Erro ao conectar com a API de produtos. Status: ${productsResponse.status} ${productsResponse.statusText}`);
        }
        if (!urlsResponse.ok) {
            throw new Error(`Erro ao conectar com a API de URLs. Status: ${urlsResponse.status} ${urlsResponse.statusText}`);
        }

        const productsData = await productsResponse.json();
        const urlsData = await urlsResponse.json();
        
        const results = productsData.results || productsData;
        
        if (!Array.isArray(results)) {
            throw new Error("O formato dos dados de produtos recebidos da API não é o esperado.");
        }

        const urlMap = new Map<string, string>();
        if (Array.isArray(urlsData)) {
            for (const item of urlsData) {
                if(item.ean && item.marketplace && item.url) {
                    const key = `${item.ean}-${item.marketplace}`;
                    urlMap.set(key, item.url);
                }
            }
        }

        const adaptedProducts = results.map(adaptApiData);
        
        const mergedProducts = adaptedProducts.map(product => {
            if (!product.url && product.ean && product.marketplace) {
                const key = `${product.ean}-${product.marketplace}`;
                if (urlMap.has(key)) {
                    return { ...product, url: urlMap.get(key)! };
                }
            }
            return product;
        });

        setProducts(mergedProducts);

      } catch (e) {
        if (e instanceof Error) {
          setError(`Falha ao buscar os dados: ${e.message}. Verifique sua conexão ou a URL da API.`);
        } else {
          setError('Ocorreu um erro desconhecido ao processar os dados.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const uniqueEans = useMemo(() => [...Array.from(new Set(products.map(p => p.ean).filter(Boolean).sort()))], [products]);
  const uniqueMarketplaces = useMemo(() => [...Array.from(new Set(products.map(p => p.marketplace).filter(Boolean).sort()))], [products]);
  const uniqueSellers = useMemo(() => [...Array.from(new Set(products.map(p => p.seller).filter(Boolean).sort()))], [products]);
  const uniqueDescriptions = useMemo(() => [...Array.from(new Set(products.map(p => p.name).filter(Boolean).sort()))], [products]);
  const uniqueBrands = useMemo(() => [...Array.from(new Set(products.map(p => p.brand).filter(Boolean).sort()))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const eanMatch = filters.ean.length === 0 || (p.ean && filters.ean.includes(p.ean));
        const marketplaceMatch = filters.marketplace.length === 0 || (p.marketplace && filters.marketplace.includes(p.marketplace));
        const sellerMatch = filters.seller.length === 0 || (p.seller && filters.seller.includes(p.seller));
        const descriptionMatch = filters.description.length === 0 || filters.description.includes(p.name);
        const brandMatch = filters.brand.length === 0 || (p.brand && filters.brand.includes(p.brand));

        return eanMatch && marketplaceMatch && sellerMatch && descriptionMatch && brandMatch;
    });
  }, [products, filters]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterName];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [filterName]: newValues,
      };
    });
  };

  const clearFilters = () => {
    setFilters({
        ean: [],
        marketplace: [],
        seller: [],
        description: [],
        brand: [],
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
        <div className="w-72 bg-white border-r p-4 flex-shrink-0">
             <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filtros</h2>
              </div>
              <FiltersGroup
                  eans={uniqueEans}
                  marketplaces={uniqueMarketplaces}
                  sellers={uniqueSellers}
                  descriptions={uniqueDescriptions}
                  brands={uniqueBrands}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearFilters}
                  loading={loading}
              />
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-6">
            <header className="mb-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                    <h1 className="text-2xl font-bold text-foreground font-headline tracking-tight">PriceTrack</h1>
                    <p className="text-sm text-muted-foreground">Compare preços de diferentes marketplaces de forma eficiente.</p>
                </div>
            </header>
            <Tabs defaultValue="overview" className="w-full flex flex-col h-full">
                <TabsList className="grid grid-cols-3 max-w-md mb-4">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="granular">Análise por Marketplace</TabsTrigger>
                    <TabsTrigger value="seller">Análise por Vendedor</TabsTrigger>
                </TabsList>
              
                <div className="flex-1 min-h-0">
                    <TabsContent value="overview" className="mt-0 h-full">
                        <div className="space-y-6 h-full overflow-y-auto">
                            <EpocaAnalysis allProducts={products} loading={loading} />

                            <div>
                                {error ? (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Erro de Comunicação</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                ) : (
                                    <ProductAccordion products={filteredProducts} loading={loading} />
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="granular" className="mt-0 h-full">
                        <PriceComparisonTable allProducts={products} loading={loading} />
                    </TabsContent>
                     <TabsContent value="seller" className="mt-0 h-full">
                        <SellerComparisonTable allProducts={products} loading={loading} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    </div>
  );
}

export function Dashboard() {
    return (
        <SidebarProvider>
            <DashboardContent />
        </SidebarProvider>
    )
}
