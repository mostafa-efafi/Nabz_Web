// تابع جهانی Pages — مسیر نهایی: /api/check?url=...
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 NabzWeb/1.0';

function jsonOut(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
}

const timeoutSignal = () =>
  typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined;

async function timedFetch(url, init = {}) {
  const t0 = Date.now();
  const res = await fetch(url, { redirect: 'follow', signal: timeoutSignal(), ...init });
  return { res, ms: Date.now() - t0 };
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': '*',
      },
    });
  }

  let target = new URL(request.url).searchParams.get('url') || '';
  if (!target && request.method === 'POST') {
    try { target = (await request.json()).url || ''; } catch { /* ignore */ }
  }
  target = String(target).trim();
  if (!target) return jsonOut({ ok: false, error: 'آدرسی وارد نشده است.' }, 400);
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

  let parsed;
  try { parsed = new URL(target); } catch {
    return jsonOut({ ok: false, error: 'آدرس واردشده معتبر نیست.' }, 400);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return jsonOut({ ok: false, error: 'فقط آدرس‌های http و https پشتیبانی می‌شوند.' }, 400);
  }

  const reqHeaders = {
    'user-agent': UA,
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'fa,en;q=0.5',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
  };

  // ۱) درخواست اصلی — زمان تا دریافت سربرگ‌ها ≈ TTFB
  let res, ttfb;
  try {
    ({ res, ms: ttfb } = await timedFetch(target, { headers: reqHeaders }));
  } catch {
    return jsonOut({
      ok: false,
      error: 'اتصال به سایت موردنظر ممکن نشد؛ در دسترس نبودن سایت، مشکل DNS یا مسدود شدن درخواست از دلایل احتمالی است.',
    });
  }

  const headers = {};
  res.headers.forEach((v, k) => { headers[k] = v; });

  const out = {
    ok: true,
    url: target,
    finalUrl: res.url || target,
    status: res.status,
    statusText: res.statusText,
    redirected: res.redirected,
    ttfb,
    headers,
    server: res.headers.get('server'),
    contentType: res.headers.get('content-type'),
    size: parseInt(res.headers.get('content-length') || '', 10) || null,
    behindCloudflare: Boolean(res.headers.get('cf-ray') || /cloudflare/i.test(res.headers.get('server') || '')),
    checkedAt: new Date().toISOString(),
    samples: [ttfb],
  };

  try { if (res.body) await res.body.cancel(); } catch { /* ignore */ }

  // ۲) چند نمونهٔ اضافی برای سنجش تأخیر شبکهٔ جهانی
  for (let i = 0; i < 3; i++) {
    try {
      const { res: r, ms } = await timedFetch(target, { headers: reqHeaders });
      try { if (r.body) await r.body.cancel(); } catch { /* ignore */ }
      out.samples.push(ms);
    } catch { break; }
  }

  // ۳) resolving DNS از طریق DoH جهانی
  try {
    const q = async (type, num) => {
      const d = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(parsed.hostname)}&type=${type}`,
        { headers: { accept: 'application/dns-json' }, signal: timeoutSignal() }
      );
      const j = await d.json();
      return (j.Answer || []).filter((a) => a.type === num).map((a) => a.data);
    };
    const [v4, v6] = await Promise.all([q('A', 1), q('AAAA', 28)]);
    out.dns = { ipv4: v4, ipv6: v6 };
  } catch {
    out.dns = { ipv4: [], ipv6: [] };
  }

  return jsonOut(out);
}
