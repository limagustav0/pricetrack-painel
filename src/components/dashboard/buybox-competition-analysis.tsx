

"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, isValidImageUrl, isValidHttpUrl, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { ExternalLink, CheckCircle, XCircle, Download, ShoppingCart, BarChart, AlertTriangle, Crown, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SearchableSelect } from './searchable-select';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface BuyboxCompetitionAnalysisProps {
  allProducts: Product[];
  loading: boolean;
}

interface BuyboxAnalysis {
    ean: string;
    name: string;
    brand: string | null;
    image: string;
    
    myBestOffer?: {
        seller: string;
        marketplace: string;
        price: number;
        url: string | null;
        updated_at: string;
    };
    
    winner: {
        seller: string;
        marketplace: string;
        price: number;
        url: string | null;
        updated_at: string;
    };

    nextCompetitor?: {
        seller: string;
        marketplace: string;
        price: number;
        url: string | null;
    };
    
    status: 'winning' | 'losing' | 'no_offer' | 'winning_alone';
    priceDifference: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];
const COLORS_COMPETITORS = ['#FF8042', '#FFBB28', '#FF4281', '#19AFFF', '#8D19FF', '#FF1919'];

const IMAGE_PRIORITY = ['Beleza na Web', 'Época Cosméticos', 'Magazine Luiza', 'Amazon'];

function getPrioritizedImage(products: Product[]): string {
    for (const marketplace of IMAGE_PRIORITY) {
        const product = products.find(p => p.marketplace === marketplace && isValidImageUrl(p.image));
        if (product) return product.image!;
    }
    const anyValidImageProduct = products.find(p => isValidImageUrl(p.image));
    return anyValidImageProduct?.image || 'https://placehold.co/100x100.png';
}


