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
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return false;
        }
        // Check if the pathname ends with a common image extension, ignoring query params
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const pathname = url.pathname.toLowerCase();
        return imageExtensions.some(ext => pathname.endsWith(ext));
    } catch (_) {
        return false;
    }
}
