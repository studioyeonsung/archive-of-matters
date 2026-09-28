/* 키워드 결과 화면: /keywords/?k=<키워드>&lang=en|ko
   - 영문 키워드를 골랐으면 영문으로만, 한글 키워드를 골랐으면 한글로만 보여준다.
   - 데이터는 /data/keywords.json (에디터가 프로젝트를 저장할 때마다 다시 만든다). */
(function () {
    'use strict';
    const K = window.AOMKeywords;
    const $ = (s) => document.querySelector(s);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

    const T = {
        en: { results: (n) => 'Search Results: ' + n, none: 'No projects with this keyword yet.', pick: 'Choose a keyword.', title: 'KEYWORDS' },
        ko: { results: (n) => '검색 결과: ' + n, none: '이 키워드의 프로젝트가 아직 없습니다.', pick: '키워드를 골라 주세요.', title: '키워드' }
    };

    // 어느 언어로 보여줄지: ?lang= → 입력한 키워드가 한글이면 ko → 사이트 언어 설정
    function pickLang(q, kw) {
        const p = new URLSearchParams(location.search).get('lang');
        if (p === 'ko' || p === 'en') return p;
        if (q && /[가-힣]/.test(q)) return 'ko';
        if (q && kw) return 'en';
        try { if ((localStorage.getItem('aom-lang') || '') === 'kor') return 'ko'; } catch (e) { /* 저장소 없음 */ }
        return 'en';
    }

    function card(p, lang) {
        const img = p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">' : '';
        return '<a class="kw-card" data-mat="' + esc(p.material) + '" href="' + esc(p.url) + '">' +
            '<span class="kw-mat">' + esc(p.materialName) + '</span>' +
            '<span class="kw-thumb">' + img + '</span>' +
            '<span class="kw-meta">' +
                '<h2 class="kw-title">' + esc(p.title) + '</h2>' +
                '<span class="kw-year">' + esc(p.year) + '</span>' +
                (p.type ? '<span class="kw-type">' + esc(p.type) + '</span>' : '') +
            '</span>' +
            (p.desc ? '<p class="kw-desc">' + esc(p.desc) + '</p>' : '') +
        '</a>';
    }

    function allKeywords(lang) {
        return '<div class="kw-all">' + K.all(lang).filter((k) => !K.isBlocked(k.id))
            .map((k) => '<a href="' + esc(K.url(k.id, lang)) + '">' + esc(k.label) + '</a>').join('') + '</div>';
    }

    async function render() {
        const main = $('#kw-main');
        const q = new URLSearchParams(location.search).get('k') || '';
        try { await K.load(); } catch (e) {
            main.querySelector('#kw-grid').innerHTML = '<p class="kw-empty">' + esc(e.message) + '</p>';
            return;
        }
        const kw = q && !K.isBlocked(q) ? K.find(q) : null;
        const lang = pickLang(q, kw);
        const t = T[lang];
        document.documentElement.lang = lang;
        main.setAttribute('lang', lang);

        if (!kw) {
            $('#kw-current').hidden = true;
            $('#kw-count').textContent = q ? t.none : t.pick;
            $('#kw-grid').innerHTML = allKeywords(lang);
            document.title = t.title + ' | ' + (lang === 'ko' ? '아카이브 오브 매터(즈)' : 'ARCHIVE OF MATTER(S)');
            return;
        }
        const label = lang === 'ko' ? kw.ko : kw.en;
        const list = K.projects(kw.id, lang);
        $('#kw-current').hidden = false;
        $('#kw-current').textContent = label;
        $('#kw-count').textContent = t.results(list.length);
        $('#kw-grid').innerHTML = list.length ? list.map((p) => card(p, lang)).join('') : '<p class="kw-empty">' + t.none + '</p>';
        document.title = label + ' | ' + (lang === 'ko' ? '아카이브 오브 매터(즈)' : 'ARCHIVE OF MATTER(S)');
    }

    // 결과 영역 좌우를 헤더 점선 양 끝에 맞춘다 (데스크탑)
    function alignToHeader() {
        const main = $('#kw-main');
        const l = $('.fixed-header .dotted-line-left');
        const r = $('.fixed-header .dotted-line-right');
        if (!l || !r || window.innerWidth <= 768) {
            main.style.removeProperty('--kw-left');
            main.style.removeProperty('--kw-right');
            return;
        }
        const w = document.documentElement.clientWidth;
        main.style.setProperty('--kw-left', Math.round(l.getBoundingClientRect().left) + 'px');
        main.style.setProperty('--kw-right', Math.round(w - r.getBoundingClientRect().right) + 'px');
    }

    render();
    alignToHeader();
    window.addEventListener('resize', alignToHeader);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignToHeader);
    window.addEventListener('load', alignToHeader);
    window.addEventListener('popstate', render);
})();
