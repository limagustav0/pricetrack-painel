
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
import { Switch } from '../ui/switch';

interface UrlManagementTableProps {
  urls: UrlInfo[];
  setUrls: React.Dispatch<React.SetStateAction<UrlInfo[]>>;
  loading: boolean;
}

export function UrlManagementTable({ urls, setUrls, loading }: UrlManagementTableProps) {
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

  const handleToggle = async (eanKey: string, currentStatus: boolean) => {
    const originalUrls = [...urls];
    const newStatus = !currentStatus;

    // Optimistic update
    setUrls(prevUrls =>
      prevUrls.map(url =>
        url.ean_key === eanKey ? { ...url, is_active: newStatus } : url
      )
    );

    try {
      const response = await fetch('/api/urls/update_is_active', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ ean_key: eanKey, is_active: newStatus }]),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Falha ao atualizar o status. Status: ${response.status}`);
      }

      toast({
        title: 'Status atualizado!',
        description: `A URL foi marcada como ${newStatus ? 'ativa' : 'inativa'}.`,
      });
    } catch (error) {
      // Revert on error
      setUrls(originalUrls);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Não foi possível alterar o status da URL.',
      });
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUrls.length > 0 ? (
                filteredUrls.map((item) => (
                  <TableRow key={item.ean_key}>
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
                    <TableCell>
                        <Badge variant={item.is_active ? 'default' : 'outline'} className={item.is_active ? 'bg-green-500' : ''}>
                            {item.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                            <Switch
                                checked={item.is_active}
                                onCheckedChange={() => handleToggle(item.ean_key, item.is_active)}
                                aria-label={`Ativar ou desativar URL para ${item.ean}`}
                            />
                            <Button asChild variant="ghost" size="icon" disabled={!isValidHttpUrl(item.url)}>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir link">
                                <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
