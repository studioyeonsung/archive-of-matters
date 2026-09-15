/**
 * Copper — mobile viewport lock + archive table toggle
 */
(function () {
    if (!document.body.classList.contains('page-copper')) return;

    const MOBILE_MAX = 768;
    const WHEEL_THRESHOLD = 36;
    const TOUCH_THRESHOLD = 48;
    const BOTTOM_SLACK = 2;
    const columns = [];
    let activeCol = null;
    let archiveSetOpen = () => {};

    function isMobile() {
        return window.innerWidth <= MOBILE_MAX;
    }

    function lockViewportHeight() {
        if (!isMobile()) {
            document.documentElement.style.removeProperty('--copper-vh');
            document.body.classList.remove('copper-mobile-locked');
            resetColumns();
            return;
        }

        document.body.classList.add('copper-mobile-locked');
        document.documentElement.style.setProperty('--copper-vh', `${window.innerHeight}px`);
        window.scrollTo(0, 0);
        initColumns();
    }

    function resetColumns() {
        columns.forEach((col) => {
            col.offsetY = 0;
            col.track.style.transform = '';
        });
    }

    window.__copperTextScrollReset = function () {
        resetColumns();
    };

    function getMaxOffset(col) {
        return Math.max(0, col.track.offsetHeight - col.viewport.clientHeight);
    }

    function applyOffset(col, nextOffset) {
        const max = getMaxOffset(col);
        col.offsetY = Math.min(max, Math.max(0, nextOffset));
        col.track.style.transform = `translate3d(0, ${-col.offsetY}px, 0)`;
    }

    function isColVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return el.getClientRects().length > 0;
    }

    function getColState(viewport) {
        return columns.find((c) => c.viewport === viewport) || null;
    }

    function isColAtBottom(colEl) {
        if (isMobile()) {
            const state = getColState(colEl);
            if (state) {
                const max = getMaxOffset(state);
                return max <= 0 || state.offsetY >= max - BOTTOM_SLACK;
            }
        }
        return colEl.scrollTop + colEl.clientHeight >= colEl.scrollHeight - BOTTOM_SLACK;
    }

    function initColumns() {
        columns.length = 0;

        if (!isMobile()) return;

        document.querySelectorAll('.copper-body-col').forEach((viewport) => {
            const track = viewport.querySelector('.copper-body-col-track');
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
                    const max = getMaxOffset(col);
                    const next = col.startOffset + delta;
                    applyOffset(col, next);

                    const extra = next - max;
                    if (extra >= TOUCH_THRESHOLD) {
                        const archive = document.getElementById('copper-archive');
                        if (archive && !archive.classList.contains('is-open')) {
                            archiveSetOpen(true);
                        }
                    }
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
        if (e.target.closest('.about-lang-switch')) return;
        if (e.target.closest('.copper-body-col')) return;
        if (e.target.closest('.copper-archive')) return;
        e.preventDefault();
    }

    function keepWindowPinned() {
        if (!isMobile()) return;
        if (window.scrollY !== 0) window.scrollTo(0, 0);
    }

    function initArchiveToggle() {
        const archive = document.getElementById('copper-archive');
        const btn = archive && archive.querySelector('.copper-scroll-btn');
        const panel = document.getElementById('copper-archive-panel');
        if (!archive || !btn || !panel) return;

        let wheelAcc = 0;
        let wheelResetTimer = null;
        let textWheelAcc = 0;
        let textWheelResetTimer = null;
        let touchStartY = null;
        let touchActive = false;

        const setOpen = (open) => {
            const next = Boolean(open);
            if (archive.classList.contains('is-open') === next) return;
            archive.classList.toggle('is-open', next);
            btn.setAttribute('aria-expanded', next ? 'true' : 'false');
            btn.setAttribute('aria-label', next ? 'Close archive table' : 'Open archive table');
            if (!next) {
                const preview = document.getElementById('copper-row-preview');
                if (preview) {
                    preview.classList.remove('is-visible');
                    preview.setAttribute('aria-hidden', 'true');
                }
            }
        };

        archiveSetOpen = setOpen;

        const bumpTextOverscroll = (deltaY) => {
            if (deltaY <= 0) {
                textWheelAcc = 0;
                return false;
            }
            textWheelAcc += deltaY;
            if (textWheelResetTimer) clearTimeout(textWheelResetTimer);
            textWheelResetTimer = setTimeout(() => {
                textWheelAcc = 0;
            }, 180);
            if (textWheelAcc >= WHEEL_THRESHOLD) {
                setOpen(true);
                textWheelAcc = 0;
                return true;
            }
            return false;
        };

        const isTextScrollArea = (target) =>
            Boolean(target && target.closest && target.closest('.copper-body-col'));

        const isIgnoredScrollTarget = (target) => {
            if (!target || !target.closest) return true;
            if (target.closest('.nav-overlay')) return true;
            if (target.closest('#nav-overlay-backdrop')) return true;
            if (target.closest('.about-lang-switch')) return true;
            if (isTextScrollArea(target)) return true;
            if (target.closest('#copper-archive-panel')) return true;
            return false;
        };

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!archive.classList.contains('is-open'));
        });

        document.addEventListener('click', (e) => {
            if (!archive.classList.contains('is-open')) return;
            if (e.target.closest('#copper-archive-panel')) return;
            if (e.target.closest('.copper-scroll-btn')) return;
            if (e.target.closest('.about-lang-switch')) return;
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

        document.querySelectorAll('.copper-body-col').forEach((colEl) => {
            let colTouchY = null;
            let colTouchExtra = 0;

            colEl.addEventListener(
                'wheel',
                (e) => {
                    if (!isColVisible(colEl)) return;
                    if (archive.classList.contains('is-open')) return;

                    if (isMobile()) {
                        const state = getColState(colEl);
                        if (!state) return;
                        const max = getMaxOffset(state);
                        e.preventDefault();

                        if (e.deltaY > 0 && state.offsetY >= max - BOTTOM_SLACK) {
                            bumpTextOverscroll(e.deltaY);
                            return;
                        }

                        textWheelAcc = 0;
                        applyOffset(state, state.offsetY + e.deltaY);
                        return;
                    }

                    if (e.deltaY <= 0) {
                        textWheelAcc = 0;
                        return;
                    }
                    if (!isColAtBottom(colEl)) {
                        textWheelAcc = 0;
                        return;
                    }
                    e.preventDefault();
                    bumpTextOverscroll(e.deltaY);
                },
                { passive: false }
            );

            colEl.addEventListener(
                'touchstart',
                (e) => {
                    if (isMobile()) return;
                    colTouchY = e.touches[0].clientY;
                    colTouchExtra = 0;
                },
                { passive: true }
            );

            colEl.addEventListener(
                'touchmove',
                (e) => {
                    if (isMobile()) return;
                    if (colTouchY == null) return;
                    if (!isColVisible(colEl)) return;
                    if (archive.classList.contains('is-open')) return;

                    const y = e.touches[0].clientY;
                    const dy = colTouchY - y;
                    colTouchY = y;

                    if (dy <= 0 || !isColAtBottom(colEl)) {
                        colTouchExtra = 0;
                        return;
                    }

                    colTouchExtra += dy;
                    if (colTouchExtra >= TOUCH_THRESHOLD) {
                        setOpen(true);
                        colTouchExtra = 0;
                    }
                },
                { passive: true }
            );

            colEl.addEventListener(
                'touchend',
                () => {
                    colTouchY = null;
                    colTouchExtra = 0;
                },
                { passive: true }
            );
        });
    }

    function initDateSort() {
        const table = document.querySelector('.copper-table');
        const sortBtn = document.getElementById('copper-date-sort');
        if (!table || !sortBtn) return;

        // Initial order matches markup: newest → oldest (desc)
        let descending = true;

        const applySort = () => {
            const head = table.querySelector('.copper-table-row--head');
            const rows = Array.from(
                table.querySelectorAll('.copper-table-row:not(.copper-table-row--head)')
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

    function initRowPreview() {
        const preview = document.getElementById('copper-row-preview');
        const img = preview && preview.querySelector('img');
        const archive = document.getElementById('copper-archive');
        if (!preview || !img || !archive) return;

        const hide = () => {
            preview.classList.remove('is-visible');
            preview.setAttribute('aria-hidden', 'true');
        };

        const show = (row) => {
            const src = row.getAttribute('data-preview');
            if (!src || !archive.classList.contains('is-open')) {
                hide();
                return;
            }
            if (img.getAttribute('src') !== src) {
                img.setAttribute('src', src);
            }
            img.setAttribute('alt', row.getAttribute('data-preview-alt') || '');
            preview.classList.add('is-visible');
            preview.setAttribute('aria-hidden', 'false');
        };

        document.querySelectorAll('.copper-table-row[data-preview]').forEach((row) => {
            row.addEventListener('mouseenter', () => {
                if (isMobile()) return;
                show(row);
            });
            row.addEventListener('mouseleave', hide);
            row.addEventListener('focusin', () => {
                if (isMobile()) return;
                show(row);
            });
            row.addEventListener('focusout', (e) => {
                if (!row.contains(e.relatedTarget)) hide();
            });
        });
    }

    function initMobileRowNavigate() {
        const TAP_SLOP = 12;
        document.querySelectorAll('a.copper-table-row--link[href]').forEach((link) => {
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

    document.addEventListener('touchmove', blockDocumentTouch, { passive: false });

    window.addEventListener('scroll', keepWindowPinned, { passive: true });
    document.addEventListener('scroll', keepWindowPinned, { passive: true, capture: true });

    initArchiveToggle();
    initDateSort();
    initRowPreview();
    initMobileRowNavigate();
    lockViewportHeight();
    window.addEventListener('orientationchange', () => {
        setTimeout(lockViewportHeight, 250);
    });
    window.addEventListener('resize', lockViewportHeight);
})();
