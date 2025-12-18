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

/**
 * Normaliza descrições que tenham itens com "✓" na mesma linha, quebrando em linhas separadas.
 * Ex: "✓ item 1 ✓ item 2" => "✓ item 1\n\n✓ item 2"
 */
export function normalizePropertyDescription(description: string): string {
  const text = (description ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const inputLines = text.split('\n');
  const outputLines: string[] = [];

  for (const rawLine of inputLines) {
    const line = rawLine.trim();
    if (!line) {
      outputLines.push('');
      continue;
    }

    const items = line.match(/[✓✔]\s*[^✓✔]+/g);

    if (items && items.length > 1) {
      // Place each item on its own line, separated by a blank line
      items.forEach((it, idx) => {
        outputLines.push(it.trim());
        if (idx < items.length - 1) outputLines.push('');
      });
      continue;
    }

    outputLines.push(line);
  }

  return outputLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

