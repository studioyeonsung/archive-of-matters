(function () {
    if (!document.body.classList.contains('page-fr-maas')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const media = Array.from(document.querySelectorAll('.fr-shot img, .fr-video video'));
    if (!media.length) return;

    function mediaSize(node) {
        if (node.tagName === 'VIDEO') {
            return { w: node.videoWidth, h: node.videoHeight };
        }
        return { w: node.naturalWidth, h: node.naturalHeight };
    }

    function classify(node) {
        const holder = node.closest('.fr-shot');
        if (!holder) return;
        const { w, h } = mediaSize(node);
        if (!w || !h) return;
        const inWatch = !!holder.closest('.fr-watch');
        holder.classList.toggle('is-portrait', h > w);
        holder.classList.toggle('is-tall', !inWatch && h / w > 9 / 16 + 0.02);
    }

    function scansFull(holder) {
        return holder.classList.contains('is-tall')
            || holder.classList.contains('fr-shot--tall')
            || (holder.classList.contains('is-portrait') && !holder.closest('.fr-watch'));
    }

    function pin() {
        const vh = window.innerHeight;
        for (let i = 0; i < media.length; i += 1) {
            const node = media[i];
            const holder = node.parentElement;
            if (!holder) continue;
            const top = holder.getBoundingClientRect().top;
            const imgH = node.offsetHeight;
            const holdH = holder.clientHeight;
            const overflow = Math.max(0, imgH - holdH);
            let y;
            if (scansFull(holder)) {
                const start = vh - holdH;
                const travel = Math.max(1, start);
                const progress = Math.min(1, Math.max(0, (start - top) / travel));
                y = -overflow * progress;
            } else {
                const desired = (vh - imgH) / 2 - top;
                y = Math.min(0, Math.max(-overflow, desired));
            }
            node.style.transform = `translate3d(0, ${y}px, 0)`;
        }
    }

    media.forEach((node) => {
        const after = () => {
            classify(node);
            pin();
        };
        classify(node);
        if (node.tagName === 'VIDEO') {
            if (node.readyState >= 1) after();
            else node.addEventListener('loadedmetadata', after, { once: true });
        } else if (!node.complete) {
            node.addEventListener('load', after, { once: true });
        }
    });

    const scroller = document.querySelector('.fr-main') || document.querySelector('.ro-main');
    if (scroller) scroller.addEventListener('scroll', pin, { passive: true });
    window.addEventListener('scroll', pin, { passive: true });
    window.addEventListener('resize', pin);
    document.addEventListener('scroll', pin, { passive: true, capture: true });
    if (document.readyState === 'complete') pin();
    else window.addEventListener('load', pin);
    pin();
})();
