"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle, Package2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersCard } from './filters-card';
import { ProductAccordion } from './product-accordion';

const mockProducts: Product[] = [
    { id: 1, ean: '7891000123456', name: 'Shampoo Hidratante Intenso', brand: 'Marca A', marketplace: 'Epoca Cosmeticos', seller: 'Epoca Oficial', price: 45.90, url: '#', image: 'https://placehold.co/100x100.png', updated_at: '2023-10-27T10:00:00Z' },
    { id: 2, ean: '7891000123456', name: 'Shampoo Hidratante Intenso', brand: 'Marca A', marketplace: 'Amazon', seller: 'Beleza Pura', price: 42.50, url: '#', image: 'https://placehold.co/100x100.png', updated_at: '2023-10-27T10:05:00Z' },
    { id: 3, ean: '7891000123456', name: 'Shampoo Hidratante Intenso', brand: 'Marca A', marketplace: 'Beleza na Web', seller: 'Beleza na Web', price: 47.00, url: '#', image: 'https://placehold.co/100x100.png', updated_at: '2023-10-27T09:55:00Z' },
    { id: 4, ean: '7891000654321', name: 'Condicionador Nutritivo', brand: 'Marca B', marketplace: 'Magazine Luiza', seller: 'Magalu', price: 35.00, url: '#', image: 'https://placehold.co/100x100.png', updated_at: '2023-10-27T11:00:00Z' },
    { id: 5, ean: '7891000654321', name: 'Condicionador Nutritivo', brand: 'Marca B', marketplace: 'Amazon', seller: 'Super Vendas', price: 33.99, url: '#', image: 'https://placehold.co/100x100.png', updated_at: '2023-10-27T11:10:00Z' },
    { id: 6, ean: '7891000987654', name: 'Máscara Capilar Reparadora', brand: 'Marca C', marketplace: 'Beleza na Web', seller: 'Beleza na Web', price: 89.90, url: '#', image: 'https://placehold.co/100x100.png', updated_at: '2023-10-26T15:30:00Z' },
    { id: 7, ean: '7891000987654', name: 'Máscara Capilar Reparadora', brand: 'Marca C', marketplace: 'Epoca Cosmeticos', seller: 'Epoca Oficial', price: 92.50, url: '#', image: 'https://placehold.co/100x100.png', updated_at: '2023-10-26T15:35:00Z' },
    { id: 8, ean: '7891000112233', name: 'Protetor Solar Facial FPS 50', brand: 'Marca A', marketplace: 'Amazon', seller: 'Amazon', price: 65.00, url: '#', image: 'https://placehold.co/100x100.png', updated_at: '2023-10-27T12:00:00Z' },
];

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
      try {
        // NOTE: Using mock data for demonstration and stability.
        // To use the real API, uncomment the fetch call and handle potential CORS/HTTP issues.
        // const response = await fetch('http://201.23.64.234:8000/api/products/');
        // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        // const data = await response.json();
        // setProducts(data.results || data);
        
        // Simulate network delay
        setTimeout(() => {
            setProducts(mockProducts);
            setLoading(false);
        }, 1000);

      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred.');
        }
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
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to fetch product data: {error}
                </AlertDescription>
            </Alert>
        )}
        <ProductAccordion products={filteredProducts} loading={loading} />
      </div>
    </div>
  );
}
