import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from './config.js';
import { scraperService } from './scraperService.js';
import { CarrierStore } from './carrierStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
};

// Connected SSE clients
const sseClients = new Set<http.ServerResponse>();

scraperService.on('log', (log) => {
    const payload = `event: log\ndata: ${JSON.stringify(log)}\n\n`;
    for (const client of sseClients) {
        client.write(payload);
    }
});

scraperService.on('stats', (stats) => {
    const payload = `event: stats\ndata: ${JSON.stringify(stats)}\n\n`;
    for (const client of sseClients) {
        client.write(payload);
    }
});

scraperService.on('carrier', (carrier) => {
    const payload = `event: carrier\ndata: ${JSON.stringify(carrier)}\n\n`;
    for (const client of sseClients) {
        client.write(payload);
    }
});

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(data));
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): boolean {
    let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);

    // Guard against directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return true;
    }

    if (!fs.existsSync(filePath)) {
        return false;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        if (!fs.existsSync(filePath)) return false;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return true;
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    // 1. SSE Stream: /api/scrape/stream
    if (pathname === '/api/scrape/stream' && req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        sseClients.add(res);

        // Send initial state & recent logs
        const initial = {
            stats: scraperService.getStatus(),
            logs: scraperService.getLogs().slice(0, 50),
        };
        res.write(`event: init\ndata: ${JSON.stringify(initial)}\n\n`);

        const keepAlive = setInterval(() => {
            res.write(':keepalive\n\n');
        }, 15000);

        req.on('close', () => {
            clearInterval(keepAlive);
            sseClients.delete(res);
        });
        return;
    }

    // 2. REST API endpoints
    try {
        if (pathname === '/api/status' && req.method === 'GET') {
            const all = CarrierStore.getCarriers({ limit: 1 });
            return sendJson(res, 200, {
                scraper: scraperService.getStatus(),
                totalCarriers: all.total,
                doneCount: scraperService.getDoneCount(),
                failedCount: scraperService.getFailedList().length,
            });
        }

        if (pathname === '/api/config' && req.method === 'GET') {
            return sendJson(res, 200, CONFIG);
        }

        if (pathname === '/api/config' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            if (body.baseUrl) CONFIG.baseUrl = String(body.baseUrl).trim();
            if (body.concurrency) CONFIG.concurrency = Math.max(1, Math.min(64, Number(body.concurrency)));
            if (body.requestDelayMs !== undefined) CONFIG.requestDelayMs = Math.max(0, Number(body.requestDelayMs));
            if (body.timeoutMs) CONFIG.timeoutMs = Number(body.timeoutMs);
            if (body.endpoint) {
                if (body.endpoint.path) CONFIG.endpoint.path = String(body.endpoint.path).trim();
                if (body.endpoint.method) CONFIG.endpoint.method = body.endpoint.method;
                if (body.endpoint.queryParam) CONFIG.endpoint.queryParam = String(body.endpoint.queryParam).trim();
                if (body.endpoint.bodyParam) CONFIG.endpoint.bodyParam = String(body.endpoint.bodyParam).trim();
                if (body.endpoint.bodyMode) CONFIG.endpoint.bodyMode = body.endpoint.bodyMode;
            }
            if (body.staticHeaders && typeof body.staticHeaders === 'object') {
                CONFIG.staticHeaders = { ...CONFIG.staticHeaders, ...body.staticHeaders };
            }
            return sendJson(res, 200, { success: true, config: CONFIG });
        }

        if (pathname === '/api/config/reset' && req.method === 'POST') {
            CONFIG.baseUrl = 'https://motus.dot.gov';
            CONFIG.endpoint.path = '/api/carriers/search';
            CONFIG.endpoint.method = 'GET';
            CONFIG.endpoint.queryParam = 'query';
            CONFIG.endpoint.bodyParam = 'dotNumber';
            CONFIG.endpoint.bodyMode = 'json';
            CONFIG.endpoint.extraQuery = { limit: '25' };
            CONFIG.concurrency = 8;
            CONFIG.requestDelayMs = 0;
            return sendJson(res, 200, { success: true, config: CONFIG });
        }

        // Single Live Lookup
        if (pathname === '/api/lookup' && req.method === 'GET') {
            const dot = url.searchParams.get('dot') || url.searchParams.get('query');
            if (!dot) {
                return sendJson(res, 400, { error: 'Missing "dot" or "query" parameter' });
            }
            const result = await scraperService.lookupSingle(dot);
            return sendJson(res, 200, result);
        }

        // Multi Live Lookup
        if (pathname === '/api/lookup/multi' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const dots: string[] = (body.dots || []).map((d: any) => String(d).trim()).filter(Boolean);
            if (dots.length === 0) {
                return sendJson(res, 400, { error: 'No DOT numbers provided' });
            }
            const results = await Promise.all(dots.slice(0, 20).map(d => scraperService.lookupSingle(d)));
            return sendJson(res, 200, { results });
        }

        // Scraper Controls
        if (pathname === '/api/scrape/start' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const status = await scraperService.startJob({
                type: body.type ?? 'range',
                start: body.start ? Number(body.start) : undefined,
                count: body.count ? Number(body.count) : undefined,
                dots: body.dots,
                concurrency: body.concurrency ? Number(body.concurrency) : undefined,
                delayMs: body.delayMs !== undefined ? Number(body.delayMs) : undefined,
            });
            return sendJson(res, 200, { success: true, status });
        }

        if (pathname === '/api/scrape/pause' && req.method === 'POST') {
            scraperService.pause();
            return sendJson(res, 200, { success: true, status: scraperService.getStatus() });
        }

        if (pathname === '/api/scrape/resume' && req.method === 'POST') {
            scraperService.resume();
            return sendJson(res, 200, { success: true, status: scraperService.getStatus() });
        }

        if (pathname === '/api/scrape/stop' && req.method === 'POST') {
            scraperService.stop();
            return sendJson(res, 200, { success: true, status: scraperService.getStatus() });
        }

        // Sample CSV for testing
        if (pathname === '/api/sample-csv' && req.method === 'GET') {
            const sampleCsv = `USDOT,Company Name,State,Notes
1000000,James Killingsworth,AL,Sample lead 1
1000001,K W Trucking Inc,GA,Sample lead 2
1000002,Carrier Two,NC,Sample lead 3
3000000,Robco Enterprises,TN,Sample lead 4
2500000,Carrier Five,TX,Sample lead 5
1234567,Carrier Six,FL,Sample lead 6
500000,Carrier Seven,OH,Sample lead 7
2000000,Carrier Eight,CA,Sample lead 8
1500000,Carrier Nine,IL,Sample lead 9
3100000,Carrier Ten,PA,Sample lead 10
`;
            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="sample_leads.csv"',
            });
            return res.end(sampleCsv);
        }

        // Parse Uploaded CSV
        if (pathname === '/api/parse-csv' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            const content = String(body.content || '').trim();
            if (!content) {
                return sendJson(res, 400, { error: 'Empty CSV content provided.' });
            }

            const lines = content.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
            if (lines.length === 0) {
                return sendJson(res, 400, { error: 'No data rows found in CSV.' });
            }

            const parseRow = (line: string): string[] => {
                const res: string[] = [];
                let cur = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const c = line[i];
                    if (c === '"') {
                        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
                        else inQuotes = !inQuotes;
                    } else if (c === ',' && !inQuotes) {
                        res.push(cur.trim());
                        cur = '';
                    } else {
                        cur += c;
                    }
                }
                res.push(cur.trim());
                return res;
            };

            const headerRow = parseRow(lines[0]);
            let hasHeader = true;
            let dotColIdx = headerRow.findIndex(h => /dot|usdot|carrier/i.test(h));

            if (dotColIdx === -1) {
                const firstRowHasNum = headerRow.some(val => /^\d{3,9}$/.test(val));
                if (firstRowHasNum) {
                    hasHeader = false;
                    dotColIdx = headerRow.findIndex(val => /^\d{3,9}$/.test(val));
                }
            }

            if (dotColIdx === -1 && lines.length > 1) {
                const row1 = parseRow(lines[1]);
                dotColIdx = row1.findIndex(val => /^\d{3,9}$/.test(val));
            }

            if (dotColIdx === -1) dotColIdx = 0;

            const dataLines = hasHeader ? lines.slice(1) : lines;
            const previewRows: string[][] = [];
            const dots: string[] = [];

            for (let i = 0; i < dataLines.length; i++) {
                const row = parseRow(dataLines[i]);
                if (i < 8) previewRows.push(row);
                const dotVal = row[dotColIdx]?.replace(/\D/g, '');
                if (dotVal && /^\d{3,9}$/.test(dotVal)) {
                    dots.push(dotVal);
                }
            }

            const uniqueDots = Array.from(new Set(dots));

            return sendJson(res, 200, {
                success: true,
                headers: hasHeader ? headerRow : headerRow.map((_, i) => `Column ${i + 1}`),
                dotColumnIndex: dotColIdx,
                dotColumnName: hasHeader ? headerRow[dotColIdx] : `Column ${dotColIdx + 1}`,
                totalRows: dataLines.length,
                totalDotsFound: uniqueDots.length,
                previewRows,
                dots: uniqueDots,
            });
        }

        // Current Scrape Job Carriers
        if (pathname === '/api/scrape/current-carriers' && req.method === 'GET') {
            return sendJson(res, 200, {
                carriers: scraperService.getCurrentJobCarriers(),
                stats: scraperService.getStatus(),
            });
        }

        // Carriers Database
        if (pathname === '/api/carriers' && req.method === 'GET') {
            const search = url.searchParams.get('search') || undefined;
            const state = url.searchParams.get('state') || undefined;
            const page = Number(url.searchParams.get('page') || 1);
            const limit = Number(url.searchParams.get('limit') || 25);
            const data = CarrierStore.getCarriers({ search, state, page, limit });
            return sendJson(res, 200, data);
        }

        if (pathname === '/api/carriers/save' && req.method === 'POST') {
            const body = await parseJsonBody(req);
            if (!body || !body.dotNumber) {
                return sendJson(res, 400, { error: 'Invalid carrier payload' });
            }
            const saved = CarrierStore.saveCarrier(body);
            return sendJson(res, 200, { success: true, saved });
        }

        // Failed List & Retry
        if (pathname === '/api/failed' && req.method === 'GET') {
            const failed = scraperService.getFailedList();
            return sendJson(res, 200, { failed, count: failed.length });
        }

        if (pathname === '/api/failed/retry' && req.method === 'POST') {
            const failed = scraperService.getFailedList();
            if (failed.length === 0) {
                return sendJson(res, 400, { error: 'No failed DOTs to retry.' });
            }
            const status = await scraperService.startJob({
                type: 'list',
                dots: failed,
            });
            CarrierStore.clearFailed();
            return sendJson(res, 200, { success: true, status, retriedCount: failed.length });
        }

        // Export endpoints
        if (pathname === '/api/export/csv' && req.method === 'GET') {
            if (!fs.existsSync(CONFIG.csvFile)) {
                return sendJson(res, 404, { error: 'CSV file not found yet.' });
            }
            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="carriers.csv"',
            });
            return fs.createReadStream(CONFIG.csvFile).pipe(res);
        }

        if (pathname === '/api/export/json' && req.method === 'GET') {
            const data = CarrierStore.getCarriers({ limit: 100000 });
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': 'attachment; filename="carriers.json"',
            });
            return res.end(JSON.stringify(data.carriers, null, 2));
        }

        // Clear Data
        if ((pathname === '/api/data/reset' || pathname === '/api/data/clear') && req.method === 'POST') {
            CarrierStore.clearAllData();
            scraperService.loadDoneSet();
            return sendJson(res, 200, { success: true, message: 'All scraped records and history reset.' });
        }

    } catch (err: any) {
        console.error('API Error:', err);
        return sendJson(res, 500, { error: err?.message || 'Internal Server Error' });
    }

    // 3. Static asset serving
    if (serveStatic(req, res, pathname)) {
        return;
    }

    // 4. Fallback to index.html for SPA routes
    if (serveStatic(req, res, '/index.html')) {
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

const DEFAULT_PORT = Number(process.env.PORT || 3000);

function startServer(port: number) {
    server.listen(port, () => {
        console.log(`\n========================================================`);
        console.log(`🚀 USDOT / MOTUS Carrier Scraper Dashboard Ready!`);
        console.log(`📡 Local UI:    http://localhost:${port}`);
        console.log(`🎯 API Status:  http://localhost:${port}/api/status`);
        console.log(`========================================================\n`);
    });

    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(DEFAULT_PORT);
