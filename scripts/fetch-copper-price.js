#!/usr/bin/env node
/**
 * Fetches COMEX copper futures (HG=F) from Yahoo Finance v8 chart API.
 * Writes copper/price.json and copper/history-1y.json (delayed ~15–20 min).
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const COPPER_SYMBOL = 'HG=F';
const MIN_PRICE_LB = 2;
const MAX_PRICE_LB = 25;

const OUT_PRICE = path.join(__dirname, '..', 'copper', 'price.json');
const OUT_HISTORY = path.join(__dirname, '..', 'copper', 'history-1y.json');

const URL_PRICE = `https://query1.finance.yahoo.com/v8/finance/chart/${COPPER_SYMBOL}?range=1d&interval=1d`;
const URL_HISTORY = `https://query1.finance.yahoo.com/v8/finance/chart/${COPPER_SYMBOL}?range=1y&interval=1d`;

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 120)}`));
            return;
          }
          resolve(body);
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy(new Error('Request timeout'));
    });
  });
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function priceRounded3(price) {
  return Math.round(price * 1000) / 1000;
}

function validateCopperMeta(meta) {
  const symbol = meta.symbol || '';
  if (symbol !== COPPER_SYMBOL) {
    throw new Error(
      `Expected ${COPPER_SYMBOL} (copper), got "${symbol}". Check ticker — not gold (GC=F).`
    );
  }

  const price = meta.regularMarketPrice;
  if (typeof price !== 'number' || Number.isNaN(price)) {
    throw new Error('No regularMarketPrice in response');
  }

  if (price < MIN_PRICE_LB || price > MAX_PRICE_LB) {
    throw new Error(
      `Price $${price}/lb out of copper range (${MIN_PRICE_LB}–${MAX_PRICE_LB}). Wrong instrument?`
    );
  }

  return price;
}

function parseHistoryChart(data) {
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('Unexpected Yahoo history response');

  const meta = result.meta || {};
  if (meta.symbol && meta.symbol !== COPPER_SYMBOL) {
    throw new Error(`History symbol ${meta.symbol} is not ${COPPER_SYMBOL}`);
  }

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const points = [];

  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i];
    if (c == null || Number.isNaN(c)) continue;
    if (c < MIN_PRICE_LB || c > MAX_PRICE_LB) continue;
    points.push({ t: timestamps[i], c });
  }

  if (points.length < 2) {
    throw new Error('Not enough history points');
  }

  return points;
}

function historySignature(points) {
  const last = points[points.length - 1];
  return `${points.length}:${last.t}:${priceRounded3(last.c)}`;
}

async function updatePrice() {
  const raw = await get(URL_PRICE);
  const data = JSON.parse(raw);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('Unexpected Yahoo price response');

  const meta = result.meta || {};
  const price = validateCopperMeta(meta);
  const rounded = priceRounded3(price);

  const existing = readJson(OUT_PRICE);
  if (existing && priceRounded3(existing.price) === rounded) {
    console.log(`Copper unchanged: $${rounded.toFixed(3)}/lb (${COPPER_SYMBOL}) — skip price write`);
    return false;
  }

  const payload = {
    symbol: COPPER_SYMBOL,
    price,
    currency: meta.currency || 'USD',
    unit: 'lb',
    exchange: meta.exchangeName || meta.fullExchangeName || 'COMEX',
    instrumentType: meta.instrumentType || 'FUTURE',
    delayed: true,
    marketTime: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null,
    fetchedAt: new Date().toISOString(),
  };

  fs.writeFileSync(OUT_PRICE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT_PRICE} — ${COPPER_SYMBOL} $${rounded.toFixed(3)}/lb`);
  return true;
}

async function updateHistory() {
  const raw = await get(URL_HISTORY);
  const data = JSON.parse(raw);
  const points = parseHistoryChart(data);

  const payload = {
    symbol: COPPER_SYMBOL,
    range: '1y',
    interval: '1d',
    currency: 'USD',
    unit: 'lb',
    delayed: true,
    points,
    fetchedAt: new Date().toISOString(),
  };

  const existing = readJson(OUT_HISTORY);
  const sig = historySignature(points);
  const prevSig =
    existing?.points?.length ? historySignature(existing.points) : null;

  if (prevSig === sig) {
    console.log(`History unchanged (${points.length} points) — skip history write`);
    return false;
  }

  fs.writeFileSync(OUT_HISTORY, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT_HISTORY} — ${points.length} daily points`);
  return true;
}

async function main() {
  await updatePrice();
  await updateHistory();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
