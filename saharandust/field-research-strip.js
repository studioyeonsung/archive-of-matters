(function () {
    const stage = document.querySelector('.wh-stage');
    const track = document.querySelector('.wh-track');
    if (!stage || !track) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = 36;
    const seed = Number(stage.getAttribute('data-layout-seed')) || 0;

    function hash01(n) {
        const t = Math.sin((n + seed * 1.618) * 12.9898 + 78.233 + seed) * 43758.5453;
        return t - Math.floor(t);
    }

    function shotSrc(shot) {
        const img = shot.querySelector('img');
        return (img && img.getAttribute('src')) || '';
    }

    function applyOrder(nodes) {
        nodes.forEach((shot, idx) => {
            track.appendChild(shot);
            const img = shot.querySelector('img');
            if (!img) return;
            if (idx === 0) {
                img.setAttribute('fetchpriority', 'high');
                img.removeAttribute('loading');
            } else {
                img.removeAttribute('fetchpriority');
                if (idx >= 7) img.setAttribute('loading', 'lazy');
                else img.removeAttribute('loading');
            }
        });
    }

    let originals = Array.from(track.children);
    if (stage.hasAttribute('data-shuffle-order')) {
        for (let i = originals.length - 1; i > 0; i -= 1) {
            const j = Math.min(i, Math.floor(hash01(i + 101) * (i + 1)));
            const tmp = originals[i];
            originals[i] = originals[j];
            originals[j] = tmp;
        }
    }
    const leadName = stage.getAttribute('data-lead-image');
    if (leadName) {
        const idx = originals.findIndex((shot) => shotSrc(shot).indexOf(leadName) !== -1);
        if (idx > 0) {
            const lead = originals.splice(idx, 1)[0];
            originals.unshift(lead);
        }
    }
    if (stage.hasAttribute('data-shuffle-order') || leadName) {
        applyOrder(originals);
    }

    function assignHeights(nodes) {
        const BASE = [1, 0.76, 0.52, 0.3];
        const rot = Math.floor(hash01(3) * BASE.length);
        const SCALES = BASE.slice(rot).concat(BASE.slice(0, rot));
        const cropChance = 0.28 + hash01(7) * 0.38;

        function pickOther(s, from, minSteps) {
            const fromIdx = Math.max(0, SCALES.indexOf(from));
            const far = SCALES.filter((_, k) => Math.abs(k - fromIdx) >= minSteps);
            const pool = far.length ? far : SCALES.filter((v) => v !== from);
            return pool[Math.floor(hash01(s) * pool.length)];
        }

        let i = 0;
        let mode = 'run';
        let runScale = SCALES[Math.floor(hash01(5) * SCALES.length)];

        while (i < nodes.length) {
            if (mode === 'run') {
                const len = i === 0 ? 1 : 2 + Math.floor(hash01(i + 11) * 2);
                const end = Math.min(nodes.length, i + len);
                const scale = i === 0 ? 1 : runScale;
                for (let j = i; j < end; j += 1) {
                    nodes[j].style.setProperty('--wh-h', String(scale));
                }
                i = end;
                mode = 'jump';
            } else {
                const jumpScale = pickOther(i + 19, runScale, 2);
                const len = hash01(i + 23) > 0.58 ? 2 : 1;
                const end = Math.min(nodes.length, i + len);
                for (let j = i; j < end; j += 1) {
                    nodes[j].style.setProperty('--wh-h', String(jumpScale));
                }
                i = end;
                runScale = pickOther(i + 31, jumpScale, 1);
                mode = 'run';
            }
        }

        if (nodes[0]) nodes[0].style.setProperty('--wh-h', '1');
        if (nodes[1]) {
            const fromIdx = 0;
            const far = BASE.filter((_, k) => Math.abs(k - fromIdx) >= 2);
            nodes[1].style.setProperty('--wh-h', String(far[Math.floor(hash01(2) * far.length)]));
        }

        let runStart = 0;
        for (let j = 1; j <= nodes.length; j += 1) {
            const prev = nodes[runStart].style.getPropertyValue('--wh-h');
            const cur = j < nodes.length ? nodes[j].style.getPropertyValue('--wh-h') : '';
            if (cur === prev) continue;
            const runLen = j - runStart;
            if (runLen > 3) {
                for (let k = runStart + 3; k < j; k += 1) {
                    const from = Number(nodes[k - 1].style.getPropertyValue('--wh-h'));
                    nodes[k].style.setProperty('--wh-h', String(pickOther(k + 41, from, 1)));
                }
            }
            runStart = j;
        }

        nodes.forEach((shot, j) => {
            const img = shot.querySelector('img');
            const w = Number(img && img.getAttribute('width')) || 1600;
            const h = Number(img && img.getAttribute('height')) || 1200;
            const landscape = w >= h;
            const cropY = j !== 0 && landscape && hash01(j + 27) > cropChance;
            shot.classList.toggle('wh-shot--crop-y', cropY);
            if (cropY) {
                shot.style.setProperty('--wh-pos', 18 + hash01(j + 53) * 64 + '% center');
            }
        });
    }

    assignHeights(originals);

    originals.forEach((shot) => {
        track.appendChild(shot.cloneNode(true));
    });

    let setWidth = 0;
    let offset = 0;
    let last = performance.now();
    let lastRaf = 0;
    let dragging = false;
    let dragX = 0;
    let dragY = 0;
    let dragOffset = 0;
    let vel = 0;
    let lastPx = 0;
    let lastPy = 0;
    let lastPt = 0;
    let resumeAt = 0;
    let lastInkKey = '';
    let lastVw = 0;
    let lastVh = 0;
    let shotW = [];
    let shotH = [];
    let shotTop = [];
    let prefix = [];
    let overlayRel = { left: 0, top: 0, width: 0, height: 0 };

    function measure() {
        shotW = originals.map((el) => el.offsetWidth);
        shotH = originals.map((el) => el.offsetHeight);
        shotTop = originals.map((el) => el.offsetTop);
        prefix = originals.map((el) => el.offsetLeft);
        const lastShot = originals[originals.length - 1];
        setWidth = lastShot ? lastShot.offsetLeft + lastShot.offsetWidth : 0;
        if (overlay) {
            const stageBox = stage.getBoundingClientRect();
            const band = overlay.getBoundingClientRect();
            overlayRel = {
                left: band.left - stageBox.left,
                top: band.top - stageBox.top,
                width: band.width,
                height: band.height
            };
        }
    }

    function wrap() {
        if (setWidth <= 0) return;
        offset %= setWidth;
        if (offset < 0) offset += setWidth;
    }

    const overlay = document.querySelector('.wh-overlay');
    let cut = null;

    function ensureCut() {
        if (cut || !overlay) return;
        cut = overlay.cloneNode(true);
        cut.classList.add('wh-overlay--cut');
        cut.setAttribute('aria-hidden', 'true');
        cut.querySelectorAll('[aria-label]').forEach((el) => el.removeAttribute('aria-label'));
        cut.style.clipPath = 'inset(100%)';
        cut.style.webkitClipPath = 'inset(100%)';
        overlay.after(cut);
        if (window.AOMKeywords) window.AOMKeywords.linkTags(cut);
    }

    function apply() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (vw !== lastVw || vh !== lastVh) {
            lastVw = vw;
            lastVh = vh;
            lastInkKey = '';
            measure();
        }
        wrap();
        track.style.transform = 'translate3d(' + -offset + 'px,0,0)';
        updateInk();
    }

    function collectInkRects() {
        const rects = [];
        const n = originals.length;
        if (!n || !setWidth) return rects;
        const oL = overlayRel.left;
        const oT = overlayRel.top;
        const oR = oL + overlayRel.width;
        const oB = oT + overlayRel.height;
        for (let copy = 0; copy < 2; copy += 1) {
            const base = copy * setWidth - offset;
            for (let i = 0; i < n; i += 1) {
                const sl = base + prefix[i];
                const sr = sl + shotW[i];
                const st = shotTop[i];
                const sb = st + shotH[i];
                if (sr <= oL || sl >= oR || sb <= oT || st >= oB) continue;
                const x1 = Math.max(0, sl - oL);
                const y1 = Math.max(0, st - oT);
                const x2 = Math.min(overlayRel.width, sr - oL);
                const y2 = Math.min(overlayRel.height, sb - oT);
                const w = x2 - x1;
                const h = y2 - y1;
                if (w < 1 || h < 1) continue;
                rects.push({ x: x1, y: y1, w: w, h: h });
            }
        }
        return rects;
    }

    function inkKey(rects) {
        if (!rects.length) return '0';
        let key = overlayRel.width.toFixed(1) + 'x' + overlayRel.height.toFixed(1) + ';';
        for (let i = 0; i < rects.length; i += 1) {
            const r = rects[i];
            key += r.x.toFixed(2) + ',' + r.y.toFixed(2) + ',' + r.w.toFixed(2) + ',' + r.h.toFixed(2) + ';';
        }
        return key;
    }

    function setClip(el, value) {
        el.style.clipPath = value;
        el.style.webkitClipPath = value;
    }

    function rectPath(r) {
        return 'M' + r.x + ',' + r.y + 'h' + r.w + 'v' + r.h + 'h' + -r.w + 'z';
    }

    function applyInk(rects) {
        ensureCut();
        if (!cut) return;
        if (!rects.length) {
            setClip(overlay, 'none');
            setClip(cut, 'inset(100%)');
            return;
        }
        let d = '';
        for (let i = 0; i < rects.length; i += 1) {
            d += rectPath(rects[i]);
        }
        const w = overlayRel.width;
        const h = overlayRel.height;
        setClip(overlay, 'path(evenodd, "M0,0h' + w + 'v' + h + 'h' + -w + 'z' + d + '")');
        setClip(cut, 'path("' + d + '")');
    }

    function updateInk() {
        if (!overlay) return;
        const rects = collectInkRects();
        const key = inkKey(rects);
        if (key === lastInkKey) return;
        lastInkKey = key;
        applyInk(rects);
    }

    function tick(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!dragging) {
            if (Math.abs(vel) > 0.015) {
                offset += vel * (dt * 1000);
                vel *= Math.pow(0.92, dt * 60);
                if (Math.abs(vel) < 0.015) {
                    vel = 0;
                    resumeAt = now + 700;
                }
            } else if (now >= resumeAt && !reduceMotion) {
                offset += SPEED * dt;
            }
        }
        apply();
    }

    function loop(now) {
        lastRaf = now;
        tick(now);
        window.requestAnimationFrame(loop);
    }

    function onWheel(e) {
        if (e.ctrlKey) return;
        if (document.querySelector('.nav-overlay.is-open')) return;
        e.preventDefault();
        vel = 0;
        offset += e.deltaY + e.deltaX;
        resumeAt = performance.now() + 900;
        apply();
    }

    window.addEventListener('wheel', onWheel, { passive: false });

    function pointerDelta(e) {
        return (e.clientX - dragX) + (e.clientY - dragY);
    }

    stage.addEventListener('pointerdown', (e) => {
        if (e.button && e.button !== 0) return;
        // 키워드 링크를 누를 때는 드래그를 시작하지 않는다 (포인터를 붙잡으면 클릭이 링크에 가지 않음)
        if (e.target.closest && e.target.closest('a[href]')) return;
        if (document.querySelector('.nav-overlay.is-open')) return;
        dragging = true;
        vel = 0;
        dragX = e.clientX;
        dragY = e.clientY;
        dragOffset = offset;
        lastPx = e.clientX;
        lastPy = e.clientY;
        lastPt = performance.now();
        stage.classList.add('is-dragging');
        try {
            stage.setPointerCapture(e.pointerId);
        } catch (err) {}
    });

    stage.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const now = performance.now();
        const inst = -((e.clientX - lastPx) + (e.clientY - lastPy));
        const dms = now - lastPt;
        if (dms > 0 && dms < 80) {
            vel = vel * 0.55 + (inst / dms) * 0.45;
        }
        lastPx = e.clientX;
        lastPy = e.clientY;
        lastPt = now;
        offset = dragOffset - pointerDelta(e);
        apply();
    });

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        stage.classList.remove('is-dragging');
        if (performance.now() - lastPt > 80) vel = 0;
        vel = Math.max(-3.8, Math.min(3.8, vel));
        resumeAt = performance.now() + (Math.abs(vel) > 0.04 ? 0 : 900);
    }

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('lostpointercapture', endDrag);

    stage.addEventListener('touchmove', (e) => {
        if (!dragging) return;
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('resize', () => {
        lastInkKey = '';
        measure();
        apply();
    });

    window.addEventListener('load', () => {
        lastInkKey = '';
        measure();
        apply();
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            lastInkKey = '';
            measure();
            apply();
        });
    }

    measure();
    ensureCut();
    apply();
    [120, 400, 900].forEach((ms) => {
        window.setTimeout(() => {
            lastInkKey = '';
            measure();
            apply();
        }, ms);
    });
    last = performance.now();
    window.requestAnimationFrame(loop);
    if (!window.matchMedia('(pointer: coarse)').matches) {
        window.setInterval(() => {
            const now = performance.now();
            if (now - lastRaf < 80) return;
            tick(now);
        }, 50);
    }
})();
