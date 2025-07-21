"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle, Package2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersCard } from './filters-card';
import { ProductAccordion } from './product-accordion';

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    brand: 'all',
    ean: '',
    marketplace: 'all',
    seller: '',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://201.23.64.234:8000/api/products/');
        if (!response.ok) {
          throw new Error(`Erro ao conectar com a API. Status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data.results || data);
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

  const uniqueBrands = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.brand).sort()))], [products]);
  const uniqueMarketplaces = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.marketplace).sort()))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const brandMatch = filters.brand === 'all' || p.brand.toLowerCase() === filters.brand.toLowerCase();
        const marketplaceMatch = filters.marketplace === 'all' || p.marketplace.toLowerCase() === filters.marketplace.toLowerCase();
        const eanMatch = p.ean.includes(filters.ean.trim());
        const sellerMatch = p.seller.toLowerCase().includes(filters.seller.trim().toLowerCase());
        return brandMatch && marketplaceMatch && eanMatch && sellerMatch;
    });
  }, [products, filters]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
        brand: 'all',
        ean: '',
        marketplace: 'all',
        seller: '',
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex-shrink-0 bg-primary text-primary-foreground p-3 rounded-lg shadow-md">
            <Package2 className="h-8 w-8" />
        </div>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-headline tracking-tight">PriceWise Dashboard</h1>
            <p className="text-muted-foreground">Seu comparador de preços inteligente.</p>
        </div>
      </header>

      <FiltersCard
        brands={uniqueBrands}
        marketplaces={uniqueMarketplaces}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        loading={loading}
      />

      <div className="mt-8">
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Comunicação</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
        )}
        <ProductAccordion products={filteredProducts} loading={loading} />
      </div>
    </div>
  );
}
