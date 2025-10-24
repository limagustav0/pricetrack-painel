

"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersGroup } from './filters-group';
import { ProductAccordion } from './product-accordion';
import { ComparativeAnalysis } from './comparative-analysis';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceComparisonTable } from './price-comparison-table';
import { SellerComparisonTable } from './seller-comparison-table';
import { Toaster } from '@/components/ui/toaster';
import { isValidHttpUrl, isValidImageUrl } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { BuyboxCompetitionAnalysis } from './buybox-competition-analysis';
import { AutoPriceChange } from './auto-price-change';
import { Badge } from '../ui/badge';


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
    preco_pricing: apiProduct.preco_pricing ? parseFloat(apiProduct.preco_pricing) : null,
    url: isValidHttpUrl(apiProduct.url) ? apiProduct.url : null,
    image: imageUrl,
    updated_at: apiProduct.data_hora,
    status: apiProduct.status,
    change_price: apiProduct.change_price,
  };
}

export type Filters = {
  ean: string[];
  marketplace: string[];
  seller: string[];
  description: string[];
  brand: string[];
  status: string[];
};


function DashboardContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMarketplace, setComparisonMarketplace] = useState<string>("");
  const [showOnlyWithCompetitors, setShowOnlyWithCompetitors] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    ean: [],
    marketplace: [],
    seller: [],
    description: [],
    brand: [],
    status: [],
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const productsResponse = await fetch('/api/price-data');

        if (!productsResponse.ok) {
          throw new Error(`Erro ao conectar com a API de produtos. Status: ${productsResponse.status} ${productsResponse.statusText}`);
        }
        
        const productsData = await productsResponse.json();
        const results = productsData.results || productsData;
        
        if (!Array.isArray(results)) {
            throw new Error("O formato dos dados de produtos recebidos da API não é o esperado.");
        }

        const adaptedProducts = results.map(adaptApiData).filter(p => p.status === 'ativo');
        
        const mergedProducts = adaptedProducts.map(product => {
            const sameEanProducts = adaptedProducts.filter(p => p.ean === product.ean && isValidImageUrl(p.image));
            const productForImage = 
                sameEanProducts.find(p => p.marketplace === 'Beleza na Web') ||
                sameEanProducts.find(p => p.marketplace === 'Época Cosméticos') ||
                sameEanProducts.find(p => p.marketplace === 'Magazine Luiza') ||
                sameEanProducts.find(p => p.marketplace === 'Amazon') ||
                sameEanProducts[0];
            
            const finalProduct = { ...product };

            if (!isValidImageUrl(finalProduct.image) && productForImage && isValidImageUrl(productForImage.image)) {
                finalProduct.image = productForImage.image;
            }

            return finalProduct;
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
  const uniqueStatuses = useMemo(() => [...Array.from(new Set(products.map(p => p.status).filter(Boolean).sort()))], [products]);

  // Set default comparison marketplace once data is loaded
  useEffect(() => {
      if(uniqueMarketplaces.length > 0 && !comparisonMarketplace) {
          const epoca = uniqueMarketplaces.find(m => m.toLowerCase().includes('época'));
          setComparisonMarketplace(epoca || uniqueMarketplaces[0]);
      }
  }, [uniqueMarketplaces, comparisonMarketplace]);

  const filteredProducts = useMemo(() => {
    let productsToFilter = products;

    if (showOnlyWithCompetitors) {
        const eanMarketplaceCount = products.reduce((acc, p) => {
            if (p.ean) {
                if (!acc[p.ean]) {
                    acc[p.ean] = new Set();
                }
                acc[p.ean].add(p.marketplace);
            }
            return acc;
        }, {} as Record<string, Set<string>>);

        const eansWithCompetitors = Object.keys(eanMarketplaceCount).filter(ean => eanMarketplaceCount[ean].size > 1);
        productsToFilter = products.filter(p => p.ean && eansWithCompetitors.includes(p.ean));
    }


    return productsToFilter.filter(p => {
        const eanMatch = filters.ean.length === 0 || (p.ean && filters.ean.includes(p.ean));
        const marketplaceMatch = filters.marketplace.length === 0 || (p.marketplace && filters.marketplace.includes(p.marketplace));
        const sellerMatch = filters.seller.length === 0 || (p.seller && filters.seller.includes(p.seller));
        const descriptionMatch = filters.description.length === 0 || filters.description.includes(p.name);
        const brandMatch = filters.brand.length === 0 || (p.brand && filters.brand.includes(p.brand));
        const statusMatch = filters.status.length === 0 || (p.status && filters.status.includes(p.status));

        return eanMatch && marketplaceMatch && sellerMatch && descriptionMatch && brandMatch && statusMatch;
    });
  }, [products, filters, showOnlyWithCompetitors]);

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
        status: [],
    });
    setShowOnlyWithCompetitors(false);
  };
    
  const handleExport = () => {
    const dataToExport = filteredProducts.map(p => ({
        EAN: p.ean,
        Descrição: p.name,
        Marca: p.brand || '',
        Marketplace: p.marketplace,
        Vendedor: p.seller,
        Preço: p.price,
        URL: p.url || '',
        Status: p.status || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

    const date = new Date().toISOString().slice(0,10);
    XLSX.writeFile(workbook, `produtos_exportados_${date}.xlsx`);
  };


  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Toaster />
        <div className="flex-1 flex flex-col overflow-auto">
             <header className="px-4 pt-4 md:px-6 md:pt-6">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-foreground font-headline tracking-tight">PriceTrack</h1>
                    <p className="text-sm text-muted-foreground">Compare preços de diferentes marketplaces de forma eficiente.</p>
                </div>
            </header>
            <Tabs defaultValue="overview" className="w-full flex flex-col flex-1">
                <div className="px-4 md:px-6 pt-4 overflow-x-auto">
                     <TabsList className="w-full flex-wrap h-auto justify-start max-w-full inline-flex">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="granular">Análise por Marketplace</TabsTrigger>
                        <TabsTrigger value="buybox">Análise de Buybox</TabsTrigger>
                        <TabsTrigger value="seller">Análise por Vendedor</TabsTrigger>
                        <TabsTrigger value="auto_pricing" className="flex items-center gap-2">
                          Alteração Automática <Badge variant="secondary">Beta</Badge>
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="overview" className="mt-0 p-4 md:p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <Card className="p-4">
                             <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <h2 className="text-lg font-bold tracking-tight whitespace-nowrap">Análise Comparativa</h2>
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
                        <ComparativeAnalysis filteredProducts={filteredProducts} loading={loading} selectedMarketplace={comparisonMarketplace} />
                        
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                     <h2 className="text-lg font-semibold">Filtros de Produtos</h2>
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                            id="competitors-only"
                                            checked={showOnlyWithCompetitors}
                                            onCheckedChange={setShowOnlyWithCompetitors}
                                            disabled={loading}
                                        />
                                        <Label htmlFor="competitors-only" className="text-sm">Mostrar apenas produtos com concorrentes</Label>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <FiltersGroup
                                    eans={uniqueEans}
                                    marketplaces={uniqueMarketplaces}
                                    sellers={uniqueSellers}
                                    descriptions={uniqueDescriptions}
                                    brands={uniqueBrands}
                                    statuses={uniqueStatuses}
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    onClearFilters={clearFilters}
                                    onExport={handleExport}
                                    loading={loading}
                                />
                            </CardContent>
                        </Card>

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
                    <PriceComparisonTable allProducts={filteredProducts} loading={loading} />
                </TabsContent>
                <TabsContent value="buybox" className="mt-0 p-4 md:p-6 flex flex-col">
                    <BuyboxCompetitionAnalysis allProducts={products} loading={loading} />
                </TabsContent>
                <TabsContent value="seller" className="mt-0 p-4 md:p-6 flex flex-col">
                    <SellerComparisonTable allProducts={filteredProducts} loading={loading} />
                </TabsContent>
                <TabsContent value="auto_pricing" className="mt-0 p-4 md:p-6 flex flex-col">
                    <AutoPriceChange allProducts={products} loading={loading} />
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
