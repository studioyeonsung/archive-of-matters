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
            h.className = h.className.replace(/\bwf-loading\b/g, '') + ' wf-inactive';
        }, config.scriptTimeout);
        var tk = d.createElement('script');
        var f = false;
        var s = d.getElementsByTagName('script')[0];
        h.className += ' wf-loading';
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
