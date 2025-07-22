"use client";

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "./searchable-select";

interface Filters {
  ean: string;
  marketplace: string;
  seller: string;
  description: string;
  brand: string;
}

interface FiltersGroupProps {
  eans: string[];
  marketplaces: string[];
  sellers: string[];
  descriptions: string[];
  brands: string[];
  filters: Filters;
  onFilterChange: (filterName: keyof Filters, value: string) => void;
  onEanChange: (value: string) => void;
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
    onEanChange, 
    onClearFilters, 
    loading 
}: FiltersGroupProps) {
    if (loading) {
        return (
            <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
  
  return (
    <div className="space-y-6">
        <div>
            <Label className="text-sm font-semibold text-muted-foreground">Filtro Rápido por EAN</Label>
             <SearchableSelect
              placeholder="Selecione um EAN"
              noResultsText="Nenhum EAN encontrado."
              value={filters.ean}
              onChange={onEanChange}
              options={eans.map(ean => ({ value: ean, label: ean }))}
            />
        </div>
        
        <div className="space-y-4">
            <Label className="text-sm font-semibold text-muted-foreground">Filtros Avançados</Label>
            <div className="grid w-full items-center gap-1.5">
                <Label>Descrição</Label>
                <SearchableSelect
                  placeholder="Filtre por descrição"
                  noResultsText="Nenhuma descrição encontrada."
                  value={filters.description}
                  onChange={(value) => onFilterChange('description', value)}
                  options={descriptions.map(desc => ({ value: desc, label: desc }))}
                  disabled={!!filters.ean}
                />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label>Marca</Label>
                <SearchableSelect
                  placeholder="Filtre por marca"
                  noResultsText="Nenhuma marca encontrada."
                  value={filters.brand}
                  onChange={(value) => onFilterChange('brand', value)}
                  options={brands.map(brand => ({ value: brand, label: brand }))}
                  disabled={!!filters.ean}
                />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label>Marketplace</Label>
                <SearchableSelect
                  placeholder="Filtre por marketplace"
                  noResultsText="Nenhum marketplace encontrado."
                  value={filters.marketplace}
                  onChange={(value) => onFilterChange('marketplace', value)}
                  options={marketplaces.map(mp => ({ value: mp, label: mp }))}
                   disabled={!!filters.ean}
                />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label>Loja (Seller)</Label>
                <SearchableSelect
                  placeholder="Filtre por loja"
                  noResultsText="Nenhuma loja encontrada."
                  value={filters.seller}
                  onChange={(value) => onFilterChange('seller', value)}
                  options={sellers.map(seller => ({ value: seller, label: seller }))}
                   disabled={!!filters.ean}
                />
            </div>
        </div>

        <Button onClick={onClearFilters} variant="outline" className="w-full">
            Limpar Todos os Filtros
        </Button>
    </div>
  );
}
