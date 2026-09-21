// Register ScrollTrigger plugin when GSAP is present (index / copper / about).
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// Section colors (all black for text + icons)
const sectionColors = [
    '#000000', // Section 1
    '#000000', // Section 2
    '#000000', // Section 3
    '#000000'  // Section 4
];

// Function to calculate CSS filter for a given color
// This creates a filter that makes black icons appear in the target color
// Note: CSS filters are approximations and may not match colors exactly
function getColorFilter(targetColor) {
    // For black (#000000) - make SVG icons black
    if (targetColor === '#000000') {
        return 'brightness(0) saturate(100%)';
    }
    
    // For yellow (#fee11c)
    if (targetColor === '#fee11c') {
        return 'brightness(0) saturate(100%) invert(88%) sepia(100%) saturate(1000%) hue-rotate(0deg) brightness(100%) contrast(100%)';
    }
    
    // For orange (#FF9800)
    if (targetColor === '#FF9800') {
        return 'brightness(0) saturate(100%) invert(60%) sepia(100%) saturate(2000%) hue-rotate(0deg) brightness(100%) contrast(100%)';
    }
    
    return 'brightness(0) saturate(100%)';
}

// Function to update section color
function updateSectionColor(sectionIndex) {
    const color = sectionColors[sectionIndex] || sectionColors[0];
    
    // Update CSS variable
    document.documentElement.style.setProperty('--section-color', color);
    
    // Update icon filters
    const headerIcons = document.querySelectorAll('.header-icon');
    const matterTitles = document.querySelectorAll('.matter-title-eng, .matter-title-kor');
    
    let filter = getColorFilter(color);
    
    // Apply filter to icons (black = brightness(0) saturate(100%))
    headerIcons.forEach(icon => {
        icon.style.maskImage = 'none';
        icon.style.webkitMaskImage = 'none';
        icon.style.backgroundColor = 'transparent';
        icon.style.opacity = '1';
        icon.style.setProperty('filter', filter, 'important');
        icon.style.transition = 'filter 0.3s ease';
    });
    
    matterTitles.forEach(title => {
        if (title.tagName !== 'IMG') {
            return;
        }
        const imgSrc = title.getAttribute('src');
        if (imgSrc && imgSrc.endsWith('.png') && color !== '#000000') {
            title.style.setProperty('filter', 'none', 'important');
        } else {
            title.style.setProperty('filter', filter, 'important');
        }
        title.style.transition = 'filter 0.3s ease';
    });
}

function bootSite() {
    setVisualViewportHeight();
    try {
        initHorizontalScroll();
    } catch (err) {
        console.warn('Horizontal scroll init skipped', err);
    }
    // Index only — other pages set header/icon colors in their own CSS
    if (document.body.classList.contains('page-index')) {
        updateSectionColor(0);
    }
    initMatterPopup();
    alignFixedArrowsWithKoreanTitle();
    initMobileArrowNav();
    initMobileSwipeNav();
    initNavOverlay();
    initAboutLangSwitch();
    initMobileIconPressFeedback();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSite);
} else {
    bootSite();
}

function setVisualViewportHeight() {
    const lockedOnMobile =
        window.innerWidth <= 768 &&
        ['page-index', 'page-about', 'page-news', 'page-contact', 'page-copper', 'page-finedust', 'page-saharandust', 'page-weather'].some((cls) =>
            document.body.classList.contains(cls)
        );
    if (lockedOnMobile) return;

    const setVh = () => {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', () => setTimeout(setVh, 250));
}

function alignFixedArrowsWithKoreanTitle() {
    const fixedArrows = document.querySelector('.page-index .matter-move-arrows-fixed');
    if (!fixedArrows) return;

    const update = () => {
        if (window.innerWidth > 768) return;
        const sectionLefts = document.querySelectorAll('.page-index .matter-section .section-left');
        if (!sectionLefts.length) return;
        const vh = window.innerHeight;
        const vCenter = vh / 2;
        let best = null;
        let bestDist = Infinity;
        sectionLefts.forEach((el) => {
            const r = el.getBoundingClientRect();
            const centerY = r.top + r.height / 2;
            const dist = Math.abs(centerY - vCenter);
            if (r.top < vh && r.bottom > 0 && dist < bestDist) {
                bestDist = dist;
                best = r;
            }
        });
        if (best) {
            const centerY = best.top + best.height / 2;
            fixedArrows.style.top = `${centerY - 16}px`;
        }
    };

    update();
    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('mobileindexsectionchange', () => requestAnimationFrame(update));
    window.addEventListener('resize', update);
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.addEventListener('refresh', update);
    }
}

