import fs from 'node:fs';

/** Sequential DOT range — USDOT numbers are issued roughly in order, with gaps. */
export function generateRange(start: number, count: number): string[] {
    return Array.from({ length: count }, (_, i) => String(start + i));
}

/** Lead list file: one DOT per line, or a CSV (first column is used). */
export function loadFromFile(file: string): string[] {
    return fs.readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .map(l => l.trim().split(',')[0].replace(/^"|"$/g, ''))
        .filter(l => /^\d{3,9}$/.test(l));
}