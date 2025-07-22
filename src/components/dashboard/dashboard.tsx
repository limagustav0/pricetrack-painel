"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle, Package2, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersGroup } from './filters-group';
import { ProductAccordion } from './product-accordion';
import { Card, CardContent } from '@/components/ui/card';
import { EpocaAnalysis } from './epoca-analysis';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  ean: string[];
  marketplace: string[];
  seller: string[];
  description: string[];
  brand: string[];
};

export function Dashboard() {
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
    return products.filter(p => {
      const eanMatch = filters.ean.length === 0 || filters.ean.includes(p.ean);
      const marketplaceMatch = filters.marketplace.length === 0 || (p.marketplace && filters.marketplace.includes(p.marketplace));
      const sellerMatch = filters.seller.length === 0 || (p.seller && filters.seller.includes(p.seller));
      const descriptionMatch = filters.description.length === 0 || (p.name && filters.description.includes(p.name));
      const brandMatch = filters.brand.length === 0 || (p.brand && filters.brand.includes(p.brand));
      return eanMatch && marketplaceMatch && sellerMatch && descriptionMatch && brandMatch;
    });
  }, [products, filters]);

  const handleFilterChange = (filterName: keyof Filters, value: string[]) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const removeFilter = (filterName: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: prev[filterName].filter(item => item !== value),
    }));
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

  const activeFilters = useMemo(() => {
    return Object.entries(filters).flatMap(([key, values]) => 
      (values as string[]).map(value => ({
        category: key as keyof Filters,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: value
      }))
    );
  }, [filters]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-primary text-primary-foreground p-3 rounded-lg shadow-md">
                  <Package2 className="h-7 w-7" />
              </div>
              <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground font-headline tracking-tight">PriceTrack</h1>
                  <p className="text-muted-foreground">Seu comparador de preços inteligente.</p>
              </div>
          </div>
      </header>
      
      <div className="space-y-8">
        <EpocaAnalysis allProducts={products} loading={loading} />

        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        <div>
          {activeFilters.length > 0 && (
            <div className="mb-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Filtros Ativos:</h3>
                  {activeFilters.map(({ category, value, label }) => (
                    <Badge key={`${category}-${value}`} variant="secondary" className="pl-2 pr-1">
                      <span className="mr-1">{value}</span>
                      <button onClick={() => removeFilter(category, value)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
            </div>
          )}
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
  );
}
