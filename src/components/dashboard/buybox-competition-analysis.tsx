
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, isValidImageUrl, isValidHttpUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { ExternalLink, CheckCircle, XCircle, Download, Trophy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


interface BuyboxCompetitionAnalysisProps {
  allProducts: Product[];
  loading: boolean;
}

interface BuyboxAnalysis {
    ean: string;
    name: string;
    brand: string | null;
    image: string;
    
    myOffer?: {
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
    
    status: 'winning' | 'losing' | 'no_offer';
    priceDifference: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

export function BuyboxCompetitionAnalysis({ allProducts, loading }: BuyboxCompetitionAnalysisProps) {
  const [selectedSeller, setSelectedSeller] = useState('');

  const uniqueSellers = useMemo(() => {
    const sellers = new Map<string, string>();
    allProducts.forEach(p => {
        if (p.key_loja && !sellers.has(p.key_loja)) {
            sellers.set(p.key_loja, p.seller);
        }
    });
    return Array.from(sellers.entries()).map(([key_loja, sellerName]) => ({ key_loja, sellerName })).sort((a,b) => a.sellerName.localeCompare(b.sellerName));
  }, [allProducts]);
  
  // Set default seller
  useState(() => {
    if (uniqueSellers.length > 0 && !selectedSeller) {
        // A simple heuristic to find a potential 'main' seller
        const hairpro = uniqueSellers.find(s => s.sellerName.toLowerCase().includes('hairpro'));
        setSelectedSeller(hairpro?.key_loja || uniqueSellers[0].key_loja);
    }
  })

  const { buyboxData, chartData } = useMemo(() => {
    if (!selectedSeller) return { buyboxData: { winning: [], losing: [] }, chartData: [] };
    
    const productsByEan = allProducts.reduce((acc, product) => {
      if (!product.ean) return acc;
      if (!acc[product.ean]) acc[product.ean] = [];
      acc[product.ean].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    const result: BuyboxAnalysis[] = [];

    for (const ean in productsByEan) {
        const products = productsByEan[ean];
        if (products.length === 0) continue;

        const sortedByPrice = [...products].sort((a, b) => a.price - b.price);
        const winner = sortedByPrice[0];
        const myOffer = products.find(p => p.key_loja === selectedSeller);
        const imageProduct = products.find(p => isValidImageUrl(p.image)) || products[0];

        let status: 'winning' | 'losing' | 'no_offer';
        let priceDifference = 0;
        let nextCompetitor: BuyboxAnalysis['nextCompetitor'] = undefined;

        if (!myOffer) {
            status = 'no_offer';
        } else if (myOffer.key_loja === winner.key_loja && myOffer.marketplace === winner.marketplace) {
            status = 'winning';
            if (sortedByPrice.length > 1) {
                const next = sortedByPrice[1];
                priceDifference = next.price - myOffer.price;
                nextCompetitor = { seller: next.seller, marketplace: next.marketplace, price: next.price, url: next.url };
            }
        } else {
            status = 'losing';
            priceDifference = myOffer.price - winner.price;
        }

        result.push({
            ean: ean,
            name: products[0].name,
            brand: products[0].brand,
            image: imageProduct.image || 'https://placehold.co/100x100.png',
            myOffer: myOffer ? {
                seller: myOffer.seller,
                marketplace: myOffer.marketplace,
                price: myOffer.price,
                url: myOffer.url,
                updated_at: myOffer.updated_at
            } : undefined,
            winner: {
                seller: winner.seller,
                marketplace: winner.marketplace,
                price: winner.price,
                url: winner.url,
                updated_at: winner.updated_at
            },
            nextCompetitor,
            status,
            priceDifference
        });
    }
    
    const winningData = result.filter(p => p.status === 'winning');
    
    const winsByMarketplace = winningData.reduce((acc, item) => {
        const marketplace = item.myOffer!.marketplace;
        acc[marketplace] = (acc[marketplace] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const newChartData = Object.entries(winsByMarketplace).map(([name, value]) => ({ name, value }));

    return {
        buyboxData: {
            winning: winningData.sort((a,b) => a.name.localeCompare(b.name)),
            losing: result.filter(p => p.status === 'losing').sort((a,b) => b.priceDifference - a.priceDifference),
        },
        chartData: newChartData,
    };
  }, [allProducts, selectedSeller]);

  const handleExport = (data: BuyboxAnalysis[], fileName: string) => {
    const worksheetData = data.map(item => {
        if (item.status === 'winning') {
            return {
                'Produto': item.name,
                'EAN': item.ean,
                'Seu Marketplace': item.myOffer?.marketplace,
                'Seu Preço': item.myOffer?.price,
                'URL da sua oferta': item.myOffer?.url,
                'Diferença': item.priceDifference > 0 ? `Ganhando por ${formatCurrency(item.priceDifference)}` : 'Ganhando',
                'Próximo Concorrente': item.nextCompetitor?.seller,
                'Marketplace Concorrente': item.nextCompetitor?.marketplace,
                'Preço Concorrente': item.nextCompetitor?.price,
                'URL Concorrente': item.nextCompetitor?.url,
                'Última Verificação': item.myOffer?.updated_at ? new Date(item.myOffer.updated_at).toLocaleString('pt-BR') : '',
            };
        } else { // losing
             return {
                'Produto': item.name,
                'EAN': item.ean,
                'Seu Marketplace': item.myOffer?.marketplace,
                'Seu Preço': item.myOffer?.price,
                'URL da sua oferta': item.myOffer?.url,
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

  const selectedSellerName = uniqueSellers.find(s => s.key_loja === selectedSeller)?.sellerName || '';

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Análise de Competição de Buybox</CardTitle>
                    <CardDescription>
                    Selecione seu vendedor para comparar seus preços com os vencedores do Buybox.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-sm">
                        <Select value={selectedSeller} onValueChange={setSelectedSeller} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um Vendedor de Referência" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueSellers.map(seller => (
                                    <SelectItem key={seller.key_loja} value={seller.key_loja}>{seller.sellerName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Buybox Ganhos por Marketplace</CardTitle>
                    <CardDescription>Distribuição de vitórias para <span className="font-bold">{selectedSellerName}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="h-64 flex items-center justify-center">
                            <Skeleton className="h-48 w-48 rounded-full" />
                         </div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} produto(s)`, "Vitórias"]}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            Nenhum Buybox ganho para este vendedor.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>


        {/* Ganhando Buybox */}
        <Card>
            <CardHeader>
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                            <CardTitle>Produtos Ganhando o Buybox ({buyboxData.winning.length})</CardTitle>
                            <CardDescription>Produtos onde <span className="font-bold">{selectedSellerName}</span> tem o menor preço.</CardDescription>
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
                                <TableHead>Sua Oferta</TableHead>
                                <TableHead>Próximo Concorrente</TableHead>
                                <TableHead>Diferença</TableHead>
                                <TableHead className="text-right">Última Verificação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {buyboxData.winning.map((item) => (
                                <TableRow key={item.ean}>
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
                                            <p className="font-bold text-lg text-primary">{formatCurrency(item.myOffer!.price)}</p>
                                             <Button asChild variant="ghost" size="icon" className="h-5 w-5" disabled={!isValidHttpUrl(item.myOffer!.url)}>
                                                <a href={item.myOffer!.url!} target="_blank" rel="noopener noreferrer" aria-label="Ver sua oferta">
                                                    <ExternalLink className="h-4 w-4"/>
                                                </a>
                                            </Button>
                                        </div>
                                        <Badge variant="secondary">{item.myOffer!.marketplace}</Badge>
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
                                        <p className="font-semibold text-green-600">
                                            {item.priceDifference > 0 ? `Ganhando por ${formatCurrency(item.priceDifference)}` : 'Preço igual'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {item.myOffer?.updated_at ? formatDistanceToNow(new Date(item.myOffer.updated_at), { addSuffix: true, locale: ptBR }) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {buyboxData.winning.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum produto ganhando o Buybox.</TableCell></TableRow>
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
                            <CardDescription>Produtos onde <span className="font-bold">{selectedSellerName}</span> tem um preço maior que o vencedor.</CardDescription>
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
                                <TableHead>Sua Oferta</TableHead>
                                <TableHead>Vencedor do Buybox</TableHead>
                                <TableHead>Diferença</TableHead>
                                <TableHead className="text-right">Última Verificação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {buyboxData.losing.map((item) => (
                                <TableRow key={item.ean}>
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
                                            <p className="font-semibold">{formatCurrency(item.myOffer!.price)}</p>
                                            <Button asChild variant="ghost" size="icon" className="h-5 w-5" disabled={!isValidHttpUrl(item.myOffer!.url)}>
                                                <a href={item.myOffer!.url!} target="_blank" rel="noopener noreferrer" aria-label="Ver sua oferta">
                                                    <ExternalLink className="h-4 w-4"/>
                                                </a>
                                            </Button>
                                        </div>
                                        <Badge variant="outline">{item.myOffer!.marketplace}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex items-center gap-2'>
                                            <Trophy className="h-5 w-5 text-amber-500" />
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
                                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum produto perdendo o Buybox.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
