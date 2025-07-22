"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle, Home, Package2, PanelLeft } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersGroup } from './filters-group';
import { ProductAccordion } from './product-accordion';
import { Card, CardContent } from '@/components/ui/card';
import { EpocaAnalysis } from './epoca-analysis';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';

// Helper to adapt the new API response to the existing Product type
function adaptApiData(apiProduct: any): Product {
  let brand = null;
  if (apiProduct.descricao) {
    const parts = apiProduct.descricao.split(' - ');
    if (parts.length > 1) {
      brand = parts[parts.length - 1];
    }
  }

  return {
    id: apiProduct.sku,
    ean: apiProduct.ean,
    name: apiProduct.descricao,
    brand: brand,
    marketplace: apiProduct.marketplace,
    seller: apiProduct.loja,
    price: parseFloat(apiProduct.preco_final),
    url: apiProduct.url,
    image: apiProduct.imagem,
    updated_at: apiProduct.data_hora,
  };
}

type Filters = {
  ean: string | null;
  marketplace: string | null;
  seller: string | null;
  description: string | null;
  brand: string | null;
};

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    ean: null,
    marketplace: null,
    seller: null,
    description: null,
    brand: null,
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

  const uniqueEans = useMemo(() => [...Array.from(new Set(products.map(p => p.ean).filter(Boolean).sort()))], [products]);
  const uniqueMarketplaces = useMemo(() => [...Array.from(new Set(products.map(p => p.marketplace).filter(Boolean).sort()))], [products]);
  const uniqueSellers = useMemo(() => [...Array.from(new Set(products.map(p => p.seller).filter(Boolean).sort()))], [products]);
  const uniqueDescriptions = useMemo(() => [...Array.from(new Set(products.map(p => p.name).filter(Boolean).sort()))], [products]);
  const uniqueBrands = useMemo(() => [...Array.from(new Set(products.map(p => p.brand).filter(Boolean).sort()))], [products]);

  const filteredProducts = useMemo(() => {
    // If an EAN is selected, it should be the only filter applied.
    if (filters.ean) {
        return products.filter(p => p.ean === filters.ean);
    }
    return products.filter(p => {
      const marketplaceMatch = !filters.marketplace || p.marketplace === filters.marketplace;
      const sellerMatch = !filters.seller || p.seller === filters.seller;
      const descriptionMatch = !filters.description || p.name === filters.description;
      const brandMatch = !filters.brand || p.brand === filters.brand;
      return marketplaceMatch && sellerMatch && descriptionMatch && brandMatch;
    });
  }, [products, filters]);

  const handleFilterChange = (filterName: keyof Filters, value: string | null) => {
    setFilters(prev => {
        const newFilters = { ...prev, [filterName]: value };
        // If EAN is being set, clear other filters
        if (filterName === 'ean' && value) {
            return {
                ean: value,
                marketplace: null,
                seller: null,
                description: null,
                brand: null,
            };
        }
        // If other filter is set, clear EAN
        if (filterName !== 'ean' && value) {
            newFilters.ean = null;
        }
        return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
        ean: null,
        marketplace: null,
        seller: null,
        description: null,
        brand: null,
    });
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-3 p-2">
              <div className="flex-shrink-0 bg-primary text-primary-foreground p-3 rounded-lg shadow-md">
                  <Package2 className="h-7 w-7" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground font-headline tracking-tight">PriceTrack</h1>
                  <p className="text-sm text-muted-foreground">Seu comparador</p>
              </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
            <div className="p-2">
                <h2 className="font-semibold text-lg mb-4 group-data-[collapsible=icon]:hidden">Filtros</h2>
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
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8 flex items-center gap-4">
                <SidebarTrigger className="md:hidden"/>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground font-headline tracking-tight">Dashboard</h1>
            </header>
            
            <div className="space-y-8">
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
        </div>
      </SidebarInset>
    </>
  );
}
