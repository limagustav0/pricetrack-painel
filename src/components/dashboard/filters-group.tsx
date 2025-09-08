
"use client";

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "./searchable-select";
import { Label } from "@/components/ui/label";
import type { Filters } from "./dashboard";
import { Download } from "lucide-react";

interface FiltersGroupProps {
  eans: string[];
  marketplaces: string[];
  sellers: string[];
  descriptions: string[];
  brands: string[];
  statuses: string[];
  filters: Filters;
  onFilterChange: (filterName: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
  loading: boolean;
}

export function FiltersGroup({ 
    eans, 
    marketplaces, 
    sellers, 
    descriptions,
    brands,
    statuses,
    filters, 
    onFilterChange,
    onClearFilters,
    onExport,
    loading 
}: FiltersGroupProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
                <div className="flex items-end col-span-full gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        );
    }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
            <Label>EAN</Label>
            <SearchableSelect
            placeholder="Filtrar por EAN..."
            options={eans.map(ean => ({ value: ean, label: ean }))}
            selectedValues={filters.ean}
            onChange={(value) => onFilterChange('ean', value)}
            />
        </div>
        <div>
            <Label>Descrição</Label>
            <SearchableSelect
            placeholder="Filtrar por Descrição..."
            options={descriptions.map(desc => ({ value: desc, label: desc }))}
            selectedValues={filters.description}
            onChange={(value) => onFilterChange('description', value)}
            />
        </div>
        <div>
            <Label>Marca</Label>
            <SearchableSelect
            placeholder="Filtrar por Marca..."
            options={brands.map(brand => ({ value: brand, label: brand }))}
            selectedValues={filters.brand}
            onChange={(value) => onFilterChange('brand', value)}
            />
        </div>
        <div>
            <Label>Marketplace</Label>
            <SearchableSelect
            placeholder="Filtrar por Marketplace..."
            options={marketplaces.map(mp => ({ value: mp, label: mp }))}
            selectedValues={filters.marketplace}
            onChange={(value) => onFilterChange('marketplace', value)}
            />
        </div>
        <div>
            <Label>Loja (Seller)</Label>
            <SearchableSelect
            placeholder="Filtrar por Loja (Seller)..."
            options={sellers.map(seller => ({ value: seller, label: seller }))}
            selectedValues={filters.seller}
            onChange={(value) => onFilterChange('seller', value)}
            />
        </div>
         <div>
            <Label>Status</Label>
            <SearchableSelect
            placeholder="Filtrar por Status..."
            options={statuses.map(status => ({ value: status, label: status }))}
            selectedValues={filters.status}
            onChange={(value) => onFilterChange('status', value)}
            />
        </div>
        <div className="col-span-full flex flex-col md:flex-row justify-end gap-2">
            <Button onClick={onClearFilters} variant="outline" className="w-full md:w-auto">
                Limpar Filtros
            </Button>
            <Button onClick={onExport} variant="secondary" className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
            </Button>
        </div>
    </div>
  );
}
