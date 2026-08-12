/**
 * Copper 2 — mobile: lock viewport + transform-based text scroll
 * (avoids native overflow scroll so browser chrome stays visible)
 */
(function () {
    if (!document.body.classList.contains('page-copper2')) return;

    const MOBILE_MAX = 768;
    const columns = [];
    let activeCol = null;

    function isMobile() {
        return window.innerWidth <= MOBILE_MAX;
    }

    function lockViewportHeight() {
        if (!isMobile()) {
            document.documentElement.style.removeProperty('--copper2-vh');
            document.body.classList.remove('copper2-mobile-locked');
            resetColumns();
            return;
        }

        document.body.classList.add('copper2-mobile-locked');
        document.documentElement.style.setProperty('--copper2-vh', `${window.innerHeight}px`);
        window.scrollTo(0, 0);
        initColumns();
    }

    function resetColumns() {
        columns.forEach((col) => {
            col.offsetY = 0;
            col.track.style.transform = '';
        });
    }

    function getMaxOffset(col) {
        return Math.max(0, col.track.offsetHeight - col.viewport.clientHeight);
    }

    function applyOffset(col, nextOffset) {
        const max = getMaxOffset(col);
        col.offsetY = Math.min(max, Math.max(0, nextOffset));
        col.track.style.transform = `translate3d(0, ${-col.offsetY}px, 0)`;
    }

    function initColumns() {
        columns.length = 0;

        if (!isMobile()) return;

        document.querySelectorAll('.copper2-body-col').forEach((viewport) => {
            const track = viewport.querySelector('.copper2-body-col-track');
            if (!track) return;

            const col = {
                viewport,
                track,
                offsetY: 0,
                startY: 0,
                startOffset: 0,
            };

            viewport.addEventListener(
                'touchstart',
                (e) => {
                    activeCol = col;
                    col.startY = e.touches[0].clientY;
                    col.startOffset = col.offsetY;
                },
                { passive: true }
            );

            viewport.addEventListener(
                'touchmove',
                (e) => {
                    if (activeCol !== col) return;
                    e.preventDefault();

                    const delta = col.startY - e.touches[0].clientY;
                    applyOffset(col, col.startOffset + delta);
                },
                { passive: false }
            );

            viewport.addEventListener('touchend', () => {
                if (activeCol === col) activeCol = null;
            });

            columns.push(col);
            applyOffset(col, col.offsetY);
        });
    }

    function blockDocumentTouch(e) {
        if (!isMobile()) return;
        if (e.target.closest('.nav-overlay')) return;
        if (e.target.closest('.copper2-body-col')) return;
        e.preventDefault();
    }

    function keepWindowPinned() {
        if (!isMobile()) return;
        if (window.scrollY !== 0) window.scrollTo(0, 0);
    }

    document.addEventListener('touchmove', blockDocumentTouch, { passive: false });

    window.addEventListener('scroll', keepWindowPinned, { passive: true });
    document.addEventListener('scroll', keepWindowPinned, { passive: true, capture: true });

    document.querySelectorAll('.copper2-scroll-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            if (!isMobile()) return;
            e.preventDefault();
        });
    });

    lockViewportHeight();
    window.addEventListener('orientationchange', () => {
        setTimeout(lockViewportHeight, 250);
    });
    window.addEventListener('resize', lockViewportHeight);
})();
