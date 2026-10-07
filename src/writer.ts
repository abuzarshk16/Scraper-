import fs from 'node:fs';
import { CONFIG } from './config.js';
import { Carrier } from './types.js';

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

export class ResultWriter {
    private csv: fs.WriteStream;
    private jsonl: fs.WriteStream;
    private done: fs.WriteStream;
    private failed: fs.WriteStream;
    private count = 0;

    constructor() {
        fs.mkdirSync(CONFIG.outDir, { recursive: true });
        const fresh = !fs.existsSync(CONFIG.csvFile);
        this.csv = fs.createWriteStream(CONFIG.csvFile, { flags: 'a' });
        if (fresh) this.csv.write(COLUMNS.join(',') + '\n');
        this.jsonl = fs.createWriteStream(CONFIG.jsonlFile, { flags: 'a' });
        this.done = fs.createWriteStream(CONFIG.doneFile, { flags: 'a' });
        this.failed = fs.createWriteStream(CONFIG.failedFile, { flags: 'a' });
    }

    write(carrier: Carrier) {
        this.csv.write(COLUMNS.map(c => esc(carrier[c])).join(',') + '\n');
        this.jsonl.write(JSON.stringify(carrier) + '\n');
        this.done.write(carrier.dotNumber + '\n');
        this.count++;
    }

    markEmpty(dot: string) { this.done.write(dot + '\n'); }
    markFailed(dot: string) { this.failed.write(dot + '\n'); }
    get written() { return this.count; }
}