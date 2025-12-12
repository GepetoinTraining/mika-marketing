// lib/utils/convert.ts
// Utilities for converting DB values to usable types
// Drizzle returns decimals as strings and dates as ISO strings

/**
 * Convert decimal string or number to number
 * Handles null, undefined, and string representations from Postgres decimals
 */
export function toNumber(val: number | string | null | undefined): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    return val;
}

/**
 * Convert ISO string or Date to Date object
 * Returns null if invalid or missing
 */
export function toDate(val: string | Date | null | undefined): Date | null {
    if (val === null || val === undefined) return null;
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Convert ISO string or Date to Date object
 * Returns current date if invalid or missing (for required fields)
 */
export function toDateRequired(val: string | Date | null | undefined): Date {
    const date = toDate(val);
    return date ?? new Date();
}

/**
 * Format a date for display in pt-BR locale
 */
export function formatDate(
    val: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }
): string {
    const date = toDate(val);
    if (!date) return '—';
    return date.toLocaleDateString('pt-BR', options);
}

/**
 * Format a date with time for display in pt-BR locale
 */
export function formatDateTime(val: string | Date | null | undefined): string {
    const date = toDate(val);
    if (!date) return '—';
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format currency in BRL
 */
export function formatCurrency(val: number | string | null | undefined): string {
    const num = toNumber(val);
    return 'R$ ' + num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Format large numbers with k/M suffix
 */
export function formatCompact(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
    return n.toString();
}

/**
 * Format percentage
 */
export function formatPercent(n: number, decimals = 1): string {
    return n.toFixed(decimals) + '%';
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}