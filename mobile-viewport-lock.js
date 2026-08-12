/**
 * Mobile viewport lock — browser chrome stays put.
 * Text scrolls via transform only (no native overflow scroll).
 */
(function () {
    const MOBILE_MAX = 768;
    const LOCKED_PAGES = ['page-index', 'page-about', 'page-news', 'page-contact', 'page-copper2'];

    /** @type {{viewport: HTMLElement, track: HTMLElement, offsetY: number, startY: number, startOffset: number}[]} */
    const areas = [];
    /** @type {typeof areas[number] | null} */
    let active = null;
    let bound = false;

    function isMobile() {
        return window.innerWidth <= MOBILE_MAX;
    }

    function isLockedPage() {
        return LOCKED_PAGES.some((cls) => document.body.classList.contains(cls));
    }

    function isLockedNow() {
        return isMobile() && document.body.classList.contains('site-mobile-locked');
    }

    function lockViewportHeight() {
        if (!isMobile() || !isLockedPage()) {
            document.body.classList.remove('site-mobile-locked');
            document.documentElement.style.removeProperty('--site-vh');
            document.documentElement.style.removeProperty('--copper2-vh');
            document.documentElement.style.removeProperty('--vh');
            return false;
        }

        const height = window.innerHeight;
        document.body.classList.add('site-mobile-locked');
        document.documentElement.style.setProperty('--site-vh', `${height}px`);
        document.documentElement.style.setProperty('--copper2-vh', `${height}px`);
        document.documentElement.style.setProperty('--vh', `${height}px`);
        document.documentElement.style.setProperty('--site-vw', `${window.innerWidth}px`);
        window.scrollTo(0, 0);
        return true;
    }

    function keepWindowPinned() {
        if (!isLockedNow()) return;
        if (window.scrollY !== 0 || window.pageYOffset !== 0) {
            window.scrollTo(0, 0);
        }
    }

    function getMax(area) {
        return Math.max(0, area.track.scrollHeight - area.viewport.clientHeight);
    }

    function applyOffset(area, next) {
        const max = getMax(area);
        area.offsetY = Math.min(max, Math.max(0, next));
        area.track.style.transform = 'translate3d(0,' + -area.offsetY + 'px,0)';
    }

    function ensureTrack(viewport, trackSelector, trackClass) {
        let track = viewport.querySelector(trackSelector);
        if (track) return track;

        track = document.createElement('div');
        track.className = trackClass;
        while (viewport.firstChild) {
            track.appendChild(viewport.firstChild);
        }
        viewport.appendChild(track);
        return track;
    }

    function registerArea(viewport, track) {
        if (!viewport || !track) return;
        if (areas.some((a) => a.viewport === viewport)) return;

        areas.push({
            viewport: viewport,
            track: track,
            offsetY: 0,
            startY: 0,
            startOffset: 0,
        });
        applyOffset(areas[areas.length - 1], 0);
    }

    function collectAreas() {
        document.querySelectorAll('.about-content-mobile .about-text-wrap').forEach((viewport) => {
            const track = ensureTrack(viewport, ':scope > .about-text-track', 'about-text-track');
            registerArea(viewport, track);
        });

        if (document.body.classList.contains('page-copper2')) {
            document.querySelectorAll('.copper2-body-col').forEach((viewport) => {
                const track = viewport.querySelector('.copper2-body-col-track');
                registerArea(viewport, track);
            });
        }
    }

    function findArea(node) {
        if (!node || !node.closest) return null;
        const viewport = node.closest('.about-text-wrap, .copper2-body-col');
        if (!viewport) return null;
        for (let i = 0; i < areas.length; i++) {
            if (areas[i].viewport === viewport) return areas[i];
        }
        return null;
    }

    function onTouchStart(e) {
        if (!isLockedNow()) {
            active = null;
            return;
        }
        if (!e.touches || !e.touches.length) return;

        const area = findArea(e.target);
        if (!area) {
            active = null;
            return;
        }

        active = area;
        area.startY = e.touches[0].clientY;
        area.startOffset = area.offsetY;
    }

    function onTouchMove(e) {
        if (!isLockedNow()) return;
        if (!e.touches || !e.touches.length) return;

        // Let nav overlay scroll natively
        if (e.target && e.target.closest && e.target.closest('.nav-overlay')) return;

        // Always stop native page scroll so browser chrome stays
        e.preventDefault();

        if (!active) return;

        const delta = active.startY - e.touches[0].clientY;
        applyOffset(active, active.startOffset + delta);
    }

    function onTouchEnd() {
        active = null;
    }

    function onWheel(e) {
        if (!isLockedNow()) return;
        const area = findArea(e.target);
        if (!area) return;
        e.preventDefault();
        applyOffset(area, area.offsetY + e.deltaY);
    }

    function bindGlobalHandlers() {
        if (bound) return;
        bound = true;

        // Capture phase so we win over other handlers
        document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
        document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
        document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
        document.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true });
        document.addEventListener('wheel', onWheel, { capture: true, passive: false });

        window.addEventListener('scroll', keepWindowPinned, { passive: true });
        document.addEventListener('scroll', keepWindowPinned, { capture: true, passive: true });
    }

    function init() {
        bindGlobalHandlers();
        const locked = lockViewportHeight();
        if (!locked) return;
        collectAreas();
        // Re-measure after fonts/layout settle
        setTimeout(function () {
            areas.forEach(function (area) {
                applyOffset(area, area.offsetY);
            });
        }, 300);
    }

    window.__aboutTextScrollReset = function () {
        areas.forEach(function (area) {
            if (area.viewport.classList.contains('about-text-wrap')) {
                applyOffset(area, 0);
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('orientationchange', function () {
        setTimeout(init, 250);
    });
    window.addEventListener('resize', function () {
        lockViewportHeight();
        if (isLockedNow()) {
            collectAreas();
            areas.forEach(function (area) {
                applyOffset(area, area.offsetY);
            });
        }
    });
})();
