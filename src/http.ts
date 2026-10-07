import { CONFIG } from './config.js';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let cooldownUntil = 0;

export function triggerCooldown(ms = CONFIG.cooldownMs) {
    const until = Date.now() + ms;
    if (until > cooldownUntil) {
        cooldownUntil = until;
        console.warn(`[http] backing off ${Math.round(ms / 1000)}s`);
    }
}

export interface HttpResult {
    status: number;
    ok: boolean;
    data: unknown | null;
    text: string;
}

export async function fetchJson(
    path: string,
    opts: { query?: Record<string, string>; body?: Record<string, unknown>; method?: 'GET' | 'POST' } = {},
): Promise<HttpResult> {
    const url = new URL(path, CONFIG.baseUrl);
    for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v);

    const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://motus.dot.gov/public/search',
        ...CONFIG.staticHeaders,
    };

    const reqMethod: 'GET' | 'POST' = opts.method ??
        ((path.startsWith('/api/carriers/') && !path.includes('search')) ? 'GET' : CONFIG.endpoint.method);

    let payload: string | undefined;

    if (reqMethod === 'POST' && opts.body) {
        if (CONFIG.endpoint.bodyMode === 'form') {
            headers['content-type'] = 'application/x-www-form-urlencoded';
            payload = new URLSearchParams(
                Object.entries(opts.body).map(([k, v]) => [k, String(v)])
            ).toString();
        } else {
            headers['content-type'] = 'application/json';
            payload = JSON.stringify(opts.body);
        }
    }

    let attempt = 0;

    for (; ;) {
        const waitMs = cooldownUntil - Date.now();
        if (waitMs > 0) await sleep(waitMs);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

        try {
            const res = await fetch(url.toString(), {
                method: reqMethod,
                headers,
                body: payload,
                signal: controller.signal,
            });
            clearTimeout(timer);

            const text = await res.text();
            const status = res.status;

            if (status === 429 || status === 403) {
                console.warn(`[http] ${status} on ${url.toString()} (attempt ${attempt + 1})`);
                const ra = res.headers.get('retry-after');
                const retryAfterSec = Number(ra) || 0;
                triggerCooldown(retryAfterSec > 0 ? retryAfterSec * 1000 : 5000);
                if (++attempt <= CONFIG.maxRetries) continue;
                return { status, ok: false, data: null, text };
            }

            if (status >= 500) {
                if (++attempt <= CONFIG.maxRetries) {
                    await sleep(CONFIG.baseBackoffMs * 2 ** attempt + Math.random() * 500);
                    continue;
                }
                return { status, ok: false, data: null, text };
            }

            let data: unknown = null;
            if (status >= 200 && status < 300 && text) {
                try { data = JSON.parse(text); } catch { /* Non-JSON handled gracefully */ }
            }
            return { status, ok: status < 400, data, text };
        } catch (err: any) {
            clearTimeout(timer);
            if (++attempt <= CONFIG.maxRetries) {
                await sleep(CONFIG.baseBackoffMs * 2 ** attempt + Math.random() * 500);
                continue;
            }
            throw err;
        }
    }
}