function initMobileArrowNav() {
    const fixedArrowsWrap = document.querySelector('.page-index .matter-move-arrows-fixed');
    if (!fixedArrowsWrap) return;

    const arrowLeft = fixedArrowsWrap.querySelector('.matter-move-arrow-fixed-left');
    const arrowRight = fixedArrowsWrap.querySelector('.matter-move-arrow-fixed-right');
    if (!arrowLeft || !arrowRight) return;

    const sections = document.querySelectorAll('.page-index .matter-section');

    function getCurrentSection() {
        if (window.mobileIndexNav) return window.mobileIndexNav.getCurrentSection();
        const scrollDistancePerSection = 300;
        const scrollDistance = sections.length * scrollDistancePerSection;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const progress = Math.min(1, Math.max(0, scrollTop / scrollDistance));
        const index = Math.round(progress * (sections.length - 1));
        return Math.max(0, Math.min(index, sections.length - 1));
    }

    function scrollToSection(index) {
        if (window.mobileIndexNav) {
            window.mobileIndexNav.goToSection(index);
            return;
        }
        const scrollDistancePerSection = 300;
        const scrollDistance = sections.length * scrollDistancePerSection;
        const sectionProgress = index / (sections.length - 1);
        const clampedProgress = Math.max(0, Math.min(1, sectionProgress));
        const targetScroll = clampedProgress * scrollDistance;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }

    function onLeftArrow() {
        if (window.innerWidth > 768) return;
        const current = getCurrentSection();
        const prev = (current - 1 + sections.length) % sections.length;
        scrollToSection(prev);
    }

    function onRightArrow() {
        if (window.innerWidth > 768) return;
        const current = getCurrentSection();
        const next = (current + 1) % sections.length;
        scrollToSection(next);
    }

    arrowLeft.addEventListener('click', (e) => {
        e.preventDefault();
        onLeftArrow();
    });
    arrowRight.addEventListener('click', (e) => {
        e.preventDefault();
        onRightArrow();
    });

    arrowLeft.setAttribute('role', 'button');
    arrowLeft.setAttribute('aria-label', '이전 물질로');
    arrowRight.setAttribute('role', 'button');
    arrowRight.setAttribute('aria-label', '다음 물질로');
}

function initMobileSwipeNav() {
    const scrollContainer = document.querySelector('.page-index .scroll-container');
    if (!scrollContainer) return;

    const sections = document.querySelectorAll('.page-index .matter-section');
    const minSwipeDistance = 50;

    function getCurrentSection() {
        if (window.mobileIndexNav) return window.mobileIndexNav.getCurrentSection();
        const scrollDistancePerSection = 300;
        const scrollDistance = sections.length * scrollDistancePerSection;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const progress = Math.min(1, Math.max(0, scrollTop / scrollDistance));
        const index = Math.round(progress * (sections.length - 1));
        return Math.max(0, Math.min(index, sections.length - 1));
    }

    function scrollToSection(index) {
        if (window.mobileIndexNav) {
            window.mobileIndexNav.goToSection(index);
            return;
        }
        const scrollDistancePerSection = 300;
        const scrollDistance = sections.length * scrollDistancePerSection;
        const sectionProgress = index / (sections.length - 1);
        const clampedProgress = Math.max(0, Math.min(1, sectionProgress));
        const targetScroll = clampedProgress * scrollDistance;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }

    let startX = 0;
    let startY = 0;

    scrollContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1 || window.innerWidth > 768) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    scrollContainer.addEventListener('touchend', (e) => {
        if (e.changedTouches.length !== 1 || window.innerWidth > 768) return;
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (absX < minSwipeDistance && absY < minSwipeDistance) return;

        const current = getCurrentSection();
        let goNext = false;
        let goPrev = false;

        if (absX >= absY) {
            // Horizontal: left = next, right = prev
            if (absX < minSwipeDistance) return;
            if (deltaX < 0) goNext = true;
            else goPrev = true;
        } else {
            // Vertical: up = next, down = prev
            if (absY < minSwipeDistance) return;
            if (deltaY < 0) goNext = true;
            else goPrev = true;
        }

        if (goNext) {
            scrollToSection((current + 1) % sections.length);
        } else if (goPrev) {
            scrollToSection((current - 1 + sections.length) % sections.length);
        }
    }, { passive: true });
}

