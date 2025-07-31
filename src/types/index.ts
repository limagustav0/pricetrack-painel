export interface Product {
  // Keeping some of the old fields for compatibility, but adapting to the new structure
  id: string; // Using sku as id
  ean: string;
  name: string; // from 'descricao'
  brand: string | null; // Brand is not available in the new structure
  marketplace: string;
  seller: string; // from 'loja'
  key_loja: string | null;
  price: number; // from 'preco_final'
  url: string | null;
  image: string | null; // from 'imagem'
  updated_at: string; // from 'data_hora'
  change_price: number | null;
}

export interface PriceChange {
    id: number;
    ean: string;
    descricao: string;
    loja: string;
    key_loja: string;
    marketplace: string;
    preco_antigo: number;
    preco_novo: number;
    data_mudanca_timestamp: number | null;
}
