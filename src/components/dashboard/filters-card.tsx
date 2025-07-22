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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton";

interface Filters {
  ean: string;
  marketplace: string;
  seller: string;
}

interface FiltersCardProps {
  eans: string[];
  marketplaces: string[];
  sellers: string[];
  filters: Filters;
  onFilterChange: (filterName: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function FiltersCard({ eans, marketplaces, sellers, filters, onFilterChange, onClearFilters, loading }: FiltersCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="ean-filter">EAN</Label>
            <Select value={filters.ean} onValueChange={(value) => onFilterChange('ean', value)}>
              <SelectTrigger id="ean-filter" className="w-full">
                <SelectValue placeholder="Selecione o EAN" />
              </SelectTrigger>
              <SelectContent>
                {eans.map(ean => (
                  <SelectItem key={ean} value={ean}>{ean === 'all' ? 'Todos os EANs' : ean}</SelectItem>
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
            <Label htmlFor="seller-filter">Loja (Seller)</Label>
            <Select value={filters.seller} onValueChange={(value) => onFilterChange('seller', value)}>
              <SelectTrigger id="seller-filter" className="w-full">
                <SelectValue placeholder="Selecione a loja" />
              </SelectTrigger>
              <SelectContent>
                {sellers.map(seller => (
                  <SelectItem key={seller} value={seller}>{seller === 'all' ? 'Todas as Lojas' : seller}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onClearFilters} variant="outline" className="w-full lg:w-auto">
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