// Matter gate: Copper and Fine Dust are enterable.
// Weather and Saharan Dust show the “archiving in progress” popup.
function isCopperPath(pathname) {
    return /^\/copper(?:\/|$)/i.test(pathname || '');
}

function isFineDustPath(pathname) {
    return /^\/finedust(?:\/|$)/i.test(pathname || '');
}

function isWeatherPath(pathname) {
    return /^\/weather(?:\/|$)/i.test(pathname || '');
}

function isSaharanDustPath(pathname) {
    return /^\/saharandust(?:\/|$)/i.test(pathname || '');
}

function isOpenMatterPath(pathname) {
    return isCopperPath(pathname) || isFineDustPath(pathname);
}

function lockedMatterRoot(pathname) {
    if (isWeatherPath(pathname)) return 'weather';
    if (isSaharanDustPath(pathname)) return 'saharandust';
    return '';
}

function isLockedMatterPath(pathname) {
    return !isOpenMatterPath(pathname) && !!lockedMatterRoot(pathname);
}

function pathFromHref(href) {
    try {
        return new URL(href, location.href).pathname;
    } catch (err) {
        return '';
    }
}

function isMatterEntryLink(link) {
    return !!link.closest(
        '.header-matter-link, .header-matter-slot, .matter-title-link, .matter-image-link, .nav-overlay-item--sub'
    );
}

function shouldGateMatterHref(link, pathname) {
    if (isOpenMatterPath(pathname)) return false;
    if (isLockedMatterPath(pathname)) {
        return lockedMatterRoot(pathname) !== lockedMatterRoot(location.pathname);
    }
    // Header / home / overlay matter links that are not open stay gated
    // even if a new matter path is added later.
    if (!isMatterEntryLink(link)) return false;
    if (!pathname || pathname === '/') return false;
    if (/^\/(about|news|contact)(?:\/|$)/i.test(pathname)) return false;
    return true;
}

function isLockedMatterLink(link) {
    if (!link) return false;
    const pathname = pathFromHref(link.getAttribute('href') || link.href || '');
    if (isOpenMatterPath(pathname)) return false;
    if (link.closest('[data-matter-locked]')) return true;
    if (isWeatherPath(pathname) || isSaharanDustPath(pathname)) return true;
    return shouldGateMatterHref(link, pathname);
}

function eventElement(e) {
    const target = e && e.target;
    if (!target) return null;
    if (target.nodeType === 1) return target;
    return target.parentElement || null;
}

function lockedMatterLinkFromEvent(e) {
    const node = eventElement(e);
    if (!node || !node.closest) return null;
    const link = node.closest('a[href]');
    return isLockedMatterLink(link) ? link : null;
}

function openMatterPopup() {
    const popup = ensureMatterPopup();
    if (!popup) return;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
}

function blockLockedMatterNavigation(e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    e.returnValue = false;
}

function ensureMatterPopup() {
    let popup = document.getElementById('matter-popup');
    if (popup) return popup;

    popup = document.createElement('div');
    popup.className = 'matter-popup-overlay';
    popup.id = 'matter-popup';
    popup.setAttribute('aria-hidden', 'true');
    popup.innerHTML =
        '<div class="matter-popup-box" role="dialog" aria-modal="true">' +
        '<button type="button" class="matter-popup-close" aria-label="닫기"><img src="/assets/popup-icon-close.svg" alt=""></button>' +
        '<p class="matter-popup-eng">Archiving of this matter is in progress.</p>' +
        '<p class="matter-popup-eng">Opening soon.</p>' +
        '<p class="matter-popup-kor">이 물질에 대한 아카이빙이 진행 중입니다.</p>' +
        '<p class="matter-popup-kor">곧 오픈할 예정입니다.</p>' +
        '</div>';
    document.body.appendChild(popup);
    return popup;
}

