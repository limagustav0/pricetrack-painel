"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

interface FiltersCardProps {
  eans: string[];
  marketplaces: string[];
  sellers: string[];
  descriptions: string[];
  brands: string[];
  filters: Filters;
  onFilterChange: (filterName: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function FiltersCard({ eans, marketplaces, sellers, descriptions, brands, filters, onFilterChange, onClearFilters, loading }: FiltersCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
          <div className="grid w-full items-center gap-1.5 xl:col-span-2">
            <Label htmlFor="description-filter">Descrição</Label>
            <SearchableSelect
              placeholder="Digite ou selecione a descrição"
              noResultsText="Nenhuma descrição encontrada."
              value={filters.description}
              onChange={(value) => onFilterChange('description', value)}
              options={descriptions.map(desc => ({ value: desc, label: desc }))}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label>EAN</Label>
             <SearchableSelect
              placeholder="Digite ou selecione o EAN"
              noResultsText="Nenhum EAN encontrado."
              value={filters.ean}
              onChange={(value) => onFilterChange('ean', value)}
              options={eans.map(ean => ({ value: ean, label: ean }))}
            />
          </div>
           <div className="grid w-full items-center gap-1.5">
            <Label>Marca</Label>
            <SearchableSelect
              placeholder="Digite ou selecione a marca"
              noResultsText="Nenhuma marca encontrada."
              value={filters.brand}
              onChange={(value) => onFilterChange('brand', value)}
              options={brands.map(brand => ({ value: brand, label: brand }))}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label>Marketplace</Label>
            <SearchableSelect
              placeholder="Digite ou selecione o marketplace"
              noResultsText="Nenhum marketplace encontrado."
              value={filters.marketplace}
              onChange={(value) => onFilterChange('marketplace', value)}
              options={marketplaces.map(mp => ({ value: mp, label: mp }))}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label>Loja (Seller)</Label>
            <SearchableSelect
              placeholder="Digite ou selecione a loja"
              noResultsText="Nenhuma loja encontrada."
              value={filters.seller}
              onChange={(value) => onFilterChange('seller', value)}
              options={sellers.map(seller => ({ value: seller, label: seller }))}
            />
          </div>
          <Button onClick={onClearFilters} variant="outline" className="w-full lg:w-auto xl:col-start-6">
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
