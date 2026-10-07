import fs from 'node:fs';
import path from 'node:path';
import pLimit from 'p-limit';
import { EventEmitter } from 'node:events';
import { CONFIG } from './config.js';
import { fetchJson, triggerCooldown } from './http.js';
import { mapToCarrier } from './parse.js';
import { ResultWriter } from './writer.js';
import { Carrier } from './types.js';

function generateRange(start: number, count: number): string[] {
    return Array.from({ length: count }, (_, i) => String(start + i));
}

export interface ScrapeLog {
    id: string;
    timestamp: string;
    level: 'info' | 'found' | 'empty' | 'retry' | 'cooldown' | 'error';
    dot?: string;
    message: string;
    carrier?: Carrier;
}

export interface ScraperStats {
    isRunning: boolean;
    isPaused: boolean;
    total: number;
    processed: number;
    ok: number;
    empty: number;
    failed: number;
    reqPerSec: number;
    etaMinutes: number;
    elapsedSeconds: number;
    startedAt: number | null;
    currentRange?: { start?: string; count?: number; type: 'range' | 'list' };
}

class ScraperService extends EventEmitter {
    private isRunning = false;
    private isPaused = false;
    private shouldStop = false;
    private stats: ScraperStats = {
        isRunning: false,
        isPaused: false,
        total: 0,
        processed: 0,
        ok: 0,
        empty: 0,
        failed: 0,
        reqPerSec: 0,
        etaMinutes: 0,
        elapsedSeconds: 0,
        startedAt: null,
    };

    private logs: ScrapeLog[] = [];
    private maxLogs = 300;
    private writer: ResultWriter | null = null;
    private activePromise: Promise<void> | null = null;
    private doneSet: Set<string> = new Set();
    private currentJobCarriers: Carrier[] = [];

    constructor() {
        super();
        this.loadDoneSet();
    }

    public getStatus(): ScraperStats {
        if (this.stats.startedAt && this.isRunning && !this.isPaused) {
            const elapsed = (Date.now() - this.stats.startedAt) / 1000;
            this.stats.elapsedSeconds = Math.round(elapsed);
            if (elapsed > 0 && this.stats.processed > 0) {
                this.stats.reqPerSec = Number((this.stats.processed / elapsed).toFixed(2));
                const remaining = this.stats.total - this.stats.processed;
                this.stats.etaMinutes = Number((remaining / Math.max(this.stats.reqPerSec, 0.01) / 60).toFixed(1));
            }
        }
        return { ...this.stats };
    }

    public getLogs(): ScrapeLog[] {
        return [...this.logs];
    }

    public getCurrentJobCarriers(): Carrier[] {
        return [...this.currentJobCarriers];
    }