export function BuyboxCompetitionAnalysis({ allProducts, loading }: BuyboxCompetitionAnalysisProps) {
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);

  const uniqueSellers = useMemo(() => {
    const sellers = new Map<string, string>();
    allProducts.forEach(p => {
        if (p.key_loja && !sellers.has(p.key_loja)) {
            sellers.set(p.key_loja, p.seller);
        }
    });
    return Array.from(sellers.entries()).map(([key_loja, sellerName]) => ({ value: key_loja, label: sellerName })).sort((a,b) => a.label.localeCompare(b.label));
  }, [allProducts]);
  
  const uniqueMarketplaces = useMemo(() => {
    return [...new Set(allProducts.map(p => p.marketplace).filter(Boolean))].sort();
  }, [allProducts]);

  const handleSellerFilterChange = (value: string) => {
    setSelectedSellers(prev => 
        prev.includes(value) 
            ? prev.filter(v => v !== value) 
            : [...prev, value]
    );
  };

  const handleMarketplaceFilterChange = (value: string) => {
    setSelectedMarketplaces(prev => 
        prev.includes(value) 
            ? prev.filter(v => v !== value) 
            : [...prev, value]
    );
  };


  const { buyboxData, charts, kpis, topSellers } = useMemo(() => {
    const initialResult = {
        buyboxData: { winning: [], losing: [] },
        charts: { winsByMarketplace: [], lossesByMarketplace: [], potentialGain: [] },
        kpis: { totalOffered: 0, winningCount: 0, losingCount: 0 },
        topSellers: []
    };

    const filteredByMarketplace = selectedMarketplaces.length > 0 
        ? allProducts.filter(p => selectedMarketplaces.includes(p.marketplace))
        : allProducts;
        
    // Overall Top Sellers Calculation (using all products, ignoring filters for a global view)
    const allProductsByEan = allProducts.reduce((acc, product) => {
      if (!product.ean) return acc;
      if (!acc[product.ean]) acc[product.ean] = [];
      acc[product.ean].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    const winnerCounts: Record<string, { name: string, count: number }> = {};
    for (const ean in allProductsByEan) {
        const products = allProductsByEan[ean];
        if (products.length > 0) {
            const winner = products.sort((a,b) => a.price - b.price)[0];
            if (winner && winner.key_loja) {
                if (!winnerCounts[winner.key_loja]) {
                    winnerCounts[winner.key_loja] = { name: winner.seller, count: 0 };
                }
                winnerCounts[winner.key_loja].count++;
            }
        }
    }
    const calculatedTopSellers = Object.values(winnerCounts).sort((a, b) => b.count - a.count).slice(0, 5);


    if (selectedSellers.length === 0) {
        return { ...initialResult, topSellers: calculatedTopSellers };
    }
    
    const productsByEan = filteredByMarketplace.reduce((acc, product) => {
      if (!product.ean) return acc;
      if (!acc[product.ean]) acc[product.ean] = [];
      acc[product.ean].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    const result: BuyboxAnalysis[] = [];
    const processedOffers = new Set<string>();

    for (const ean in productsByEan) {
        const productsInEan = productsByEan[ean];
        if (productsInEan.length === 0) continue;

        const myOffers = productsInEan.filter(p => selectedSellers.includes(p.key_loja!));
        
        if (myOffers.length === 0) continue;

        // Group my offers by marketplace to find the best offer in each
        const myOffersByMarketplace = myOffers.reduce((acc, offer) => {
            if (!acc[offer.marketplace]) {
                acc[offer.marketplace] = offer;
            } else if (offer.price < acc[offer.marketplace].price) {
                acc[offer.marketplace] = offer;
            }
            return acc;
        }, {} as Record<string, Product>);


        for (const myOffer of Object.values(myOffersByMarketplace)) {
            const marketplace = myOffer.marketplace;
            const offerKey = `${ean}-${marketplace}`;
            if (processedOffers.has(offerKey)) continue;

            const allInMarketplace = productsInEan.filter(p => p.marketplace === marketplace);
            const competitorsInMarketplace = allInMarketplace.filter(p => !selectedSellers.includes(p.key_loja!));
            
            if (allInMarketplace.length === 0) continue;

            const winnerInMarketplace = [...allInMarketplace].sort((a,b) => a.price - b.price)[0];
            
            const image = getPrioritizedImage(productsInEan);

            let status: BuyboxAnalysis['status'];
            let priceDifference = 0;
            let nextCompetitor: BuyboxAnalysis['nextCompetitor'] = undefined;
            let winner: BuyboxAnalysis['winner'];
            
            if (selectedSellers.includes(winnerInMarketplace.key_loja!)) {
                 if (competitorsInMarketplace.length === 0) {
                    status = 'winning_alone';
                } else {
                    status = 'winning';
                    const nextInMarketplace = competitorsInMarketplace.sort((a,b) => a.price - b.price)[0];
                    priceDifference = myOffer.price - nextInMarketplace.price; // This will be negative or zero
                    nextCompetitor = { seller: nextInMarketplace.seller, marketplace: nextInMarketplace.marketplace, price: nextInMarketplace.price, url: nextInMarketplace.url };
                }
                winner = { seller: myOffer.seller, marketplace: myOffer.marketplace, price: myOffer.price, url: myOffer.url, updated_at: myOffer.updated_at };
            } else {
                status = 'losing';
                priceDifference = myOffer.price - winnerInMarketplace.price; // This will be positive
                winner = { seller: winnerInMarketplace.seller, marketplace: winnerInMarketplace.marketplace, price: winnerInMarketplace.price, url: winnerInMarketplace.url, updated_at: winnerInMarketplace.updated_at };
            }

            result.push({
                ean: ean,
                name: productsInEan[0].name,
                brand: productsInEan[0].brand,
                image: image,
                myBestOffer: {
                    seller: myOffer.seller,
                    marketplace: myOffer.marketplace,
                    price: myOffer.price,
                    url: myOffer.url,
                    updated_at: myOffer.updated_at
                },
                winner: winner,
                nextCompetitor,
                status,
                priceDifference
            });
            processedOffers.add(offerKey);
        }
    }
    
    const winningData = result.filter(p => p.status === 'winning' || p.status === 'winning_alone');
    const losingData = result.filter(p => p.status === 'losing');
    
    // Chart 1: Wins by Marketplace
    const winsByMarketplace = winningData.reduce((acc, item) => {
        const marketplace = item.myBestOffer!.marketplace;
        acc[marketplace] = (acc[marketplace] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Chart 2: Losses by Marketplace
    const lossesByMarketplace = losingData.reduce((acc, item) => {
        const winnerMarketplace = item.winner.marketplace;
        acc[winnerMarketplace] = (acc[winnerMarketplace] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const winsChartData = Object.entries(winsByMarketplace).map(([name, value]) => ({ name, value }));
    const lossesChartData = Object.entries(lossesByMarketplace).map(([name, value]) => ({ name, value }));
    
    const totalOffered = new Set(result.map(p => `${p.ean}-${p.myBestOffer?.marketplace}`)).size;
    
    const totalPotentialGain = winningData.reduce((acc, item) => {
        if (item.priceDifference < 0) {
            return acc + Math.abs(item.priceDifference);
        }
        return acc;
    }, 0);
    
    const potentialGainChartData = [
        { name: '10 Vendas', 'Potencial de Ganho': totalPotentialGain * 10 },
        { name: '50 Vendas', 'Potencial de Ganho': totalPotentialGain * 50 },
        { name: '100 Vendas', 'Potencial de Ganho': totalPotentialGain * 100 },
    ];


    return {
        buyboxData: {
            winning: winningData.sort((a,b) => a.name.localeCompare(b.name)),
            losing: losingData.sort((a,b) => b.priceDifference - a.priceDifference),
        },
        charts: {
            winsByMarketplace: winsChartData,
            lossesByMarketplace: lossesChartData,
            potentialGain: potentialGainChartData,
        },
        kpis: {
            totalOffered: totalOffered,
            winningCount: winningData.length,
            losingCount: losingData.length,
        },
        topSellers: calculatedTopSellers
    };
  }, [allProducts, selectedSellers, selectedMarketplaces]);

  const handleExport = (data: BuyboxAnalysis[], fileName: string) => {
    const worksheetData = data.map(item => {
        if (item.status === 'winning' || item.status === 'winning_alone') {
            return {
                'Produto': item.name,
                'EAN': item.ean,
                'Vendedor Ofertante': item.myBestOffer?.seller,
                'Marketplace Ofertante': item.myBestOffer?.marketplace,
                'Preço Ofertante': item.myBestOffer?.price,
                'URL da oferta': item.myBestOffer?.url,
                'Diferença': item.priceDifference < 0 ? `Ganhando por ${formatCurrency(Math.abs(item.priceDifference))}` : (item.status === 'winning_alone' ? 'Ganhando (sozinho)' : 'Preço igual'),
                'Próximo Concorrente': item.nextCompetitor?.seller,
                'Marketplace Concorrente': item.nextCompetitor?.marketplace,
                'Preço Concorrente': item.nextCompetitor?.price,
                'URL Concorrente': item.nextCompetitor?.url,
                'Última Verificação': item.myBestOffer?.updated_at ? new Date(item.myBestOffer.updated_at).toLocaleString('pt-BR') : '',
            };
        } else { // losing
             return {
                'Produto': item.name,
                'EAN': item.ean,
                'Vendedor Ofertante': item.myBestOffer?.seller,
                'Marketplace Ofertante': item.myBestOffer?.marketplace,
                'Preço Ofertante': item.myBestOffer?.price,
                'URL da oferta': item.myBestOffer?.url,
                'Diferença': `Perdendo por ${formatCurrency(item.priceDifference)}`,
                'Vencedor': item.winner.seller,
                'Marketplace Vencedor': item.winner.marketplace,
                'Preço Vencedor': item.winner.price,
                'URL Vencedor': item.winner.url,
                'Última Verificação': item.winner?.updated_at ? new Date(item.winner.updated_at).toLocaleString('pt-BR') : '',
            };
        }
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buybox");

    const date = new Date().toISOString().slice(0,10);
    XLSX.writeFile(workbook, `${fileName}_${date}.xlsx`);
  };

  if (loading) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="flex-1 space-y-8">
                 <Skeleton className="h-10 w-full md:w-1/3" />
                 <div>
                    <Skeleton className="h-8 w-1/4 mb-4" />
                    <div className="border rounded-lg p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-2 border-b">
                               <Skeleton className="h-16 w-16" />
                               <div className="flex-1 space-y-2">
                                 <Skeleton className="h-4 w-3/4" />
                                 <Skeleton className="h-3 w-1/2" />
                               </div>
                               <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            </CardContent>
        </Card>
    )
  }

  const selectedSellersNames = uniqueSellers.filter(s => selectedSellers.includes(s.value)).map(s => s.label).join(', ') || 'Nenhum';

  return (
    <TooltipProvider>
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Configuração da Análise</CardTitle>
                    <CardDescription>
                    Selecione um ou mais vendedores e marketplaces para analisar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Vendedor(es) de Referência</Label>
                         <SearchableSelect
                            placeholder="Selecione Vendedor(es)"
                            options={uniqueSellers}
                            selectedValues={selectedSellers}
                            onChange={handleSellerFilterChange}
                        />
                    </div>
                    <div>
                        <Label>Filtrar por Marketplace</Label>
                        <SearchableSelect
                            placeholder="Todos os Marketplaces"
                            options={uniqueMarketplaces.map(m => ({ value: m, label: m }))}
                            selectedValues={selectedMarketplaces}
                            onChange={handleMarketplaceFilterChange}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle>Análise Consolidada: <span className="text-primary">{selectedSellersNames}</span></CardTitle>
                    <CardDescription>Métricas combinadas para o(s) vendedor(es) selecionado(s), considerando os filtros.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Ofertas</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpis.totalOffered}</div>
                                <p className="text-xs text-muted-foreground">SKU-Marketplace únicos</p>
                            </CardContent>
                        </Card>
                         <Card>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Buyboxes Ganhos</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpis.winningCount}</div>
                                <p className="text-xs text-muted-foreground">Ofertas com menor preço</p>
                            </CardContent>
                        </Card>
                         <Card>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Buyboxes Perdidos</CardTitle>
                                <XCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpis.losingCount}</div>
                                <p className="text-xs text-muted-foreground">Ofertas com preço maior</p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle>Potencial de Ganho Total</CardTitle>
                    <CardDescription>Simulação de ganho ajustando os preços onde você já está ganhando.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                            <div className="h-64 flex items-center justify-center">
                               <Skeleton className="w-full h-full" />
                            </div>
                    ) : charts.potentialGain.some(d => d['Potencial de Ganho'] > 0) ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={charts.potentialGain} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                                <RechartsTooltip 
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {payload[0].value ? formatCurrency(payload[0].value as number) : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="Potencial de Ganho" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <DollarSign className="h-10 w-10 mb-2"/>
                            <p className="font-semibold">Nenhum potencial de ganho.</p>
                            <p className="text-sm">Os preços já estão otimizados ou não há concorrência.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Buybox Ganhos por Marketplace</CardTitle>
                    <CardDescription>Distribuição de vitórias para <span className="font-bold">{selectedSellersNames}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                            <div className="h-64 flex items-center justify-center">
                            <Skeleton className="h-48 w-48 rounded-full" />
                            </div>
                    ) : charts.winsByMarketplace.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={charts.winsByMarketplace}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {charts.winsByMarketplace.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => [`${value} produto(s)`, "Vitórias"]}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <BarChart className="h-10 w-10 mb-2"/>
                            <p className="font-semibold">Nenhum Buybox ganho.</p>
                            <p className="text-sm">Tente selecionar outro vendedor ou limpar filtros.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Buybox Perdidos por Marketplace</CardTitle>
                    <CardDescription>Marketplaces onde <span className="font-bold">{selectedSellersNames}</span> mais perde.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                            <div className="h-64 flex items-center justify-center">
                            <Skeleton className="h-48 w-48 rounded-full" />
                            </div>
                    ) : charts.lossesByMarketplace.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={charts.lossesByMarketplace}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {charts.lossesByMarketplace.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_COMPETITORS[index % COLORS_COMPETITORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => [`${value} produto(s)`, "Derrotas em"]}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <Crown className="h-10 w-10 mb-2"/>
                            <p className="font-semibold">Nenhum Buybox perdido.</p>
                             <p className="text-sm">Parece que você está ganhando todos!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crown className="text-amber-500" />
                    Top 5 Vendedores no Buybox
                </CardTitle>
                <CardDescription>Vendedores que mais ganham o Buybox no geral.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                ) : topSellers.length > 0 ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Loja (Vendedor)</TableHead>
                            <TableHead className="text-right">Buyboxes Ganhos</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topSellers.map((seller, index) => (
                            <TableRow key={seller.name}>
                                <TableCell className="font-medium">{seller.name}</TableCell>
                                <TableCell className="text-right font-bold">{seller.count}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                       <p>Nenhum dado de vendedor para exibir.</p>
                    </div>
                )}
            </CardContent>
        </Card>


        {/* Ganhando Buybox */}
        <Card>
            <CardHeader>
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                            <CardTitle>Produtos Ganhando o Buybox ({buyboxData.winning.length})</CardTitle>
                            <CardDescription>Produtos onde <span className="font-bold">{selectedSellersNames}</span> tem o menor preço no marketplace.</CardDescription>
                        </div>
                    </div>
                    <Button onClick={() => handleExport(buyboxData.winning, 'ganhando_buybox')} size="sm" variant="outline" disabled={buyboxData.winning.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Lista
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[300px]">Produto</TableHead>
                                <TableHead>Sua Melhor Oferta</TableHead>
                                <TableHead>Próximo Concorrente</TableHead>
                                <TableHead>Diferença</TableHead>
                                <TableHead className="text-right">Última Verificação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {buyboxData.winning.map((item) => (
                                <TableRow key={`${item.ean}-winning-${item.myBestOffer?.marketplace}`}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Image src={isValidImageUrl(item.image) ? item.image : 'https://placehold.co/100x100.png'} alt={item.name} width={64} height={64} className="rounded-md object-cover border" />
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">EAN: {item.ean}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg text-primary">{formatCurrency(item.myBestOffer!.price)}</p>
                                             <Button asChild variant="ghost" size="icon" className="h-5 w-5" disabled={!isValidHttpUrl(item.myBestOffer!.url)}>
                                                <a href={item.myBestOffer!.url!} target="_blank" rel="noopener noreferrer" aria-label="Ver sua oferta">
                                                    <ExternalLink className="h-4 w-4"/>
                                                </a>
                                            </Button>
                                        </div>
                                         <p className="text-sm font-semibold">{item.myBestOffer!.seller}</p>
                                        <Badge variant="secondary">{item.myBestOffer!.marketplace}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {item.nextCompetitor ? (
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{formatCurrency(item.nextCompetitor.price)}</p>
                                                    <Button asChild variant="ghost" size="icon" className="h-5 w-5" disabled={!isValidHttpUrl(item.nextCompetitor.url)}>
                                                        <a href={item.nextCompetitor.url!} target="_blank" rel="noopener noreferrer" aria-label="Ver oferta do concorrente">
                                                            <ExternalLink className="h-4 w-4"/>
                                                        </a>
                                                    </Button>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{item.nextCompetitor.seller}</p>
                                                <Badge variant="outline">{item.nextCompetitor.marketplace}</Badge>
                                            </div>
                                        ) : <p className="text-muted-foreground">-</p>}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <p className={cn("font-semibold", item.priceDifference < 0 ? "text-green-600" : "text-muted-foreground")}>
                                                    {item.status === 'winning_alone' 
                                                        ? 'Ganhando (sozinho)'
                                                        : item.priceDifference < 0 
                                                            ? `Ganhando por ${formatCurrency(Math.abs(item.priceDifference))}` 
                                                            : 'Preço igual'}
                                                </p>
                                            </TooltipTrigger>
                                            {item.priceDifference < 0 && (
                                                <TooltipContent>
                                                    <div className="p-2 space-y-2">
                                                        <p className="font-bold text-center border-b pb-2">Potencial de Faturamento</p>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">10 Vendas:</span>
                                                            <span className="font-bold">{formatCurrency(Math.abs(item.priceDifference) * 10)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">50 Vendas:</span>
                                                            <span className="font-bold">{formatCurrency(Math.abs(item.priceDifference) * 50)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">100 Vendas:</span>
                                                            <span className="font-bold">{formatCurrency(Math.abs(item.priceDifference) * 100)}</span>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {item.myBestOffer?.updated_at ? formatDistanceToNow(new Date(item.myBestOffer.updated_at), { addSuffix: true, locale: ptBR }) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {buyboxData.winning.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum produto ganhando o Buybox com os filtros atuais.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        {/* Perdendo Buybox */}
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <div className="flex items-center gap-3">
                        <XCircle className="h-8 w-8 text-red-500" />
                        <div>
                            <CardTitle>Produtos Perdendo o Buybox ({buyboxData.losing.length})</CardTitle>
                            <CardDescription>Produtos onde <span className="font-bold">{selectedSellersNames}</span> tem um preço maior que o vencedor no marketplace.</CardDescription>
                        </div>
                    </div>
                     <Button onClick={() => handleExport(buyboxData.losing, 'perdendo_buybox')} size="sm" variant="outline" disabled={buyboxData.losing.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Lista
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                             <TableRow>
                                <TableHead className="min-w-[300px]">Produto</TableHead>
                                <TableHead>Sua Melhor Oferta</TableHead>
                                <TableHead>Vencedor do Marketplace</TableHead>
                                <TableHead>Diferença</TableHead>
                                <TableHead className="text-right">Última Verificação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {buyboxData.losing.map((item) => (
                                <TableRow key={`${item.ean}-losing-${item.myBestOffer?.marketplace}`}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Image src={isValidImageUrl(item.image) ? item.image : 'https://placehold.co/100x100.png'} alt={item.name} width={64} height={64} className="rounded-md object-cover border" />
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">EAN: {item.ean}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{formatCurrency(item.myBestOffer!.price)}</p>
                                            <Button asChild variant="ghost" size="icon" className="h-5 w-5" disabled={!isValidHttpUrl(item.myBestOffer!.url)}>
                                                <a href={item.myBestOffer!.url!} target="_blank" rel="noopener noreferrer" aria-label="Ver sua oferta">
                                                    <ExternalLink className="h-4 w-4"/>
                                                </a>
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{item.myBestOffer!.seller}</p>
                                        <Badge variant="outline">{item.myBestOffer!.marketplace}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-lg text-primary">{formatCurrency(item.winner.price)}</p>
                                                <Button asChild variant="ghost" size="icon" className="h-5 w-5" disabled={!isValidHttpUrl(item.winner.url)}>
                                                    <a href={item.winner.url!} target="_blank" rel="noopener noreferrer" aria-label="Ver oferta vencedora">
                                                        <ExternalLink className="h-4 w-4"/>
                                                    </a>
                                                </Button>
                                            </div>
                                            <p className="text-sm font-semibold">{item.winner.seller}</p>
                                            <Badge variant="secondary">{item.winner.marketplace}</Badge>
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                        <p className="font-semibold text-red-600">
                                            Perdendo por {formatCurrency(item.priceDifference)}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {item.winner?.updated_at ? formatDistanceToNow(new Date(item.winner.updated_at), { addSuffix: true, locale: ptBR }) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                             {buyboxData.losing.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum produto perdendo o Buybox com os filtros atuais.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
    </TooltipProvider>
  );
}

    

    

    




    

    