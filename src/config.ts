import 'dotenv/config';

export const CONFIG = {
    baseUrl: process.env.BASE_URL ?? 'https://motus.dot.gov',

    endpoint: {
        path: process.env.ENDPOINT_PATH ?? '/api/carriers/search',
        method: (process.env.ENDPOINT_METHOD ?? 'GET') as 'GET' | 'POST',
        bodyMode: (process.env.BODY_MODE ?? 'json') as 'json' | 'form',
        queryParam: process.env.QUERY_PARAM ?? 'query',
        bodyParam: process.env.BODY_PARAM ?? 'dotNumber',
        extraQuery: { limit: '25' } as Record<string, string>,
        extraBody: {} as Record<string, unknown>,
    },

    staticHeaders: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36',
        accept: 'application/json, text/plain, */*',
        referer: 'https://motus.dot.gov/public/search',
    } as Record<string, string>,

    // Throughput: 10k in 30min ≈ 5.6 req/s. Concurrency 8 ≈ 5–6 rps at ~1.5s latency.
    concurrency: Number(process.env.CONCURRENCY ?? 8),
    requestDelayMs: Number(process.env.REQUEST_DELAY_MS ?? 0),
    timeoutMs: 20_000,
    maxRetries: 4,
    baseBackoffMs: 1_000,
    cooldownMs: 30_000, // global pause after 429/403

    outDir: 'out',
    csvFile: 'out/carriers.csv',
    jsonlFile: 'out/carriers.jsonl',
    doneFile: 'out/done.txt',
    failedFile: 'out/failed.txt',
};