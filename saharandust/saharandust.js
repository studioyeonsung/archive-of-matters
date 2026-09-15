/**
 * Saharan Dust — mobile viewport lock + archive table toggle
 */
(function () {
    if (!document.body.classList.contains('page-saharandust')) return;

    const MOBILE_MAX = 768;
    const columns = [];
    let activeCol = null;

    function isMobile() {
        return window.innerWidth <= MOBILE_MAX;
    }

    function lockViewportHeight() {
        if (!isMobile()) {
            document.documentElement.style.removeProperty('--saharandust-vh');
            document.body.classList.remove('saharandust-mobile-locked');
            resetColumns();
            return;
        }

        document.body.classList.add('saharandust-mobile-locked');
        document.documentElement.style.setProperty('--saharandust-vh', `${window.innerHeight}px`);
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

        document.querySelectorAll('.saharandust-body-col').forEach((viewport) => {
            const track = viewport.querySelector('.saharandust-body-col-track');
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
        if (e.target.closest('.saharandust-body-col')) return;
        if (e.target.closest('.saharandust-archive')) return;
        e.preventDefault();
    }

    function keepWindowPinned() {
        if (!isMobile()) return;
        if (window.scrollY !== 0) window.scrollTo(0, 0);
    }

    function initArchiveToggle() {
        const archive = document.getElementById('saharandust-archive');
        const btn = archive && archive.querySelector('.saharandust-scroll-btn');
        const panel = document.getElementById('saharandust-archive-panel');
        if (!archive || !btn || !panel) return;

        const WHEEL_THRESHOLD = 36;
        const TOUCH_THRESHOLD = 48;
        let wheelAcc = 0;
        let wheelResetTimer = null;
        let touchStartY = null;
        let touchActive = false;

        const setOpen = (open) => {
            const next = Boolean(open);
            if (archive.classList.contains('is-open') === next) return;
            archive.classList.toggle('is-open', next);
            btn.setAttribute('aria-expanded', next ? 'true' : 'false');
            btn.setAttribute('aria-label', next ? 'Close archive table' : 'Open archive table');
        };

        const isTextScrollArea = (target) =>
            Boolean(target && target.closest && target.closest('.saharandust-body-col'));

        const isIgnoredScrollTarget = (target) => {
            if (!target || !target.closest) return true;
            if (target.closest('.nav-overlay')) return true;
            if (target.closest('#nav-overlay-backdrop')) return true;
            if (isTextScrollArea(target)) return true;
            if (target.closest('#saharandust-archive-panel')) return true;
            return false;
        };

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!archive.classList.contains('is-open'));
        });

        document.addEventListener('click', (e) => {
            if (!archive.classList.contains('is-open')) return;
            if (e.target.closest('#saharandust-archive-panel')) return;
            if (e.target.closest('.saharandust-scroll-btn')) return;
            setOpen(false);
        });

        document.addEventListener(
            'wheel',
            (e) => {
                if (isIgnoredScrollTarget(e.target)) return;

                wheelAcc += e.deltaY;
                if (wheelResetTimer) clearTimeout(wheelResetTimer);
                wheelResetTimer = setTimeout(() => {
                    wheelAcc = 0;
                }, 180);

                if (wheelAcc >= WHEEL_THRESHOLD) {
                    setOpen(true);
                    wheelAcc = 0;
                    e.preventDefault();
                } else if (wheelAcc <= -WHEEL_THRESHOLD) {
                    setOpen(false);
                    wheelAcc = 0;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        document.addEventListener(
            'touchstart',
            (e) => {
                if (isIgnoredScrollTarget(e.target)) {
                    touchActive = false;
                    touchStartY = null;
                    return;
                }
                touchActive = true;
                touchStartY = e.touches[0].clientY;
            },
            { passive: true }
        );

        document.addEventListener(
            'touchmove',
            (e) => {
                if (!touchActive || touchStartY == null) return;
                if (isIgnoredScrollTarget(e.target)) return;

                const dy = touchStartY - e.touches[0].clientY;
                if (Math.abs(dy) < TOUCH_THRESHOLD) return;

                if (dy > 0) setOpen(true);
                else setOpen(false);

                touchActive = false;
                touchStartY = null;
            },
            { passive: true }
        );

        document.addEventListener(
            'touchend',
            () => {
                touchActive = false;
                touchStartY = null;
            },
            { passive: true }
        );
    }

    function initDateSort() {
        const table = document.querySelector('.saharandust-table');
        const sortBtn = document.getElementById('saharandust-date-sort');
        if (!table || !sortBtn) return;

        // Initial order matches markup: newest → oldest (desc)
        let descending = true;

        const applySort = () => {
            const head = table.querySelector('.saharandust-table-row--head');
            const rows = Array.from(
                table.querySelectorAll('.saharandust-table-row:not(.saharandust-table-row--head)')
            );

            rows.sort((a, b) => {
                const aDate = a.getAttribute('data-date') || '';
                const bDate = b.getAttribute('data-date') || '';
                if (aDate === bDate) return 0;
                const cmp = aDate < bDate ? -1 : 1;
                return descending ? -cmp : cmp;
            });

            rows.forEach((row) => table.appendChild(row));

            sortBtn.classList.toggle('is-asc', !descending);
            sortBtn.setAttribute('aria-pressed', descending ? 'false' : 'true');
            sortBtn.setAttribute(
                'aria-label',
                descending ? 'Sort by date ascending' : 'Sort by date descending'
            );
        };

        sortBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            descending = !descending;
            applySort();
        });
    }

    document.addEventListener('touchmove', blockDocumentTouch, { passive: false });

    window.addEventListener('scroll', keepWindowPinned, { passive: true });
    document.addEventListener('scroll', keepWindowPinned, { passive: true, capture: true });

    function initMobileRowNavigate() {
        const TAP_SLOP = 12;
        document.querySelectorAll('a.saharandust-table-row--link[href]').forEach((link) => {
            let startX = 0;
            let startY = 0;
            let moved = false;

            link.addEventListener(
                'touchstart',
                (e) => {
                    const t = e.changedTouches && e.changedTouches[0];
                    if (!t) return;
                    startX = t.clientX;
                    startY = t.clientY;
                    moved = false;
                },
                { passive: true }
            );

            link.addEventListener(
                'touchmove',
                (e) => {
                    const t = e.changedTouches && e.changedTouches[0];
                    if (!t) return;
                    if (
                        Math.abs(t.clientX - startX) > TAP_SLOP ||
                        Math.abs(t.clientY - startY) > TAP_SLOP
                    ) {
                        moved = true;
                    }
                },
                { passive: true }
            );

            link.addEventListener('touchend', (e) => {
                if (!isMobile()) return;
                if (moved || (e.touches && e.touches.length > 0)) return;
                const href = link.getAttribute('href');
                if (!href) return;
                e.preventDefault();
                window.location.href = href;
            });
        });
    }

    initArchiveToggle();
    initDateSort();
    initMobileRowNavigate();
    lockViewportHeight();
    window.addEventListener('orientationchange', () => {
        setTimeout(lockViewportHeight, 250);
    });
    window.addEventListener('resize', lockViewportHeight);
})();
