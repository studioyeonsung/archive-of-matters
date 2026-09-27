(function () {
    var host = location.hostname;
    var local =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.endsWith('.local') ||
        /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);

    window.__AOM_LOCAL = local;

    var LANG_KEY = 'aom-lang';
    var SAME_PAGE_LANG = /^(?:\/(?:about|news|contact|copper|finedust|weather|saharandust)?)\/?$/;
    var ROW_LINKS =
        'a.copper-table-row--link[href], a.finedust-table-row--link[href], a.weather-table-row--link[href], a.saharandust-table-row--link[href]';
    var BODY_LANG = [
        ['page-about', 'about-lang'],
        ['page-news', 'news-lang'],
        ['page-contact', 'contact-lang'],
        ['page-copper', 'copper-lang'],
        ['page-finedust', 'finedust-lang'],
        ['page-weather', 'weather-lang'],
        ['page-saharandust', 'saharandust-lang'],
    ];

    function normalizePath(pathname) {
        return String(pathname || '/').replace(/\/index\.html$/, '/') || '/';
    }

    function isSamePageLangPath(pathname) {
        return SAME_PAGE_LANG.test(normalizePath(pathname));
    }

    function isKoPath(pathname) {
        return /(?:^|\/)ko\/?$/.test(normalizePath(pathname));
    }

    function toKoPath(pathname) {
        var p = normalizePath(pathname);
        if (isKoPath(p)) return p.endsWith('/') ? p : p + '/';
        if (!p.endsWith('/')) p += '/';
        return p + 'ko/';
    }

    function toEngPath(pathname) {
        var p = normalizePath(pathname).replace(/\/ko\/?$/, '/');
        return p.endsWith('/') ? p : p + '/';
    }

    function getLang() {
        try {
            var v = localStorage.getItem(LANG_KEY);
            if (v === 'kor' || v === 'eng') return v;
        } catch (err) {}
        try {
            var s = sessionStorage.getItem(LANG_KEY);
            if (s === 'kor' || s === 'eng') return s;
        } catch (err) {}
        return null;
    }

    function setLang(lang) {
        if (lang !== 'kor' && lang !== 'eng') return;
        try {
            localStorage.setItem(LANG_KEY, lang);
        } catch (err) {}
        try {
            sessionStorage.setItem(LANG_KEY, lang);
        } catch (err) {}
    }

    function applyHtmlLang(lang) {
        var html = document.documentElement;
        html.classList.remove('aom-lang-eng', 'aom-lang-kor');
        if (lang === 'kor' || lang === 'eng') {
            html.classList.add('aom-lang-' + lang);
            html.setAttribute('data-aom-lang', lang);
        } else {
            html.removeAttribute('data-aom-lang');
        }
    }

    function langFromControl(el) {
        if (!el) return null;
        var data = el.getAttribute('data-lang');
        if (data === 'kor' || data === 'eng') return data;
        var hrefLang = el.getAttribute('hreflang');
        if (hrefLang === 'ko') return 'kor';
        if (hrefLang === 'en') return 'eng';
        return null;
    }

    function rewriteProjectLinks(lang) {
        if (lang !== 'kor' && lang !== 'eng') return;
        document.querySelectorAll(ROW_LINKS).forEach(function (link) {
            var original = link.getAttribute('data-aom-href-eng');
            if (!original) {
                original = toEngPath(link.getAttribute('href') || '');
                link.setAttribute('data-aom-href-eng', original);
            }
            link.setAttribute('href', lang === 'kor' ? toKoPath(original) : original);
        });
    }

    function applyBodyLang(lang) {
        applyHtmlLang(lang);
        var body = document.body;
        if (!body || (lang !== 'kor' && lang !== 'eng')) return;
        BODY_LANG.forEach(function (pair) {
            if (!body.classList.contains(pair[0])) return;
            body.classList.remove(pair[1] + '-eng', pair[1] + '-kor');
            body.classList.add(pair[1] + '-' + lang);
        });
        document.querySelectorAll('.about-lang-btn[data-lang]').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
        });
    }

    applyHtmlLang(getLang());

    function syncLangFromPage() {
        if (isKoPath(location.pathname)) {
            setLang('kor');
            return 'kor';
        }
        var stored = getLang();
        if (stored) return stored;
        var body = document.body;
        if (body && (body.classList.contains('page-rusty-odyssey--ko') || /lang-kor\b/.test(body.className))) {
            setLang('kor');
            return 'kor';
        }
        return stored;
    }

    var langBtnsReady = false;
    var langReadyTimer = 0;
    function armLangButtons() {
        langBtnsReady = false;
        document.documentElement.classList.remove('aom-lang-ready');
        clearTimeout(langReadyTimer);
        langReadyTimer = setTimeout(function () {
            langBtnsReady = true;
            document.documentElement.classList.add('aom-lang-ready');
        }, 700);
    }
    armLangButtons();
    var guardStyle = document.createElement('style');
    guardStyle.textContent =
        'html:not(.aom-lang-ready) .about-lang-btn, html:not(.aom-lang-ready) .ro-lang-btn { pointer-events: none !important; }';
    (document.head || document.documentElement).appendChild(guardStyle);

    function stampInfoHrefs() {
        ['/about/', '/news/', '/contact/'].forEach(function (path) {
            document.querySelectorAll('a[href="' + path + '"]').forEach(function (a) {
                a.setAttribute('href', path + '?l=6');
            });
        });
    }

    function maybeRedirectLang() {
        var lang = getLang();
        if (!lang && isKoPath(location.pathname)) {
            setLang('kor');
            lang = 'kor';
        }
        if (!lang) return false;
        if (isSamePageLangPath(location.pathname)) return false;
        var path = normalizePath(location.pathname);
        var next = null;
        if (lang === 'kor' && !isKoPath(path)) next = toKoPath(path);
        if (lang === 'eng' && isKoPath(path)) next = toEngPath(path);
        if (!next || next === path) return false;
        location.replace(next + location.search + location.hash);
        return true;
    }

    if (maybeRedirectLang()) {
        return;
    }

    window.__AOM_LANG = {
        get: getLang,
        set: setLang,
        rewrite: rewriteProjectLinks,
        apply: applyBodyLang,
    };

    document.addEventListener(
        'click',
        function (e) {
            var el = e.target && e.target.closest && e.target.closest('.about-lang-btn, .ro-lang-btn');
            if (!el) return;
            if (!langBtnsReady) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }
            var lang = langFromControl(el);
            if (!lang) return;
            setLang(lang);
            applyBodyLang(lang);
            rewriteProjectLinks(lang);
        },
        true
    );

    function restoreLang() {
        var lang = syncLangFromPage() || getLang();
        applyBodyLang(lang);
        rewriteProjectLinks(lang || 'eng');
        stampInfoHrefs();
    }

    if (document.body) {
        restoreLang();
    } else {
        var langObs = new MutationObserver(function () {
            if (!document.body) return;
            langObs.disconnect();
            restoreLang();
        });
        langObs.observe(document.documentElement, { childList: true });
        document.addEventListener('DOMContentLoaded', restoreLang);
    }

    window.addEventListener('pageshow', function () {
        armLangButtons();
        restoreLang();
    });

    new MutationObserver(function () {
        var lang = getLang();
        if (lang !== 'kor' && lang !== 'eng') return;
        if (!document.documentElement.classList.contains('aom-lang-' + lang)) {
            applyHtmlLang(lang);
        }
        if (document.documentElement.getAttribute('data-aom-lang') !== lang) {
            document.documentElement.setAttribute('data-aom-lang', lang);
        }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    var typekit = document.createElement('link');
    typekit.rel = 'stylesheet';
    typekit.href = 'https://use.typekit.net/xzq8inj.css';
    document.head.appendChild(typekit);

    (function (d) {
        var config = {
            kitId: 'xzq8inj',
            scriptTimeout: 3000,
            async: true
        };
        var h = d.documentElement;
        var t = setTimeout(function () {
            h.classList.remove('wf-loading');
            h.classList.add('wf-inactive');
        }, config.scriptTimeout);
        var tk = d.createElement('script');
        var f = false;
        var s = d.getElementsByTagName('script')[0];
        h.classList.add('wf-loading');
        tk.src = 'https://use.typekit.net/' + config.kitId + '.js';
        tk.async = true;
        tk.onload = tk.onreadystatechange = function () {
            var a = this.readyState;
            if (f || (a && a !== 'complete' && a !== 'loaded')) return;
            f = true;
            clearTimeout(t);
            try {
                Typekit.load(config);
            } catch (e) {}
        };
        s.parentNode.insertBefore(tk, s);
    })(document);

    if (local) {
        return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', 'G-PTR5N20XFG');

    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-PTR5N20XFG';
    document.head.appendChild(ga);
})();
