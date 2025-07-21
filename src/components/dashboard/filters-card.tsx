"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton";

interface Filters {
  brand: string;
  ean: string;
  marketplace: string;
  seller: string;
}

interface FiltersCardProps {
  brands: string[];
  marketplaces: string[];
  filters: Filters;
  onFilterChange: (filterName: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function FiltersCard({ brands, marketplaces, filters, onFilterChange, onClearFilters, loading }: FiltersCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="brand-filter">Marca</Label>
            <Select value={filters.brand} onValueChange={(value) => onFilterChange('brand', value)}>
              <SelectTrigger id="brand-filter" className="w-full">
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand === 'all' ? 'Todas as Marcas' : brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="marketplace-filter">Marketplace</Label>
            <Select value={filters.marketplace} onValueChange={(value) => onFilterChange('marketplace', value)}>
              <SelectTrigger id="marketplace-filter" className="w-full">
                <SelectValue placeholder="Selecione o marketplace" />
              </SelectTrigger>
              <SelectContent>
                {marketplaces.map(mp => (
                  <SelectItem key={mp} value={mp}>{mp === 'all' ? 'Todos os Marketplaces' : mp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="ean-filter">EAN</Label>
            <Input id="ean-filter" placeholder="Filtrar por EAN..." value={filters.ean} onChange={(e) => onFilterChange('ean', e.target.value)} />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="seller-filter">Seller</Label>
            <Input id="seller-filter" placeholder="Filtrar por Seller..." value={filters.seller} onChange={(e) => onFilterChange('seller', e.target.value)} />
          </div>
          <Button onClick={onClearFilters} variant="outline" className="w-full lg:w-auto">
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