    public loadDoneSet(): Set<string> {
        try {
            if (fs.existsSync(CONFIG.doneFile)) {
                const lines = fs.readFileSync(CONFIG.doneFile, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                this.doneSet = new Set(lines);
            } else {
                this.doneSet = new Set();
            }
        } catch {
            this.doneSet = new Set();
        }
        return this.doneSet;
    }

    public getDoneCount(): number {
        this.loadDoneSet();
        return this.doneSet.size;
    }

    public getFailedList(): string[] {
        try {
            if (fs.existsSync(CONFIG.failedFile)) {
                return fs.readFileSync(CONFIG.failedFile, 'utf8')
                    .split(/\r?\n/)
                    .map(l => l.trim())
                    .filter(Boolean);
            }
        } catch {}
        return [];
    }

    private log(level: ScrapeLog['level'], message: string, dot?: string, carrier?: Carrier) {
        const entry: ScrapeLog = {
            id: Math.random().toString(36).slice(2, 10),
            timestamp: new Date().toLocaleTimeString(),
            level,
            dot,
            message,
            carrier,
        };
        this.logs.unshift(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.length = this.maxLogs;
        }
        this.emit('log', entry);
        this.emit('stats', this.getStatus());
    }

    public async startJob(opts: {
        type: 'range' | 'list';
        start?: number;
        count?: number;
        dots?: string[];
        concurrency?: number;
        delayMs?: number;
    }) {
        if (this.isRunning) {
            throw new Error('A scrape job is already active. Stop or pause it first.');
        }

        let dotsToScrape: string[] = [];
        if (opts.type === 'range') {
            const start = opts.start ?? 1_000_000;
            const count = opts.count ?? 50;
            dotsToScrape = generateRange(start, count);
        } else {
            dotsToScrape = (opts.dots ?? []).map(d => String(d).trim()).filter(d => /^\d{3,9}$/.test(d));
        }

        if (dotsToScrape.length === 0) {
            throw new Error('No valid DOT numbers provided to scrape.');
        }

        this.loadDoneSet();
        const todo = dotsToScrape.filter(d => !this.doneSet.has(d));

        this.writer = new ResultWriter();
        this.currentJobCarriers = [];
        this.isRunning = true;
        this.isPaused = false;
        this.shouldStop = false;

        const concurrency = opts.concurrency ?? CONFIG.concurrency;
        const delayMs = opts.delayMs ?? CONFIG.requestDelayMs;

        this.stats = {
            isRunning: true,
            isPaused: false,
            total: dotsToScrape.length,
            processed: dotsToScrape.length - todo.length,
            ok: 0,
            empty: 0,
            failed: 0,
            reqPerSec: 0,
            etaMinutes: 0,
            elapsedSeconds: 0,
            startedAt: Date.now(),
            currentRange: {
                type: opts.type,
                start: String(opts.start ?? dotsToScrape[0]),
                count: dotsToScrape.length,
            },
        };

        this.log('info', `Starting scrape job: ${dotsToScrape.length} total DOTs (${dotsToScrape.length - todo.length} already done, ${todo.length} to scrape)`);

        this.activePromise = this.executeScrape(todo, concurrency, delayMs);
        return this.getStatus();
    }

    private async executeScrape(todo: string[], concurrency: number, delayMs: number) {
        const limit = pLimit(concurrency);
        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        try {
            const tasks = todo.map(dot => limit(async () => {
                if (this.shouldStop) return;

                while (this.isPaused) {
                    if (this.shouldStop) return;
                    await sleep(400);
                }

                if (delayMs > 0) {
                    await sleep(Math.random() * delayMs);
                }

                try {
                    let url = '';
                    let res: any = null;

                    if (/^\d{3,9}$/.test(dot)) {
                        url = new URL(`/api/carriers/${dot}`, CONFIG.baseUrl).toString();
                        res = await fetchJson(`/api/carriers/${dot}`);
                    }

                    if (!res || !res.ok || !res.data) {
                        url = new URL(CONFIG.endpoint.path, CONFIG.baseUrl).toString();
                        const queryParams = CONFIG.endpoint.method === 'GET'
                            ? { ...CONFIG.endpoint.extraQuery, [CONFIG.endpoint.queryParam]: dot }
                            : { ...CONFIG.endpoint.extraQuery };

                        const bodyParams = CONFIG.endpoint.method === 'POST'
                            ? { ...CONFIG.endpoint.extraBody, [CONFIG.endpoint.bodyParam]: dot }
                            : undefined;

                        res = await fetchJson(CONFIG.endpoint.path, {
                            query: queryParams,
                            body: bodyParams,
                        });
                    }

                    if (res.ok && res.data) {
                        const carrier = mapToCarrier(dot, res.data, url);
                        if (carrier) {
                            this.writer?.write(carrier);
                            this.doneSet.add(dot);
                            this.stats.ok++;
                            this.currentJobCarriers.unshift(carrier);
                            this.emit('carrier', carrier);
                            this.log('found', `[DOT ${dot}] ${carrier.legalName} | DOT: ${carrier.dotStatus} | MC: ${carrier.mcStatus || 'N/A'}`, dot, carrier);
                        } else {
                            this.stats.empty++;
                            this.writer?.markEmpty(dot);
                            this.doneSet.add(dot);
                            this.log('empty', `[DOT ${dot}] Empty / Inactive`, dot);
                        }
                    } else if (res.status === 404 || res.status === 400) {
                        this.stats.empty++;
                        this.writer?.markEmpty(dot);
                        this.doneSet.add(dot);
                        this.log('empty', `[DOT ${dot}] Not Found (${res.status})`, dot);
                    } else {
                        this.stats.failed++;
                        this.writer?.markFailed(dot);
                        this.log('retry', `[DOT ${dot}] HTTP ${res.status} — trigger cooldown`, dot);
                        triggerCooldown();
                    }
                } catch (err: any) {
                    this.stats.failed++;
                    this.writer?.markFailed(dot);
                    this.log('error', `[DOT ${dot}] Error: ${err?.message || err}`, dot);
                } finally {
                    this.stats.processed++;
                    this.emit('stats', this.getStatus());
                }
            }));

            await Promise.all(tasks);
            this.log('info', `Job completed! Scraped: ${this.stats.ok} carriers saved, ${this.stats.empty} empty, ${this.stats.failed} failed.`);
        } catch (err: any) {
            this.log('error', `Scrape runner error: ${err?.message || err}`);
        } finally {
            this.isRunning = false;
            this.isPaused = false;
            this.stats.isRunning = false;
            this.stats.isPaused = false;
            this.emit('stats', this.getStatus());
            this.emit('finished');
        }
    }

    public pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.stats.isPaused = true;
            this.log('info', 'Scraper paused.');
            this.emit('stats', this.getStatus());
        }
    }

    public resume() {
        if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.stats.isPaused = false;
            this.log('info', 'Scraper resumed.');
            this.emit('stats', this.getStatus());
        }
    }

    public stop() {
        if (this.isRunning) {
            this.shouldStop = true;
            this.isPaused = false;
            this.log('info', 'Stopping scraper… draining active requests.');
        }
    }

    public async lookupSingle(dot: string): Promise<{
        ok: boolean;
        status: number;
        carrier: Carrier | null;
        raw: unknown;
        durationMs: number;
        sourceUrl: string;
    }> {
        const start = Date.now();
        const cleanDot = dot.trim();
        let url = '';
        let res: any = null;

        if (/^\d{3,9}$/.test(cleanDot)) {
            url = new URL(`/api/carriers/${cleanDot}`, CONFIG.baseUrl).toString();
            res = await fetchJson(`/api/carriers/${cleanDot}`);
        }

        if (!res || !res.ok || !res.data) {
            url = new URL(CONFIG.endpoint.path, CONFIG.baseUrl).toString();
            const queryParams = CONFIG.endpoint.method === 'GET'
                ? { ...CONFIG.endpoint.extraQuery, [CONFIG.endpoint.queryParam]: cleanDot }
                : { ...CONFIG.endpoint.extraQuery };

            const bodyParams = CONFIG.endpoint.method === 'POST'
                ? { ...CONFIG.endpoint.extraBody, [CONFIG.endpoint.bodyParam]: cleanDot }
                : undefined;

            res = await fetchJson(CONFIG.endpoint.path, {
                query: queryParams,
                body: bodyParams,
            });
        }

        const durationMs = Date.now() - start;
        const carrier = res.ok && res.data ? mapToCarrier(cleanDot, res.data, url) : null;

        return {
            ok: res.ok,
            status: res.status,
            carrier,
            raw: res.data ?? res.text,
            durationMs,
            sourceUrl: url,
        };
    }
}

export const scraperService = new ScraperService();
