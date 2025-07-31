

"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersGroup } from './filters-group';
import { ProductAccordion } from './product-accordion';
import { ComparativeAnalysis } from './comparative-analysis';
import { EpocaPriceAnalysis } from './epoca-price-analysis';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceComparisonTable } from './price-comparison-table';
import { SellerComparisonTable } from './seller-comparison-table';
import { Toaster } from '@/components/ui/toaster';
import { isValidHttpUrl } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';


// Helper to adapt the new API response to the existing Product type
function adaptApiData(apiProduct: any): Product {
    const imageUrl = apiProduct.imagem?.startsWith('//')
    ? `https:${apiProduct.imagem}`
    : apiProduct.imagem;

  return {
    id: apiProduct.sku,
    ean: apiProduct.ean,
    name: apiProduct.descricao,
    brand: apiProduct.marca,
    marketplace: apiProduct.marketplace,
    seller: apiProduct.loja,
    key_loja: apiProduct.key_loja,
    price: parseFloat(apiProduct.preco_final),
    url: isValidHttpUrl(apiProduct.url) ? apiProduct.url : null,
    image: imageUrl,
    updated_at: apiProduct.data_hora,
    change_price: apiProduct.change_price ? parseInt(apiProduct.change_price, 10) : 0,
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
  const [comparisonMarketplace, setComparisonMarketplace] = useState<string>("");
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
                if(item.ean && item.marketplace && item.url && isValidHttpUrl(item.url)) {
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
                    // No need to re-validate, already validated when creating the map
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

  // Set default comparison marketplace once data is loaded
  useEffect(() => {
      if(uniqueMarketplaces.length > 0 && !comparisonMarketplace) {
          const epoca = uniqueMarketplaces.find(m => m.toLowerCase().includes('época'));
          setComparisonMarketplace(epoca || uniqueMarketplaces[0]);
      }
  }, [uniqueMarketplaces, comparisonMarketplace]);

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
        <Toaster />
        <div className="w-72 bg-white border-r p-4 flex-shrink-0 overflow-y-auto">
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
        <div className="flex-1 flex flex-col overflow-auto">
             <header className="px-4 pt-4 md:px-6 md:pt-6">
                <div className="flex-1 min-w-[200px]">
                    <h1 className="text-2xl font-bold text-foreground font-headline tracking-tight">PriceTrack</h1>
                    <p className="text-sm text-muted-foreground">Compare preços de diferentes marketplaces de forma eficiente.</p>
                </div>
            </header>
            <Tabs defaultValue="overview" className="w-full flex flex-col flex-1">
                <div className="px-4 md:px-6 pt-4">
                     <TabsList className="w-full grid grid-cols-1 md:grid-cols-4 max-w-2xl">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="granular">Análise por Marketplace</TabsTrigger>
                        <TabsTrigger value="seller">Análise por Vendedor</TabsTrigger>
                         <TabsTrigger value="epoca">Análise Época</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="overview" className="mt-0 p-4 md:p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <Card className="p-4">
                             <div className="flex flex-col md:flex-row items-center gap-4">
                                <h2 className="text-lg font-bold tracking-tight">Análise Comparativa</h2>
                                <div className="w-full md:w-64">
                                <Select value={comparisonMarketplace} onValueChange={setComparisonMarketplace} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um Marketplace" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {uniqueMarketplaces.map(mp => (
                                            <SelectItem key={mp} value={mp}>{mp}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                </div>
                            </div>
                        </Card>
                        <ComparativeAnalysis allProducts={products} loading={loading} selectedMarketplace={comparisonMarketplace} />

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
                <TabsContent value="granular" className="mt-0 p-4 md:p-6 flex flex-col">
                    <PriceComparisonTable allProducts={products} loading={loading} />
                </TabsContent>
                <TabsContent value="seller" className="mt-0 p-4 md:p-6 flex flex-col">
                    <SellerComparisonTable allProducts={products} loading={loading} />
                </TabsContent>
                <TabsContent value="epoca" className="mt-0 p-4 md:p-6">
                    <EpocaPriceAnalysis allProducts={products} loading={loading} />
                </TabsContent>
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