function closeNavOverlayIfOpen() {
    const overlay = document.getElementById('nav-overlay');
    const backdrop = document.getElementById('nav-overlay-backdrop');
    if (!overlay || !overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    overlay.style.maxHeight = '';
    overlay.setAttribute('aria-hidden', 'true');
    if (backdrop) {
        backdrop.classList.remove('is-open');
        backdrop.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
}

function initMatterPopup() {
    const popup = ensureMatterPopup();
    if (!popup) return;

    const closePopup = () => {
        popup.classList.remove('is-open');
        popup.setAttribute('aria-hidden', 'true');
    };

    const activateLockedMatter = (e) => {
        if (document.body.dataset.navCloseClick === '1') return false;
        const link = lockedMatterLinkFromEvent(e);
        if (link) {
            blockLockedMatterNavigation(e);
            closeNavOverlayIfOpen();
            openMatterPopup();
            return true;
        }

        const node = eventElement(e);
        if (!node || !node.closest) return false;
        const trigger = node.closest('.matter-image, .matter-title-eng, .matter-title-kor, .header-matter-icon');
        if (!trigger) return false;
        const parentLink = trigger.closest('a[href]');
        if (parentLink && !isLockedMatterLink(parentLink)) return false;
        if (!parentLink && isOpenMatterPath(location.pathname)) return false;
        blockLockedMatterNavigation(e);
        closeNavOverlayIfOpen();
        openMatterPopup();
        return true;
    };

    document.addEventListener('click', activateLockedMatter, true);
    document.addEventListener('auxclick', activateLockedMatter, true);

    // Mobile Safari / Chrome often commit <a> navigation on touchend, before
    // a click listener can cancel it. Intercept taps on locked matters here.
    const TAP_SLOP = 12;
    let lockTouch = null;
    document.addEventListener('touchstart', (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        const link = lockedMatterLinkFromEvent(e);
        lockTouch = t && link ? { x: t.clientX, y: t.clientY, link } : null;
    }, { capture: true, passive: true });

    document.addEventListener('touchend', (e) => {
        const start = lockTouch;
        lockTouch = null;
        if (!start) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        if (Math.abs(t.clientX - start.x) > TAP_SLOP || Math.abs(t.clientY - start.y) > TAP_SLOP) return;
        const link = lockedMatterLinkFromEvent(e);
        if (!link || link !== start.link) return;
        // preventDefault only: cancel the <a> navigation and the synthetic
        // click without blocking other document touch handlers (press feedback).
        e.preventDefault();
        e.returnValue = false;
        closeNavOverlayIfOpen();
        openMatterPopup();
    }, { capture: true, passive: false });

    document.querySelectorAll('a[href]').forEach((link) => {
        if (!isLockedMatterLink(link) || link.dataset.matterGateBound === '1') return;
        link.dataset.matterGateBound = '1';
        const block = (e) => {
            blockLockedMatterNavigation(e);
            closeNavOverlayIfOpen();
            openMatterPopup();
            return false;
        };
        link.addEventListener('click', block, true);
        link.onclick = () => false;
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) closePopup();
    });

    const closeBtn = popup.querySelector('.matter-popup-close');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);

    if (isLockedMatterPath(location.pathname)) {
        openMatterPopup();
    }
}

