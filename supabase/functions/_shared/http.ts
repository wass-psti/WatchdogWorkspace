export type EdgeJsonRecord = Record<string, unknown>;

const BASE_HEADERS = Object.freeze({
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
});

export function allowedOrigins(value: string | undefined): ReadonlySet<string> {
  return new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean));
}

export function corsHeaders(request: Request, origins: ReadonlySet<string>): Headers {
  const headers = new Headers(BASE_HEADERS);
  const origin = request.headers.get('origin')?.trim() || '';
  if (origin && origins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-wm-request-id');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  return headers;
}

export function jsonResponse(request: Request, origins: ReadonlySet<string>, status: number, body: EdgeJsonRecord): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request, origins) });
}

export function requestIdOf(request: Request): string {
  const supplied = request.headers.get('x-wm-request-id')?.trim() || '';
  return /^[A-Za-z0-9._:-]{8,120}$/.test(supplied) ? supplied : crypto.randomUUID();
}

export async function jsonBody(request: Request): Promise<EdgeJsonRecord> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) throw new TypeError('Content-Type must be application/json.');
  const parsed: unknown = await request.json();
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('JSON request body must be an object.');
  return parsed as EdgeJsonRecord;
}
