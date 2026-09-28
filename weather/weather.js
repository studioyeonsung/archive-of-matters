/**
 * Weather — mobile viewport lock + archive table toggle
 */
(function () {
    if (!document.body.classList.contains('page-weather')) return;

    const MOBILE_MAX = 768;
    const WHEEL_THRESHOLD = 20;
    // 텍스트 끝에 닿은 뒤: 관성이 이미 약해진 상태라 조금만 더 내려도 바로 목록을 연다
    const TEXT_WHEEL_THRESHOLD = 4;
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
            document.documentElement.style.removeProperty('--weather-vh');
            document.body.classList.remove('weather-mobile-locked');
            resetColumns();
            return;
        }

        document.body.classList.add('weather-mobile-locked');
        document.documentElement.style.setProperty('--weather-vh', `${window.innerHeight}px`);
        window.scrollTo(0, 0);
        initColumns();
    }

    function resetColumns() {
        columns.forEach((col) => {
            col.offsetY = 0;
            col.track.style.transform = '';
        });
    }

    window.__weatherTextScrollReset = function () {
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

        document.querySelectorAll('.weather-body-col').forEach((viewport) => {
            const track = viewport.querySelector('.weather-body-col-track');
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

                    const archiveEl = document.getElementById('weather-archive');
                    if (archiveEl && archiveEl.classList.contains('is-open')) {
                        if (Math.abs(delta) >= TOUCH_THRESHOLD) {
                            archiveSetOpen(false);
                        }
                    } else {
                        const extra = next - max;
                        if (extra >= TOUCH_THRESHOLD && archiveEl) {
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
        if (e.target.closest('.weather-body-col')) return;
        if (e.target.closest('.weather-archive')) return;
        e.preventDefault();
    }

    function keepWindowPinned() {
        if (!isMobile()) return;
        if (window.scrollY !== 0) window.scrollTo(0, 0);
    }

    function initArchiveToggle() {
        const archive = document.getElementById('weather-archive');
        const btn = archive && archive.querySelector('.weather-scroll-btn');
        const panel = document.getElementById('weather-archive-panel');
        if (!archive || !btn || !panel) return;

        let wheelAcc = 0;
        let wheelResetTimer = null;
        let textWheelAcc = 0;
        let textWheelResetTimer = null;
        let closeWheelAcc = 0;
        let closeWheelResetTimer = null;
        let pointerLastY = null;
        let pointerDownAcc = 0;
        let pointerWasAbove = false;
        let touchStartY = null;
        let touchActive = false;
        let touchFromAbove = false;
        let openLockUntil = 0;

        // 트랙패드 관성: 목록을 열고 닫은 직후 이어지는 휠 이벤트는 손을 뗄 때까지(휠이 잠잠해질 때까지) 삼킨다.
        // 그러지 않으면 관성 스크롤이 방금 연 목록을 다시 닫았다 열어 위아래로 튄다.
        let gestureLocked = false;
        let gestureTimer = null;
        const holdGesture = () => {
            gestureLocked = true;
            clearTimeout(gestureTimer);
            gestureTimer = setTimeout(() => {
                gestureLocked = false;
            }, 220);
        };
        window.addEventListener(
            'wheel',
            (e) => {
                if (!gestureLocked) return;
                holdGesture();
                e.preventDefault();
                e.stopImmediatePropagation();
            },
            { capture: true, passive: false }
        );

        const setOpen = (open) => {
            const next = Boolean(open);
            if (!next && Date.now() < openLockUntil) return;
            if (archive.classList.contains('is-open') === next) return;
            archive.classList.toggle('is-open', next);
            holdGesture();
            if (next) {
                openLockUntil = Date.now() + 500;
            } else {
                panel.scrollTop = 0;
            }
            btn.setAttribute('aria-expanded', next ? 'true' : 'false');
            btn.setAttribute('aria-label', next ? 'Close archive table' : 'Open archive table');
            if (!next) {
                const preview = document.getElementById('weather-row-preview');
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
            if (textWheelAcc >= TEXT_WHEEL_THRESHOLD) {
                setOpen(true);
                textWheelAcc = 0;
                return true;
            }
            return false;
        };

        const eventEl = (target) => {
            if (!target) return null;
            if (target.nodeType === 3) return target.parentElement;
            return target.nodeType === 1 ? target : target.parentElement;
        };

        const isTextScrollArea = (target) => {
            const el = eventEl(target);
            return Boolean(el && el.closest && el.closest('.weather-body-col'));
        };

        const isOverList = (target) => {
            const el = eventEl(target);
            return Boolean(
                el &&
                    el.closest &&
                    el.closest('#weather-archive-panel, .weather-archive-clip, .weather-table')
            );
        };

        const listAtTop = () => panel.scrollTop <= 1;

        const isIgnoredScrollTarget = (target) => {
            const el = eventEl(target);
            if (!el || !el.closest) return true;
            if (el.closest('.nav-overlay')) return true;
            if (el.closest('#nav-overlay-backdrop')) return true;
            if (el.closest('.about-lang-switch')) return true;
            if (isTextScrollArea(el)) return true;
            if (el.closest('#weather-archive-panel')) return true;
            return false;
        };

        const getPanelTop = () => panel.getBoundingClientRect().top;

        const isUiChrome = (target) => {
            const el = eventEl(target);
            if (!el || !el.closest) return true;
            if (el.closest('.nav-overlay')) return true;
            if (el.closest('#nav-overlay-backdrop')) return true;
            if (el.closest('.about-lang-switch')) return true;
            if (el.closest('.weather-scroll-btn')) return true;
            return false;
        };

        const isInsideListRows = (target) => {
            if (!target || !target.closest) return false;
            if (!target.closest('#weather-archive-panel')) return false;
            if (target.closest('.weather-table-row--head')) return false;
            return true;
        };

        const isFromAboveList = (target, clientY) => {
            if (isUiChrome(target)) return false;
            if (isTextScrollArea(target)) return true;
            if (target.closest && target.closest('.weather-table-row--head')) return true;
            const top = getPanelTop();
            if (typeof clientY === 'number' && clientY < top + 56) return true;
            if (isInsideListRows(target)) return false;
            return typeof clientY === 'number' && clientY < top - 0.5;
        };

        const bumpCloseFromAbove = (deltaY) => {
            if (deltaY <= 0) {
                closeWheelAcc = 0;
                return false;
            }
            closeWheelAcc += deltaY;
            if (closeWheelResetTimer) clearTimeout(closeWheelResetTimer);
            closeWheelResetTimer = setTimeout(() => {
                closeWheelAcc = 0;
            }, 180);
            if (closeWheelAcc >= WHEEL_THRESHOLD) {
                setOpen(false);
                closeWheelAcc = 0;
                return true;
            }
            return false;
        };

        document.addEventListener(
            'wheel',
            (e) => {
                if (!archive.classList.contains('is-open')) return;
                if (Date.now() < openLockUntil) return;
                if (isUiChrome(e.target)) return;
                if (isOverList(e.target)) {
                    if (e.deltaY > 0) return;
                    if (e.deltaY < 0 && !listAtTop()) return;
                } else if (e.deltaY === 0) {
                    return;
                }
                setOpen(false);
                e.preventDefault();
                e.stopPropagation();
            },
            { capture: true, passive: false }
        );

        panel.addEventListener(
            'wheel',
            (e) => {
                if (!archive.classList.contains('is-open')) return;
                if (Date.now() < openLockUntil) return;
                if (e.deltaY > 0) return;
                if (e.deltaY < 0 && !listAtTop()) return;
                setOpen(false);
                e.preventDefault();
                e.stopPropagation();
            },
            { capture: true, passive: false }
        );

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!archive.classList.contains('is-open'));
        });

        document.addEventListener('click', (e) => {
            if (!archive.classList.contains('is-open')) return;
            if (e.target.closest('#weather-archive-panel')) return;
            if (e.target.closest('.weather-scroll-btn')) return;
            if (e.target.closest('.about-lang-switch')) return;
            setOpen(false);
        });

        document.addEventListener(
            'wheel',
            (e) => {
                if (archive.classList.contains('is-open')) return;

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

        document.addEventListener('mousemove', (e) => {
            pointerLastY = e.clientY;
        });

        document.addEventListener(
            'touchstart',
            (e) => {
                const y = e.touches[0].clientY;
                if (
                    archive.classList.contains('is-open') &&
                    (isOverList(e.target) || !isIgnoredScrollTarget(e.target) || isTextScrollArea(e.target))
                ) {
                    touchActive = true;
                    touchFromAbove = isOverList(e.target);
                    touchStartY = y;
                    return;
                }
                touchFromAbove = false;
                if (isIgnoredScrollTarget(e.target)) {
                    touchActive = false;
                    touchStartY = null;
                    return;
                }
                touchActive = true;
                touchStartY = y;
            },
            { passive: true }
        );

        document.addEventListener(
            'touchmove',
            (e) => {
                if (!touchActive || touchStartY == null) return;

                if (archive.classList.contains('is-open') && touchActive) {
                    const dy = touchStartY - e.touches[0].clientY;
                    if (isOverList(e.target) || touchFromAbove) {
                        if (listAtTop() && dy <= -TOUCH_THRESHOLD) {
                            setOpen(false);
                            touchActive = false;
                            touchFromAbove = false;
                            touchStartY = null;
                        }
                        return;
                    }
                    const shouldClose = Math.abs(dy) >= TOUCH_THRESHOLD;
                    if (shouldClose) {
                        setOpen(false);
                        touchActive = false;
                        touchFromAbove = false;
                        touchStartY = null;
                    }
                    return;
                }

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
                touchFromAbove = false;
                touchStartY = null;
            },
            { passive: true }
        );

        document.querySelectorAll('.weather-body-col').forEach((colEl) => {
            let colTouchY = null;
            let colTouchExtra = 0;

            colEl.addEventListener(
                'wheel',
                (e) => {
                    if (!isColVisible(colEl)) return;
                    if (archive.classList.contains('is-open')) {
                        if (Date.now() >= openLockUntil && e.deltaY !== 0) {
                            setOpen(false);
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        return;
                    }

                    if (isMobile()) {
                        const state = getColState(colEl);
                        if (!state) return;
                        const max = getMaxOffset(state);
                        e.preventDefault();

                        if (e.deltaY > 0 && state.offsetY >= max - BOTTOM_SLACK) {
                            bumpTextOverscroll(e.deltaY);
                            e.stopPropagation();
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
                    e.stopPropagation();
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

                    const y = e.touches[0].clientY;
                    const dy = colTouchY - y;
                    colTouchY = y;

                    if (archive.classList.contains('is-open')) {
                        if (Math.abs(dy) >= TOUCH_THRESHOLD) {
                            setOpen(false);
                            colTouchY = null;
                            colTouchExtra = 0;
                        }
                        return;
                    }

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
        const table = document.querySelector('.weather-table');
        const sortBtn = document.getElementById('weather-date-sort');
        if (!table || !sortBtn) return;

        // Initial order matches markup: newest → oldest (desc)
        let descending = true;

        const applySort = () => {
            const head = table.querySelector('.weather-table-row--head');
            const rows = Array.from(
                table.querySelectorAll('.weather-table-row:not(.weather-table-row--head)')
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

        const dateHead = table.querySelector('.weather-table-row--head .weather-table-cell--date');
        if (dateHead) {
            dateHead.addEventListener('click', () => {
                sortBtn.click();
            });
        }
    }

    function initRowPreview() {
        const preview = document.getElementById('weather-row-preview');
        const img = preview && preview.querySelector('img');
        const archive = document.getElementById('weather-archive');
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

        document.querySelectorAll('.weather-table-row[data-preview]').forEach((row) => {
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

    document.addEventListener('touchmove', blockDocumentTouch, { passive: false });

    window.addEventListener('scroll', keepWindowPinned, { passive: true });
    document.addEventListener('scroll', keepWindowPinned, { passive: true, capture: true });

    function initMobileRowNavigate() {
        const TAP_SLOP = 12;
        document.querySelectorAll('a.weather-table-row--link[href]').forEach((link) => {
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
    initRowPreview();
    initMobileRowNavigate();
    lockViewportHeight();
    window.addEventListener('orientationchange', () => {
        setTimeout(lockViewportHeight, 250);
    });
    window.addEventListener('resize', lockViewportHeight);
})();
