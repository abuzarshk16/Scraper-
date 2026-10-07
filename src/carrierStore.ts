import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.js';
import { Carrier } from './types.js';

export class CarrierStore {
    public static getCarriers(query?: { search?: string; state?: string; page?: number; limit?: number }): {
        carriers: Carrier[];
        total: number;
        page: number;
        limit: number;
        states: string[];
    } {
        let carriers: Carrier[] = [];

        // Prefer jsonl if available, fallback to csv
        if (fs.existsSync(CONFIG.jsonlFile)) {
            try {
                const content = fs.readFileSync(CONFIG.jsonlFile, 'utf8');
                const lines = content.split(/\r?\n/).filter(Boolean);
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed && parsed.dotNumber) {
                            carriers.push(parsed);
                        }
                    } catch {}
                }
            } catch {}
        } else if (fs.existsSync(CONFIG.csvFile)) {
            try {
                const content = fs.readFileSync(CONFIG.csvFile, 'utf8');
                const lines = content.split(/\r?\n/).filter(Boolean);
                if (lines.length > 1) {
                    const headers = lines[0].split(',');
                    for (let i = 1; i < lines.length; i++) {
                        const row = this.parseCsvLine(lines[i]);
                        if (row.length >= headers.length) {
                            const obj: any = {};
                            headers.forEach((h, idx) => { obj[h] = row[idx] ?? ''; });
                            carriers.push(obj as Carrier);
                        }
                    }
                }
            } catch {}
        }

        // Deduplicate by dotNumber (keep latest)
        const map = new Map<string, Carrier>();
        for (const c of carriers) {
            map.set(c.dotNumber, c);
        }
        carriers = Array.from(map.values()).reverse();

        // Extract all unique US states
        const states = Array.from(new Set(carriers.map(c => c.state).filter(Boolean))).sort();

        // Filter
        if (query?.state) {
            const st = query.state.toUpperCase().trim();
            carriers = carriers.filter(c => c.state?.toUpperCase() === st);
        }

        if (query?.search) {
            const term = query.search.toLowerCase().trim();
            carriers = carriers.filter(c =>
                c.dotNumber?.toLowerCase().includes(term) ||
                c.legalName?.toLowerCase().includes(term) ||
                c.dbaName?.toLowerCase().includes(term) ||
                c.mcNumber?.toLowerCase().includes(term) ||
                c.city?.toLowerCase().includes(term) ||
                c.physicalAddress?.toLowerCase().includes(term)
            );
        }

        const total = carriers.length;
        const page = Math.max(1, query?.page ?? 1);
        const limit = Math.max(1, Math.min(100, query?.limit ?? 25));
        const startIndex = (page - 1) * limit;
        const paginated = carriers.slice(startIndex, startIndex + limit);

        return {
            carriers: paginated,
            total,
            page,
            limit,
            states,
        };
    }

    public static saveCarrier(carrier: Carrier): boolean {
        fs.mkdirSync(CONFIG.outDir, { recursive: true });

        // Check if already in jsonl
        const existing = this.getCarrierByDot(carrier.dotNumber);
        if (existing) return false;

        const COLUMNS: (keyof Carrier)[] = [
            'dotNumber', 'legalName', 'dbaName', 'mcNumber', 'dotStatus', 'mcStatus',
            'status', 'operatingAuthorityType', 'entityType', 'phone', 'email',
            'officerName', 'officerTitle', 'officerPhone', 'officerEmail',
            'physicalAddress', 'city', 'state', 'zip', 'mailingAddress',
            'powerUnits', 'drivers', 'mcs150Date', 'mcs150Mileage', 'businessType',
            'outOfService', 'sourceUrl',
        ];

        const esc = (v: unknown) => {
            const s = v === undefined || v === null ? '' : String(v);
            return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };

        const freshCsv = !fs.existsSync(CONFIG.csvFile);
        if (freshCsv) {
            fs.writeFileSync(CONFIG.csvFile, COLUMNS.join(',') + '\n', 'utf8');
        }

        fs.appendFileSync(CONFIG.csvFile, COLUMNS.map(c => esc(carrier[c])).join(',') + '\n', 'utf8');
        fs.appendFileSync(CONFIG.jsonlFile, JSON.stringify(carrier) + '\n', 'utf8');
        fs.appendFileSync(CONFIG.doneFile, carrier.dotNumber + '\n', 'utf8');
        return true;
    }

    public static getCarrierByDot(dot: string): Carrier | null {
        if (!fs.existsSync(CONFIG.jsonlFile)) return null;
        try {
            const content = fs.readFileSync(CONFIG.jsonlFile, 'utf8');
            const lines = content.split(/\r?\n/).filter(Boolean);
            for (let i = lines.length - 1; i >= 0; i--) {
                const parsed = JSON.parse(lines[i]);
                if (parsed && String(parsed.dotNumber) === String(dot)) {
                    return parsed;
                }
            }
        } catch {}
        return null;
    }

    public static clearAllData(): void {
        fs.mkdirSync(CONFIG.outDir, { recursive: true });
        const COLUMNS = [
            'dotNumber', 'legalName', 'dbaName', 'mcNumber', 'dotStatus', 'mcStatus',
            'status', 'operatingAuthorityType', 'entityType', 'phone', 'email',
            'officerName', 'officerTitle', 'officerPhone', 'officerEmail',
            'physicalAddress', 'city', 'state', 'zip', 'mailingAddress',
            'powerUnits', 'drivers', 'mcs150Date', 'mcs150Mileage', 'businessType',
            'outOfService', 'sourceUrl',
        ];
        fs.writeFileSync(CONFIG.csvFile, COLUMNS.join(',') + '\n', 'utf8');
        fs.writeFileSync(CONFIG.jsonlFile, '', 'utf8');
        fs.writeFileSync(CONFIG.doneFile, '', 'utf8');
        fs.writeFileSync(CONFIG.failedFile, '', 'utf8');
    }

    public static clearFailed(): void {
        fs.writeFileSync(CONFIG.failedFile, '', 'utf8');
    }

    public static clearDone(): void {
        fs.writeFileSync(CONFIG.doneFile, '', 'utf8');
    }

    private static parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c === ',' && !inQuotes) {
                result.push(cur);
                cur = '';
            } else {
                cur += c;
            }
        }
        result.push(cur);
        return result;
    }
}
