/*
 * Server-side proxy for the backend API, and the deployed counterpart of the
 * dev proxy in vite.config.ts. Everything below mirrors the reasoning there.
 *
 * Two things break when the built app talks to api2.acepeak.com straight from
 * the browser on a host the backend does not know (a *.vercel.app preview, for
 * instance):
 *
 *   1. CORS. The API answers preflights but only echoes
 *      Access-Control-Allow-Origin for origins registered as a tenant, so the
 *      browser discards every response and the app renders the maintenance
 *      screen.
 *   2. Tenant resolution. The API picks the "website settings" record from the
 *      Origin/Referer of the request, so a request that arrives with an
 *      unknown origin matches no site and comes back 422 "Website settings not
 *      found" - which the login screen reports as bad credentials even when
 *      they are correct.
 *
 * Routing the calls through this function fixes both: the browser talks only to
 * its own origin (CORS never applies), and the hop to the API is made here,
 * server-side, presenting the deployed tenant's own origin.
 *
 * For this to be used, VITE_API_BASE_URL must be empty in the deployment's
 * environment, exactly as it is in the local .env, so the app's requests stay
 * relative and land here.
 */

const API_ORIGIN = stripTrailingSlash(process.env.API_PROXY_TARGET || 'https://api2.acepeak.com');
const TENANT_ORIGIN = stripTrailingSlash(
  process.env.API_PROXY_TENANT_ORIGIN || 'https://ucaas.acepeak.com',
);

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

/* Connection-level headers describe the hop that just ended, not the message,
   so they must not be replayed onto the next one. content-length goes with them
   because the body is re-sent here and fetch recomputes it; accept-encoding
   because letting the API compress for us would mean decompressing before we
   could hand the bytes back. */
const HOP_BY_HOP = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

async function proxy(request) {
  const incoming = new URL(request.url);
  const target = `${API_ORIGIN}${incoming.pathname}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, name) => {
    if (!HOP_BY_HOP.has(name.toLowerCase())) headers.set(name, value);
  });
  /* The whole point of the hop: present the tenant the API knows, not the
     deployment's own hostname. */
  headers.set('origin', TENANT_ORIGIN);
  headers.set('referer', `${TENANT_ORIGIN}/`);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      /* A 3xx is the API's answer and belongs to the browser, which knows its
         own origin; following it here would resolve it against the API host. */
      redirect: 'manual',
    });
  } catch (error) {
    /* A failure to reach the API at all is a gateway problem, not the API
       answering - say so rather than passing up a misleading status. */
    return new Response(
      JSON.stringify({ success: false, message: `API unreachable: ${error?.message || error}` }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    /* The body is streamed back as-is, so length/encoding are recomputed for
       this response; copying the old ones would describe the wrong message.
       CORS headers are dropped because the browser's request was same-origin -
       an Allow-Origin naming the tenant would only contradict that. */
    if (
      lower === 'content-encoding' ||
      lower === 'content-length' ||
      lower === 'transfer-encoding' ||
      lower === 'connection' ||
      lower === 'set-cookie' ||
      lower.startsWith('access-control-')
    ) {
      return;
    }
    responseHeaders.append(name, value);
  });

  /* Several Set-Cookie headers must stay several headers; the iteration above
     would fold them into one comma-joined string that no browser will parse. */
  if (typeof upstream.headers.getSetCookie === 'function') {
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