function initMobileIconPressFeedback() {
    const selector = [
        '.menu-icon',
        '.nav-overlay-close',
        '.nav-overlay-item',
        '.ro-footer-arrow',
        '.matter-move-arrow-fixed',
        '.copper-scroll-btn',
        '.finedust-scroll-btn',
        '.weather-scroll-btn',
        '.saharandust-scroll-btn',
        '.copper-table-sort-btn',
        '.finedust-table-sort-btn',
        '.weather-table-sort-btn',
        '.saharandust-table-sort-btn'
    ].join(',');
    const yellowFilter =
        'brightness(0) saturate(100%) invert(88%) sepia(100%) saturate(1000%) hue-rotate(0deg) brightness(100%) contrast(100%)';
    /* Fine Dust #d4c0b0 — same as list hover / selection / header circle */
    const fineDustTapFilter =
        'brightness(0) saturate(100%) invert(76%) sepia(14%) saturate(330%) hue-rotate(-16deg) brightness(101%) contrast(91%)';
    let clearTimer = 0;

    const skipYellowFilter = (node) => (
        node.classList.contains('menu-icon')
        || node.classList.contains('nav-overlay-arrow')
        || !!node.closest('.menu-icon')
    );

    const isFineDustTapTarget = (el) => (
        el.matches('.finedust-scroll-btn, .finedust-table-sort-btn')
        || (el.matches('.ro-footer-arrow')
            && document.body.classList.contains('page-finedust-detail'))
    );

    const pressFilterFor = (el) => (
        isFineDustTapTarget(el) ? fineDustTapFilter : yellowFilter
    );

    const filterTargets = (el) => {
        if (el.matches('img')) return skipYellowFilter(el) ? [] : [el];
        return Array.from(el.querySelectorAll('img')).filter((node) => !skipYellowFilter(node));
    };

    const restorePress = (el) => {
        filterTargets(el).forEach((node) => {
            if (!node.dataset.tapFilterSaved) return;
            const prev = node.dataset.tapPrevFilter || '';
            const priority = node.dataset.tapPrevFilterPriority || '';
            if (prev) {
                node.style.setProperty('filter', prev, priority);
            } else {
                node.style.removeProperty('filter');
            }
            delete node.dataset.tapFilterSaved;
            delete node.dataset.tapPrevFilter;
            delete node.dataset.tapPrevFilterPriority;
        });
        el.classList.remove('is-pressing');
    };

    const applyPress = (el) => {
        document.querySelectorAll('.is-pressing').forEach(restorePress);
        el.classList.add('is-pressing');
        const tapFilter = pressFilterFor(el);
        filterTargets(el).forEach((node) => {
            if (!node.dataset.tapFilterSaved) {
                node.dataset.tapPrevFilter = node.style.getPropertyValue('filter');
                node.dataset.tapPrevFilterPriority = node.style.getPropertyPriority('filter');
                node.dataset.tapFilterSaved = '1';
            }
            node.style.transition = 'none';
            node.style.setProperty('filter', tapFilter, 'important');
        });
    };

    const clearPress = () => {
        window.clearTimeout(clearTimer);
        clearTimer = window.setTimeout(() => {
            document.querySelectorAll('.is-pressing').forEach(restorePress);
        }, 160);
    };

    document.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 768) return;
        const el = e.target.closest(selector);
        if (!el) return;
        window.clearTimeout(clearTimer);
        applyPress(el);
    }, { passive: true });

    document.addEventListener('touchend', clearPress, { passive: true });
    document.addEventListener('touchcancel', clearPress, { passive: true });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            window.clearTimeout(clearTimer);
            document.querySelectorAll('.is-pressing').forEach(restorePress);
        }
    });
}

