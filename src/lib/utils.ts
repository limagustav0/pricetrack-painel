import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function isValidImageUrl(string: string | null | undefined): boolean {
    if (!string) return false;
    try {
        const url = new URL(string);
        // Must be http or https
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return false;
        }

        // Create a new URL object without the search parameters to isolate the pathname
        const pathUrl = new URL(string);
        pathUrl.search = '';
        const pathname = pathUrl.pathname.toLowerCase();

        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

        // Check if the pathname (without query params) ends with a common image extension
        const hasExtension = imageExtensions.some(ext => pathname.endsWith(ext));

        if (hasExtension) {
            return true;
        }

        // If no extension, as a fallback, we can assume it might be a valid image endpoint
        // as long as it's a valid URL. This is less strict but covers more cases.
        // We avoid checking content-type here to prevent client-side fetches.
        // So if it's a valid http/https url, we'll try to render it.
        return true;

    } catch (_) {
        // If new URL() fails, it's not a valid URL
        return false;
    }
}