"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle, Package2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersCard } from './filters-card';
import { ProductAccordion } from './product-accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsTab } from './analytics-tab';


// Helper to adapt the new API response to the existing Product type
function adaptApiData(apiProduct: any): Product {
  return {
    id: apiProduct.sku,
    ean: apiProduct.ean,
    name: apiProduct.descricao,
    brand: null, // Brand is not in the new API structure
    marketplace: apiProduct.marketplace,
    seller: apiProduct.loja,
    price: parseFloat(apiProduct.preco_final),
    url: apiProduct.url,
    image: apiProduct.imagem,
    updated_at: apiProduct.data_hora,
  };
}


export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    ean: 'all',
    marketplace: 'all',
    seller: 'all', // 'loja' from API
    description: '',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/price-data');
        if (!response.ok) {
          throw new Error(`Erro ao conectar com a API. Status: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        // The API returns an object with a 'results' key which is an array
        const results = data.results || data; 
        if (Array.isArray(results)) {
            setProducts(results.map(adaptApiData));
        } else {
            throw new Error("O formato dos dados recebidos da API não é o esperado.");
        }
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

  const uniqueEans = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.ean).filter(Boolean).sort()))], [products]);
  const uniqueMarketplaces = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.marketplace).filter(Boolean).sort()))], [products]);
  const uniqueSellers = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.seller).filter(Boolean).sort()))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const marketplaceMatch = filters.marketplace === 'all' || (p.marketplace && p.marketplace.toLowerCase() === filters.marketplace.toLowerCase());
        const eanMatch = filters.ean === 'all' || (p.ean && p.ean.includes(filters.ean.trim()));
        const sellerMatch = filters.seller === 'all' || (p.seller && p.seller.toLowerCase() === filters.seller.toLowerCase());
        const descriptionMatch = filters.description === '' || (p.name && p.name.toLowerCase().includes(filters.description.toLowerCase()));
        return marketplaceMatch && eanMatch && sellerMatch && descriptionMatch;
    });
  }, [products, filters]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
        ean: 'all',
        marketplace: 'all',
        seller: 'all',
        description: '',
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex-shrink-0 bg-primary text-primary-foreground p-3 rounded-lg shadow-md">
            <Package2 className="h-8 w-8" />
        </div>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-headline tracking-tight">PriceTrack</h1>
            <p className="text-muted-foreground">Seu comparador de preços inteligente.</p>
        </div>
      </header>

      <FiltersCard
        eans={uniqueEans}
        marketplaces={uniqueMarketplaces}
        sellers={uniqueSellers}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        loading={loading}
      />

      <div className="mt-8">
        {error ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Comunicação</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        ) : (
          <Tabs defaultValue="products">
            <TabsList className="grid w-full grid-cols-2 md:w-1/3">
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="analytics">Análise de Marketplace</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="mt-6">
              <ProductAccordion products={filteredProducts} loading={loading} />
            </TabsContent>
            <TabsContent value="analytics" className="mt-6">
              <AnalyticsTab products={filteredProducts} loading={loading} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}