function initNavOverlay() {
    const overlay = document.getElementById('nav-overlay');
    const backdrop = document.getElementById('nav-overlay-backdrop');
    const menuIcon = document.querySelector('.menu-icon');
    const closeBtn = overlay?.querySelector('.nav-overlay-close');
    if (!overlay || !menuIcon) return;

    const openOverlay = () => {
        if (window.innerWidth > 768) return;
        const margin = 24;
        overlay.style.maxHeight = (window.innerHeight - margin * 2) + 'px';
        overlay.classList.add('is-open');
        if (backdrop) backdrop.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        if (backdrop) backdrop.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeOverlay = () => {
        overlay.classList.remove('is-open');
        overlay.style.maxHeight = '';
        if (backdrop) backdrop.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    const syncOverlayMaxHeight = () => {
        if (overlay.classList.contains('is-open')) {
            const margin = 24;
            overlay.style.maxHeight = (window.innerHeight - margin * 2) + 'px';
        }
    };
    window.addEventListener('resize', syncOverlayMaxHeight);

    menuIcon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openOverlay();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    overlay.querySelectorAll('a.nav-overlay-item[href]').forEach((link) => {
        const gateOverlayMatter = (e) => {
            if (!isLockedMatterLink(link)) return;
            blockLockedMatterNavigation(e);
            closeOverlay();
            openMatterPopup();
        };
        link.addEventListener('click', gateOverlayMatter, true);
        link.addEventListener(
            'touchend',
            (e) => {
                if (!isLockedMatterLink(link)) return;
                if (e.touches && e.touches.length > 0) return;
                gateOverlayMatter(e);
            },
            { capture: true, passive: false }
        );
    });

    const headerLink = overlay.querySelector('.nav-overlay-header-link');
    if (headerLink) {
        headerLink.addEventListener('click', () => {
            closeOverlay();
        });
    }

    overlay.addEventListener('click', (e) => {
        const el = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
        if (!el || !el.closest('.nav-overlay-kor-matter-trigger')) return;
        e.preventDefault();
        e.stopPropagation();
        closeOverlay();
        const popup = document.getElementById('matter-popup');
        if (popup) {
            setTimeout(() => {
                popup.classList.add('is-open');
                popup.setAttribute('aria-hidden', 'false');
            }, 400);
        }
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth > 768) return;
        if (!overlay.classList.contains('is-open')) return;
        if (overlay.contains(e.target)) return;
        if (menuIcon.contains(e.target)) return;
        if (backdrop && e.target === backdrop) { closeOverlay(); return; }
        closeOverlay();
        document.body.dataset.navCloseClick = '1';
        setTimeout(() => { delete document.body.dataset.navCloseClick; }, 0);
    }, true);

    overlay.querySelectorAll('.nav-overlay-item[data-section]').forEach((link) => {
        link.addEventListener('click', (e) => {
            if (isLockedMatterLink(link)) {
                blockLockedMatterNavigation(e);
                closeOverlay();
                openMatterPopup();
                return;
            }
            if (window.innerWidth > 768) return;
            const section = link.getAttribute('data-section');
            if (!section || !document.body.classList.contains('page-index')) return;
            e.preventDefault();
            closeOverlay();
            const sections = document.querySelectorAll('.page-index .matter-section');
            const scrollDistancePerSection = 300;
            const scrollDistance = sections.length * scrollDistancePerSection;
            const index = parseInt(section, 10) - 1;
            if (index >= 0 && index < sections.length) {
                const sectionProgress = index / Math.max(1, sections.length - 1);
                const clampedProgress = Math.max(0, Math.min(1, sectionProgress));
                const targetScroll = clampedProgress * scrollDistance;
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeOverlay();
    });
}

function initAboutLangSwitch() {
    const body = document.body;
    const page = [
        { cls: 'page-about', scope: '.page-about', prefix: 'about-lang' },
        { cls: 'page-news', scope: '.page-news', prefix: 'news-lang' },
        { cls: 'page-contact', scope: '.page-contact', prefix: 'contact-lang' },
        { cls: 'page-copper', scope: '.page-copper', prefix: 'copper-lang' },
        { cls: 'page-finedust', scope: '.page-finedust', prefix: 'finedust-lang' },
    ].find((item) => body.classList.contains(item.cls));
    if (!page) return;
    const allBtns = document.querySelectorAll(`${page.scope} .about-lang-btn[data-lang]`);
    if (!allBtns.length) return;
    allBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            if (!lang) return;
            body.classList.remove(`${page.prefix}-eng`, `${page.prefix}-kor`);
            body.classList.add(lang === 'kor' ? `${page.prefix}-kor` : `${page.prefix}-eng`);
            allBtns.forEach((b) => b.classList.remove('is-active'));
            allBtns.forEach((b) => {
                if (b.getAttribute('data-lang') === lang) b.classList.add('is-active');
            });
            if (window.__aboutTextScrollReset) {
                window.__aboutTextScrollReset();
            } else if (window.__copperTextScrollReset) {
                window.__copperTextScrollReset();
            } else if (window.__finedustTextScrollReset) {
                window.__finedustTextScrollReset();
            } else {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }
        });
    });
}

function initMobileHorizontalScroll(horizontalWrapper, sections, timelinePoints) {
    document.body.style.minHeight = '';

    const setSiteVw = () => {
        document.documentElement.style.setProperty('--site-vw', `${window.innerWidth}px`);
    };
    setSiteVw();

    let currentSection = 0;
    const grainLayer = document.querySelector('.grain-layer');
    const timelineIndicator = document.querySelector('.timeline-indicator');

    function getSectionX(index) {
        const section = sections[index];
        if (!section) return 0;
        // Use layout offset so each panel sits exactly in the viewport
        return -section.offsetLeft;
    }

    function updateTimelineUI(sectionIndex) {
        const progress = sections.length > 1 ? sectionIndex / (sections.length - 1) : 0;
        if (timelineIndicator) {
            const timelineWidth = window.innerWidth * 0.7;
            const timelineStart = window.innerWidth * 0.15;
            timelineIndicator.style.left = `${timelineStart + timelineWidth * progress}px`;
        }
        timelinePoints.forEach((point, index) => {
            const number = point.querySelector('.timeline-number');
            if (number) number.classList.toggle('active', index === sectionIndex);
        });
        updateSectionColor(sectionIndex);
    }

    function goToSection(index, animate = true) {
        currentSection = Math.max(0, Math.min(index, sections.length - 1));
        const x = getSectionX(currentSection);
        const progress = sections.length > 1 ? currentSection / (sections.length - 1) : 0;
        const grainTravel = Math.max(0, horizontalWrapper.scrollWidth - window.innerWidth) * 0.2;
        const grainX = grainTravel * progress;

        if (animate) {
            gsap.to(horizontalWrapper, { x, duration: 0.45, ease: 'power2.out' });
            if (grainLayer) gsap.to(grainLayer, { x: grainX, duration: 0.45, ease: 'power2.out' });
        } else {
            gsap.set(horizontalWrapper, { x });
            if (grainLayer) gsap.set(grainLayer, { x: grainX });
        }
        updateTimelineUI(currentSection);
        window.dispatchEvent(
            new CustomEvent('mobileindexsectionchange', { detail: { section: currentSection } })
        );
    }

    window.mobileIndexNav = {
        getCurrentSection: () => currentSection,
        goToSection: (index) => goToSection(index, true),
    };

    timelinePoints.forEach((point, index) => {
        const number = point.querySelector('.timeline-number');
        if (!number) return;
        number.style.cursor = 'pointer';
        number.style.pointerEvents = 'auto';
        number.setAttribute('role', 'button');
        number.setAttribute('aria-label', `${index + 1}번 물질로 이동`);
        number.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            goToSection(index, true);
        });
    });

    goToSection(0, false);

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) return;
        setSiteVw();
        goToSection(currentSection, false);
    });
}

