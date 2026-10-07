import fs from 'node:fs';
import pLimit from 'p-limit';
import { CONFIG } from './config.js';
import { fetchJson, triggerCooldown } from './http.js';
import { mapToCarrier } from './parse.js';
import { ResultWriter } from './writer.js';
import { generateRange, loadFromFile } from './dotNumbers.js';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function loadDone(): Promise<Set<string>> {
    if (!fs.existsSync(CONFIG.doneFile)) return new Set();
    return new Set(fs.readFileSync(CONFIG.doneFile, 'utf8').split(/\r?\n/).filter(Boolean));
}

async function main() {
    // 1. Work list — either a lead file (arg) or a generated DOT range
    const argFile = process.argv[2];
    const dots = argFile ? loadFromFile(argFile) : generateRange(1_000_000, 10_000);

    const done = await loadDone();
    const todo = dots.filter(d => !done.has(d));
    const writer = new ResultWriter();

    let ok = 0, empty = 0, failed = 0, processed = 0;
    const started = Date.now();
    console.log(`total ${dots.length} | already done ${done.size} | to scrape ${todo.length}`);

    // 2. Graceful shutdown — Ctrl-C finishes in-flight requests; done.txt = free resume
    let shuttingDown = false;
    process.on('SIGINT', () => {
        shuttingDown = true;
        console.log('\n[main] draining in-flight requests… run again to resume');
    });

    // 3. Worker pool
    const limit = pLimit(CONFIG.concurrency);

    const tasks = todo.map(dot => limit(async () => {
        if (shuttingDown) return;
        if (CONFIG.requestDelayMs) await sleep(Math.random() * CONFIG.requestDelayMs);

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
                if (carrier) { writer.write(carrier); ok++; }
                else { empty++; writer.markEmpty(dot); }
            } else if (res.status === 404 || res.status === 400) {
                empty++; writer.markEmpty(dot);
            } else {
                failed++; writer.markFailed(dot);
                triggerCooldown();
            }
        } catch (err) {
            failed++; writer.markFailed(dot);
            console.error(`[dot ${dot}] ${err instanceof Error ? err.message : err}`);
        } finally {
            processed++;
            if (processed % 100 === 0 || processed === todo.length) {
                const secs = (Date.now() - started) / 1000;
                const rate = processed / secs;
                const etaMin = (todo.length - processed) / Math.max(rate, 0.01) / 60;
                console.log(
                    `${processed}/${todo.length} | ok ${ok} · empty ${empty} · failed ${failed} | ` +
                    `${rate.toFixed(2)} req/s | ETA ${etaMin.toFixed(1)} min`
                );
            }
        }
    }));

    await Promise.all(tasks);
    console.log(`\nDone — ${writer.written} carriers → ${CONFIG.csvFile}`);
    if (failed > 0) console.log(`${failed} failed → rerun to retry (done.txt is auto-skipped)`);
}

main().catch(e => { console.error(e); process.exit(1); });