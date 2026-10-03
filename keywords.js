/**
 * AOMKeywords — 키워드로 프로젝트 찾기 (data/keywords.json 을 읽는다)
 *
 * 한글·영문 어느 쪽으로 물어도 같은 키워드로 찾는다. 대소문자·띄어쓰기·하이픈 차이는 무시.
 *
 *   await AOMKeywords.load();
 *   AOMKeywords.find('날씨')                → { id:'weather', en:'Weather', ko:'날씨', count, projects:[...] }
 *   AOMKeywords.find('weather')             → 같은 키워드
 *   AOMKeywords.projects('필드 리서치', 'ko') → 해당 프로젝트들 (한글 제목·주소로)
 *   AOMKeywords.all('ko')                   → 전체 키워드 [{ id, label, count }]
 *   AOMKeywords.suggest('dust', 'en')       → 일부만 입력해도 맞는 키워드들
 *   AOMKeywords.related('weather', 'ko')    → 같은 프로젝트에 함께 붙은 키워드들
 *   AOMKeywords.fromUrl()                   → 주소의 ?k=… 로 고른 키워드 (링크 공유용)
 *   AOMKeywords.url('weather', 'ko')        → '/keywords/?k=weather&lang=ko'
 *   AOMKeywords.linkTags()                  → 상세 페이지 키워드 태그를 결과 화면 링크로
 */
