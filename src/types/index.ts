export interface Product {
  id: number;
  ean: string;
  name: string;
  brand: string;
  marketplace: string;
  seller: string;
  price: number;
  url: string;
  image: string;
  updated_at: string; // ISO date string
}
