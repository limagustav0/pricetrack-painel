"use client";

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "./searchable-select";
import { Label } from "@/components/ui/label";

interface Filters {
  ean: string | null;
  marketplace: string | null;
  seller: string | null;
  description: string | null;
  brand: string | null;
}

interface FiltersGroupProps {
  eans: string[];
  marketplaces: string[];
  sellers: string[];
  descriptions: string[];
  brands: string[];
  filters: Filters;
  onFilterChange: (filterName: keyof Filters, value: string | null) => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function FiltersGroup({ 
    eans, 
    marketplaces, 
    sellers, 
    descriptions,
    brands,
    filters, 
    onFilterChange,
    onClearFilters, 
    loading 
}: FiltersGroupProps) {
    if (loading) {
        return (
            <div className="space-y-4 p-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
                <Skeleton className="h-10 w-full mt-4" />
            </div>
        );
    }
  
  return (
    <div className="space-y-4 p-2">
        <div>
            <Label>EAN</Label>
            <SearchableSelect
              placeholder="Filtrar por EAN..."
              options={eans.map(ean => ({ value: ean, label: ean }))}
              value={filters.ean}
              onChange={(value) => onFilterChange('ean', value)}
            />
        </div>
        <div>
            <Label>Descrição</Label>
            <SearchableSelect
              placeholder="Filtrar por Descrição..."
              options={descriptions.map(desc => ({ value: desc, label: desc }))}
              value={filters.description}
              onChange={(value) => onFilterChange('description', value)}
              disabled={!!filters.ean}
            />
        </div>
        <div>
            <Label>Marca</Label>
            <SearchableSelect
              placeholder="Filtrar por Marca..."
              options={brands.map(brand => ({ value: brand, label: brand }))}
              value={filters.brand}
              onChange={(value) => onFilterChange('brand', value)}
              disabled={!!filters.ean}
            />
        </div>
        <div>
            <Label>Marketplace</Label>
            <SearchableSelect
              placeholder="Filtrar por Marketplace..."
              options={marketplaces.map(mp => ({ value: mp, label: mp }))}
              value={filters.marketplace}
              onChange={(value) => onFilterChange('marketplace', value)}
              disabled={!!filters.ean}
            />
        </div>
        <div>
            <Label>Loja (Seller)</Label>
            <SearchableSelect
              placeholder="Filtrar por Loja (Seller)..."
              options={sellers.map(seller => ({ value: seller, label: seller }))}
              value={filters.seller}
              onChange={(value) => onFilterChange('seller', value)}
              disabled={!!filters.ean}
            />
        </div>
        <Button onClick={onClearFilters} variant="outline" className="w-full mt-4">
            Limpar Filtros
        </Button>
    </div>
  );
}
