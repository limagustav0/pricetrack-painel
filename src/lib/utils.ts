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
        return true;
    } catch (_) {
        return false;
    }
}

export function isValidHttpUrl(str: string | null | undefined): boolean {
    if (typeof str !== 'string' || !str) {
        return false;
    }
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}