(function () {
    'use strict';

    const SRC = '/data/keywords.json';
    // 아직 연결할 결과가 없는 키워드: 눌러도 이동하지 않는다
    const BLOCKED = ['Archive of Matter(s)', '아카이브 오브 매터(즈)', 'archive-of-matter-s'];
    let data = null;
    let loading = null;
    const byTerm = new Map();   // 정규화된 표기 → 키워드

    // scripts/build_keywords.py 의 norm() 과 같은 규칙
    const norm = (s) => String(s || '').normalize('NFC').toLowerCase()
        .replace(/[\s\-_·・.,:;/()《》「」'"‘’“”]+/g, '');

    const pageLang = () => (document.documentElement.lang === 'ko' ? 'ko' : 'en');

    function index(d) {
        data = d;
        byTerm.clear();
        d.keywords.forEach((k) => {
            [k.id, k.en, k.ko].concat(k.aliases || [], k.terms || []).forEach((t) => byTerm.set(norm(t), k));
        });
        return d;
    }

    function project(url, lang) {
        const p = data.projects[url];
        if (!p) return null;
        lang = lang || pageLang();
        return {
            id: url,
            url: p.url[lang] || p.url.en,
            title: p.title[lang] || p.title.en,
            type: p.type[lang] || p.type.en,
            status: p.status[lang] || p.status.en,
            year: p.year,
            desc: (p.desc && (p.desc[lang] || p.desc.en)) || '',
            image: p.image,
            material: p.material,
            materialName: p.materialName[lang] || p.materialName.en,
            listed: p.listed,
            keywords: p.keywords.map((id) => label(id, lang)).filter(Boolean)
        };
    }

    function label(id, lang) {
        const k = data.keywords.find((x) => x.id === id);
        return k ? { id: k.id, label: lang === 'ko' ? k.ko : k.en } : null;
    }

    const api = {
        norm,

        // 한 번만 받아 온다. 에디터에서 키워드를 고치면 파일이 다시 만들어지므로, 새로 열 때마다 최신이다.
        load(opts) {
            if (data && !(opts && opts.fresh)) return Promise.resolve(data);
            if (loading && !(opts && opts.fresh)) return loading;
            const bust = opts && opts.fresh ? '?t=' + Date.now() : '';
            loading = fetch(SRC + bust, { cache: 'no-cache' })
                .then((r) => { if (!r.ok) throw new Error('keywords.json ' + r.status); return r.json(); })
                .then(index);
            return loading;
        },

        get ready() { return !!data; },

        // 한글/영문/별칭 어느 것이든 → 키워드 (없으면 null)
        find(q) {
            if (!data || q == null) return null;
            if (typeof q === 'object') return q;
            return byTerm.get(norm(q)) || null;
        },

        // 키워드에 해당하는 프로젝트들 (최신 연도 순)
        projects(q, lang) {
            const k = api.find(q);
            return k ? k.projects.map((u) => project(u, lang)).filter(Boolean) : [];
        },

        // 여러 키워드를 모두 가진 프로젝트 (AND)
        projectsAll(qs, lang) {
            const ks = qs.map(api.find);
            if (!ks.length || ks.some((k) => !k)) return [];
            return ks[0].projects.filter((u) => ks.every((k) => k.projects.includes(u))).map((u) => project(u, lang));
        },

        all(lang) {
            lang = lang || pageLang();
            return data ? data.keywords.map((k) => ({ id: k.id, label: lang === 'ko' ? k.ko : k.en, en: k.en, ko: k.ko, count: k.count })) : [];
        },

        // 입력 중 자동완성: 앞부분이 맞는 것 먼저, 그다음 중간에 들어 있는 것
        suggest(q, lang, limit) {
            const n = norm(q);
            if (!data || !n) return [];
            const hit = (k) => [k.en, k.ko].concat(k.aliases || []).map(norm);
            const starts = data.keywords.filter((k) => hit(k).some((t) => t.startsWith(n)));
            const inside = data.keywords.filter((k) => !starts.includes(k) && hit(k).some((t) => t.includes(n)));
            return starts.concat(inside).slice(0, limit || 10)
                .map((k) => ({ id: k.id, label: (lang || pageLang()) === 'ko' ? k.ko : k.en, count: k.count }));
        },

        // 같은 프로젝트에 함께 붙은 키워드 (많이 겹치는 순)
        related(q, lang, limit) {
            const k = api.find(q);
            if (!k) return [];
            const score = new Map();
            k.projects.forEach((u) => data.projects[u].keywords.forEach((id) => {
                if (id !== k.id) score.set(id, (score.get(id) || 0) + 1);
            }));
            return Array.from(score.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit || 8)
                .map(([id, n]) => Object.assign(label(id, lang || pageLang()), { shared: n }));
        },

        // 두 언어 표기를 함께: "Weather · 날씨"
        both(q) {
            const k = api.find(q);
            return k ? (k.en === k.ko ? k.en : k.en + ' · ' + k.ko) : '';
        },

        isBlocked(q) {
            const k = api.find(q);
            return BLOCKED.some((b) => norm(b) === norm(typeof q === 'object' ? q.id : q) || (k && norm(b) === norm(k.id)));
        },

        url(q, lang) {
            const k = api.find(q);
            return '/keywords/?k=' + encodeURIComponent(k ? k.id : q) + (lang ? '&lang=' + lang : '');
        },

        // 프로젝트 상세 페이지의 키워드 태그(span.ro-tag)를 결과 화면 링크로 바꾼다
        // 뉴스 태그(.news-tag)는 프로젝트 키워드가 아니어도 링크한다 (결과 화면이 '아직 없음' 을 보여준다)
        async linkTags(root, selector) {
            root = root || document;
            const sel = selector || 'ul.ro-tags .ro-tag:not(a), .ro-status .ro-tag:not(a)';
            if (!root.querySelector(sel)) return;
            try { await api.load(); } catch (e) { return; }
            // 색인을 받는 동안 필드 리서치가 흰 글씨 복제본을 만든다. 그 다음에 다시 찾는다.
            root.querySelectorAll(sel).forEach((el) => {
                const text = el.textContent.trim();
                const k = api.find(text);
                if (api.isBlocked(k || text)) return;
                if (!k && !el.classList.contains('news-tag')) return;
                // 뉴스처럼 영문·한글 칸이 한 페이지에 있으면 칸을 먼저 본다 (페이지 lang 은 그다음)
                const col = el.closest('.about-col-kor, .about-col-eng');
                const lang = col ? (col.classList.contains('about-col-kor') ? 'ko' : 'en')
                    : (el.closest('[lang]') || document.documentElement).getAttribute('lang') === 'ko' ? 'ko' : 'en';
                const a = document.createElement('a');
                a.className = el.className + (el.classList.contains('news-tag') ? ' news-tag--link' : ' ro-tag--link');
                a.href = k ? api.url(k.id, lang) : '/keywords/?k=' + encodeURIComponent(text) + '&lang=' + lang;
                a.innerHTML = el.innerHTML;
                el.replaceWith(a);
            });
        },

        fromUrl() {
            const k = new URLSearchParams(location.search).get('k');
            return k ? api.find(k) : null;
        }
    };

    window.AOMKeywords = api;
})();
