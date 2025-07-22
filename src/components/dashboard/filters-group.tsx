"use client";

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton";
import { MultiSelect } from "./multi-select";
import { Search } from "lucide-react";

interface Filters {
  ean: string[];
  marketplace: string[];
  seller: string[];
  description: string[];
  brand: string[];
}

interface FiltersGroupProps {
  eans: string[];
  marketplaces: string[];
  sellers: string[];
  descriptions: string[];
  brands: string[];
  filters: Filters;
  onFilterChange: (filterName: keyof Filters, value: string[]) => void;
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
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
                <Skeleton className="h-10 w-40 ml-auto" />
            </div>
        );
    }
  
  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <MultiSelect
              placeholder="EAN"
              selected={filters.ean}
              options={eans.map(ean => ({ value: ean, label: ean }))}
              onChange={(value) => onFilterChange('ean', value)}
              className="w-full"
            />
            <MultiSelect
              placeholder="Descrição"
              selected={filters.description}
              options={descriptions.map(desc => ({ value: desc, label: desc }))}
              onChange={(value) => onFilterChange('description', value)}
              className="w-full"
              disabled={filters.ean.length > 0}
            />
            <MultiSelect
              placeholder="Marca"
              selected={filters.brand}
              options={brands.map(brand => ({ value: brand, label: brand }))}
              onChange={(value) => onFilterChange('brand', value)}
              className="w-full"
              disabled={filters.ean.length > 0}
            />
            <MultiSelect
              placeholder="Marketplace"
              selected={filters.marketplace}
              options={marketplaces.map(mp => ({ value: mp, label: mp }))}
              onChange={(value) => onFilterChange('marketplace', value)}
              className="w-full"
              disabled={filters.ean.length > 0}
            />
            <MultiSelect
              placeholder="Loja (Seller)"
              selected={filters.seller}
              options={sellers.map(seller => ({ value: seller, label: seller }))}
              onChange={(value) => onFilterChange('seller', value)}
              className="w-full"
              disabled={filters.ean.length > 0}
            />
        </div>
        <div className="flex justify-end">
            <Button onClick={onClearFilters} variant="outline">
                Limpar Todos os Filtros
            </Button>
        </div>
    </div>
  );
}
