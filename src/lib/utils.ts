import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWhatsAppNumber(phone: string | null | undefined, fallback = '5511999887766'): string {
  if (!phone) return fallback;

  let cleaned = phone.replace(/\D/g, '');

  // Add Brazil country code (55) if not present
  if (cleaned.length === 11 || cleaned.length === 10) {
    cleaned = '55' + cleaned;
  }

  return cleaned || fallback;
}

export function buildWhatsAppUrl({
  phone,
  message,
  fallback,
}: {
  phone: string | null | undefined;
  message?: string;
  fallback?: string;
}): string {
  const formatted = formatWhatsAppNumber(phone, fallback);
  const base = 'https://web.whatsapp.com/send';
  const params = new URLSearchParams({ phone: formatted });
  if (message) params.set('text', message);
  return `${base}?${params.toString()}`;
}
