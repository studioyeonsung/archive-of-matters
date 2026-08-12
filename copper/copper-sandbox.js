/**
 * Copper page — price + 1y chart (HG=F, USD/lb, delayed).
 */
(function () {
    if (!document.body.classList.contains('page-copper')) return;

    const COPPER_SYMBOL = 'HG=F';
    const MIN_PRICE_LB = 2;
    const MAX_PRICE_LB = 25;

    const priceEl = document.querySelector('.copper-price-value');
    const chartSvg = document.querySelector('.copper-chart-svg');
    const chartLabels = document.querySelector('.copper-chart-labels');
    const chartFallback = document.querySelector('.copper-chart-fallback');
    function formatPrice(value) {
        return Number(value).toFixed(3);
    }

    function validateCopperPayload(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid price payload');
        }
        if (data.symbol && data.symbol !== COPPER_SYMBOL) {
            throw new Error(`Wrong symbol: ${data.symbol}`);
        }
        const price = data.price;
        if (typeof price !== 'number' || Number.isNaN(price)) {
            throw new Error('Missing price');
        }
        if (price < MIN_PRICE_LB || price > MAX_PRICE_LB) {
            throw new Error('Price out of copper range');
        }
        return price;
    }

    function validateHistory(data) {
        if (!data || data.symbol !== COPPER_SYMBOL || !Array.isArray(data.points)) {
            throw new Error('Invalid history');
        }
        const points = data.points.filter(
            (p) =>
                p &&
                typeof p.t === 'number' &&
                typeof p.c === 'number' &&
                p.c >= MIN_PRICE_LB &&
                p.c <= MAX_PRICE_LB
        );
        if (points.length < 2) throw new Error('Not enough points');
        return points;
    }

    async function fetchJson(url) {
        const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    async function updateCopperPrice() {
        if (!priceEl) return;
        priceEl.setAttribute('aria-busy', 'true');
        try {
            const price = validateCopperPayload(await fetchJson('/copper/price.json'));
            priceEl.textContent = formatPrice(price);
            priceEl.setAttribute('title', `${COPPER_SYMBOL} COMEX copper (delayed)`);
        } catch (_) {
            priceEl.textContent = '—';
            priceEl.removeAttribute('title');
        } finally {
            priceEl.removeAttribute('aria-busy');
        }
    }

    function formatAxisDate(unixSec) {
        const d = new Date(unixSec * 1000);
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    function formatMonthLabel(date) {
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        return `${month} ${date.getFullYear()}`;
    }

    function indexNearestTime(points, ms) {
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < points.length; i++) {
            const dist = Math.abs(points[i].t * 1000 - ms);
            if (dist < bestDist) {
                bestDist = dist;
                best = i;
            }
        }
        return best;
    }

    function threeMonthMonthTicks(points) {
        const startMs = points[0].t * 1000;
        const endMs = points[points.length - 1].t * 1000;
        const start = new Date(startMs);
        const end = new Date(endMs);
        const ticks = [];
        const seen = new Set();

        const pushTick = (date, idx) => {
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (seen.has(key)) return;
            seen.add(key);
            ticks.push({
                idx,
                text: formatMonthLabel(date),
            });
        };

        // First month in range (data often starts mid-month — Jun 1 is before first point)
        const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
        pushTick(startMonth, 0);

        let cursor = new Date(start.getFullYear(), start.getMonth() + 3, 1);
        while (cursor.getTime() <= endMs) {
            pushTick(cursor, indexNearestTime(points, cursor.getTime()));
            cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
        }

        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        pushTick(endMonth, points.length - 1);

        return ticks.sort((a, b) => a.idx - b.idx);
    }

    function renderMonthLabels(points, ticks) {
        if (!chartLabels) return;
        const last = ticks.length - 1;
        chartLabels.innerHTML = ticks
            .map((tick, i) => {
                const pct = ((tick.idx / (points.length - 1)) * 100).toFixed(4);
                let align = 'copper-chart-month-label--mid';
                if (i === 0) align = 'copper-chart-month-label--start';
                else if (i === last) align = 'copper-chart-month-label--end';
                return `<span class="copper-chart-month-label ${align}" style="left:${pct}%">${tick.text}</span>`;
            })
            .join('');
    }

    function renderChart(points) {
        if (!chartSvg) return;

        const W = 1000;
        const H = 200;
        const topInset = 4;
        const plotH = H - topInset;

        const prices = points.map((p) => p.c);
        let min = Math.min(...prices);
        let max = Math.max(...prices);
        const padY = (max - min) * 0.08 || 0.1;
        min -= padY;
        max += padY;
        const range = max - min || 1;

        const toX = (i) => (i / (points.length - 1)) * W;
        const toY = (c) => topInset + (1 - (c - min) / range) * plotH;

        const ridge = points
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(2)},${toY(p.c).toFixed(2)}`)
            .join(' ');
        const area = `${ridge} L${W},${H} L0,${H} Z`;

        const monthTicks = threeMonthMonthTicks(points);
        renderMonthLabels(points, monthTicks);

        const ariaLabel = `Copper price chart, one year, from ${formatAxisDate(points[0].t)} to ${formatAxisDate(points[points.length - 1].t)}`;

        chartSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        chartSvg.setAttribute('preserveAspectRatio', 'none');
        chartSvg.setAttribute('role', 'img');
        chartSvg.setAttribute('aria-label', ariaLabel);
        chartSvg.innerHTML = `<path d="${area}" class="copper-chart-area" />`;

        if (chartFallback) {
            chartFallback.textContent = '';
            chartFallback.setAttribute('aria-hidden', 'true');
        }

    }

    async function updateChart() {
        if (!chartSvg) return;
        try {
            const data = await fetchJson('/copper/history-1y.json');
            renderChart(validateHistory(data));
        } catch (_) {
            if (chartFallback) {
                chartFallback.textContent = 'Chart unavailable';
                chartFallback.removeAttribute('aria-hidden');
            }
            chartSvg.innerHTML = '';
            chartSvg.removeAttribute('aria-label');
            if (chartLabels) chartLabels.innerHTML = '';
        }
    }

    const ICON_FILTER_BLACK = 'brightness(0) saturate(100%)';
    const ICON_FILTER_WHITE = 'brightness(0) saturate(100%) invert(1)';

    function getHeaderIcons() {
        return document.querySelectorAll(
            '.page-copper .fixed-header .header-icon, .page-copper .fixed-header > .header-matter-arrow'
        );
    }

    function setHeaderIconFilter(filter) {
        getHeaderIcons().forEach((icon) => {
            icon.style.setProperty('filter', filter, 'important');
        });
    }

    const HOVER_BG_VERSION = '2';

    function hoverBgUrl(url) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}v=${HOVER_BG_VERSION}`;
    }

    function preloadHoverImages(rows) {
        const urls = new Set();
        rows.forEach((row) => {
            if (row.dataset.hoverBg) urls.add(hoverBgUrl(row.dataset.hoverBg));
        });
        urls.forEach((url) => {
            const img = new Image();
            img.src = url;
        });
    }

    function initTableHoverBackgrounds() {
        const bg = document.querySelector('.copper-hover-bg');
        const rows = document.querySelectorAll('.copper-table-row--hover[data-hover-bg]');
        if (!bg || !rows.length) return;

        preloadHoverImages(rows);

        setHeaderIconFilter(ICON_FILTER_BLACK);

        const show = (url) => {
            bg.style.backgroundImage = `url("${hoverBgUrl(url)}")`;
            document.body.classList.add('is-hover-bg');
            setHeaderIconFilter(ICON_FILTER_WHITE);
        };

        const hide = () => {
            document.body.classList.remove('is-hover-bg');
            setHeaderIconFilter(ICON_FILTER_BLACK);
        };

        rows.forEach((row) => {
            row.addEventListener('mouseenter', () => show(row.dataset.hoverBg));
            row.addEventListener('mouseleave', hide);
        });
    }

    updateCopperPrice();
    updateChart();
    initTableHoverBackgrounds();
})();
