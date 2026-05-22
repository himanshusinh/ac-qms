import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a random unique ID */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Current ISO timestamp */
export function now(): string {
  return new Date().toISOString();
}

/** Format date as dd-MMM-yyyy */
export function fmtDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd-MMM-yyyy');
  } catch {
    return dateStr;
  }
}

/** Format datetime as dd-MMM-yyyy HH:mm */
export function fmtDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd-MMM-yyyy HH:mm');
  } catch {
    return dateStr;
  }
}

/** Generate document number like SPEC/GLC/B-2026-001 */
export function generateDocNo(docType: string, productCode: string, batchNo: string): string {
  return `${docType}/${productCode}/${batchNo}`;
}
