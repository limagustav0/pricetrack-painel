
"use client";

import type { UrlInfo } from '@/types';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useToast } from "@/hooks/use-toast";
import { cn, isValidHttpUrl } from '@/lib/utils';

interface UrlManagementTableProps {
  urls: UrlInfo[];
  loading: boolean;
}

export function UrlManagementTable({ urls, loading }: UrlManagementTableProps) {
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedEan, setCopiedEan] = useState<string | null>(null);

  const filteredUrls = useMemo(() => {
    if (!filter) return urls;
    return urls.filter(
      (url) =>
        url.ean.toLowerCase().includes(filter.toLowerCase()) ||
        url.marketplace.toLowerCase().includes(filter.toLowerCase()) ||
        url.url.toLowerCase().includes(filter.toLowerCase())
    );
  }, [urls, filter]);

  const handleCopy = (text: string, type: 'url' | 'ean') => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type === 'url' ? 'URL Copiada' : 'EAN Copiado'}!`,
      description: `O ${type === 'url' ? 'link' : 'EAN'} foi copiado para a área de transferência.`,
    });
    if (type === 'url') {
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    } else {
      setCopiedEan(text);
      setTimeout(() => setCopiedEan(null), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full md:w-1/3" />
            <div className="border rounded-lg p-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2 border-b">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Gerenciamento de URLs</CardTitle>
        <CardDescription>
          Visualize e gerencie todas as URLs de produtos cadastradas no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="mb-4">
          <Input
            placeholder="Filtrar por EAN, Marketplace ou URL..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="relative overflow-auto border rounded-lg flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>EAN</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUrls.length > 0 ? (
                filteredUrls.map((item, index) => (
                  <TableRow key={`${item.ean}-${item.marketplace}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.ean}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(item.ean, 'ean')}
                        >
                          {copiedEan === item.ean ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.marketplace}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "truncate hover:underline max-w-xs",
                            !isValidHttpUrl(item.url) && "text-destructive"
                          )}
                          title={item.url}
                        >
                          {item.url}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(item.url, 'url')}
                        >
                          {copiedUrl === item.url ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon" disabled={!isValidHttpUrl(item.url)}>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir link">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhuma URL encontrada com os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