function initHorizontalScroll() {
    // Get elements
    const horizontalWrapper = document.querySelector('.horizontal-wrapper');
    const scrollContainer = document.querySelector('.scroll-container');
    const sections = document.querySelectorAll('.matter-section');
    const timelinePoints = document.querySelectorAll('.timeline-point');

    if (!horizontalWrapper || !scrollContainer) {
        console.error('Required elements not found');
        return;
    }

    if (window.innerWidth <= 768) {
        initMobileHorizontalScroll(horizontalWrapper, sections, timelinePoints);
        return;
    }

    // Calculate scroll distance per section
    const scrollDistancePerSection = 300;
    const scrollDistance = sections.length * scrollDistancePerSection;

    // Set body height to ensure scrollable space
    const getViewHeight = () => (window.visualViewport && window.innerWidth <= 768 ? window.visualViewport.height : window.innerHeight);
    const updateBodyMinHeight = () => {
        document.body.style.minHeight = `${scrollDistance + getViewHeight()}px`;
    };
    updateBodyMinHeight();
    if (window.visualViewport && window.innerWidth <= 768) {
        window.visualViewport.addEventListener('resize', updateBodyMinHeight);
    }
    window.addEventListener('resize', updateBodyMinHeight);

    // Calculate total horizontal width dynamically
    const calculateTotalWidth = () => {
        const width = horizontalWrapper.scrollWidth - window.innerWidth;
        return width > 0 ? width : sections.length * window.innerWidth - window.innerWidth;
    };

    // Force layout recalculation
    horizontalWrapper.offsetHeight;

    // Timeline indicator setup (before scrollTween)
    const timelineIndicator = document.querySelector('.timeline-indicator');
    
    // Set up horizontal scroll with pin
    let scrollTween = gsap.to(horizontalWrapper, {
        x: () => -calculateTotalWidth(),
        ease: 'none',
        scrollTrigger: {
            trigger: scrollContainer,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${scrollDistance}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            markers: false, // Set to true for debugging
            onUpdate: (self) => {
                const progress = self.progress;

                // Update timeline indicator position
                if (timelineIndicator) {
                    const timelineWidth = window.innerWidth * 0.7;
                    const timelineStart = window.innerWidth * 0.15;
                    const indicatorPosition = timelineStart + (timelineWidth * progress);
                    timelineIndicator.style.left = `${indicatorPosition}px`;
                }

                // Update active timeline number based on current section
                const sectionWidth = 1 / sections.length;
                let currentSection = Math.floor(progress / sectionWidth);
                currentSection = Math.max(0, Math.min(currentSection, sections.length - 1));

                timelinePoints.forEach((point, index) => {
                    const number = point.querySelector('.timeline-number');
                    if (number) {
                        if (index === currentSection) {
                            number.classList.add('active');
                        } else {
                            number.classList.remove('active');
                        }
                    }
                });

                updateSectionColor(currentSection);
            }
        }
    });

    const grainLayer = document.querySelector('.grain-layer');
    if (grainLayer) {
        gsap.to(grainLayer, {
            x: () => calculateTotalWidth() * 0.2,
            ease: 'none',
            scrollTrigger: {
                trigger: horizontalWrapper,
                containerAnimation: scrollTween,
                start: 'left left',
                end: 'right left',
                scrub: 1,
            }
        });
    }

    // Parallax: matter-title-eng, matter-title-kor
    sections.forEach((section) => {
        const matterEng = section.querySelector('.matter-title-eng');
        const matterKor = section.querySelector('.matter-title-kor');
        if (matterEng) {
            gsap.to(matterEng, {
                x: () => -calculateTotalWidth() * 0.1,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    containerAnimation: scrollTween,
                    start: 'left left',
                    end: 'right left',
                    scrub: 1,
                }
            });
        }
        if (matterKor) {
            gsap.to(matterKor, {
                x: () => -calculateTotalWidth() * 0.1,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    containerAnimation: scrollTween,
                    start: 'left left',
                    end: 'right left',
                    scrub: 1,
                }
            });
        }
    });

    sections.forEach((section) => {
        const matterImage = section.querySelector('.matter-image');
        if (matterImage) {
            gsap.to(matterImage, {
                x: () => -calculateTotalWidth() * 0.25,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    containerAnimation: scrollTween,
                    start: 'left left',
                    end: 'right left',
                    scrub: 1,
                }
            });
        }
    });

    // Set initial timeline indicator position and active state
    if (timelineIndicator) {
        const timelineStart = window.innerWidth * 0.15;
        timelineIndicator.style.left = `${timelineStart}px`;
        
        // Set initial active state (first section)
        if (timelinePoints.length > 0) {
            const firstNumber = timelinePoints[0].querySelector('.timeline-number');
            if (firstNumber) {
                firstNumber.classList.add('active');
            }
        }
        
        // Add click handlers to timeline numbers to jump to sections
        timelinePoints.forEach((point, index) => {
            const number = point.querySelector('.timeline-number');
            if (number) {
                number.style.cursor = 'pointer';
                number.style.pointerEvents = 'auto';
                
                number.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Calculate progress for this section
                    const sectionProgress = index / (sections.length - 1);
                    const clampedProgress = Math.max(0, Math.min(1, sectionProgress));
                    
                    // Calculate scroll position
                    const scrollPosition = clampedProgress * scrollDistance;
                    
                    // Scroll to position
                    window.scrollTo({
                        top: scrollPosition,
                        behavior: 'smooth'
                    });
                });
            }
        });
        
        // Make indicator draggable
        let isDragging = false;
        let startX = 0;
        let startLeft = 0;
        
        const getTimelineDimensions = () => {
            const timelineWidth = window.innerWidth * 0.7;
            const timelineStart = window.innerWidth * 0.15;
            return { timelineWidth, timelineStart };
        };
        
        const updateScrollFromIndicator = (indicatorPosition) => {
            const { timelineWidth, timelineStart } = getTimelineDimensions();
            const progress = (indicatorPosition - timelineStart) / timelineWidth;
            const clampedProgress = Math.max(0, Math.min(1, progress));
            
            // Calculate scroll position based on progress
            const scrollPosition = clampedProgress * scrollDistance;
            
            // Update scroll position
            window.scrollTo({
                top: scrollPosition,
                behavior: 'auto'
            });
        };
        
        const hitbox = timelineIndicator.querySelector('.timeline-indicator-hitbox');
        const dragTarget = hitbox || timelineIndicator;
        
        const getIndicatorLeft = () => parseFloat(timelineIndicator.style.left) || timelineStart;
        
        dragTarget.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startLeft = getIndicatorLeft();
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const { timelineWidth, timelineStart } = getTimelineDimensions();
            const deltaX = e.clientX - startX;
            let newLeft = startLeft + deltaX;
            
            // Clamp to timeline bounds
            newLeft = Math.max(timelineStart, Math.min(timelineStart + timelineWidth, newLeft));
            
            timelineIndicator.style.left = `${newLeft}px`;
            updateScrollFromIndicator(newLeft);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
            }
        });
        
        dragTarget.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            isDragging = true;
            startX = e.touches[0].clientX;
            startLeft = getIndicatorLeft();
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            e.preventDefault();
            const { timelineWidth, timelineStart } = getTimelineDimensions();
            const deltaX = e.touches[0].clientX - startX;
            let newLeft = startLeft + deltaX;
            newLeft = Math.max(timelineStart, Math.min(timelineStart + timelineWidth, newLeft));
            timelineIndicator.style.left = `${newLeft}px`;
            updateScrollFromIndicator(newLeft);
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (isDragging) isDragging = false;
        });
        document.addEventListener('touchcancel', () => {
            if (isDragging) isDragging = false;
        });
    }

    // Refresh on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 250);
    });
}

