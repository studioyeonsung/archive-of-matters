(function () {
    if (!document.body.classList.contains('page-rusty-odyssey')) return;

    const tabs = Array.from(document.querySelectorAll('.ro-tab'));
    const panels = Array.from(document.querySelectorAll('.ro-panel'));
    if (tabs.length && panels.length) {
        function panelHasContent(panel) {
            if (!panel) return false;
            return (panel.textContent || '').replace(/\s+/g, ' ').trim().length > 0;
        }

        function panelForTab(tab) {
            const id = tab.getAttribute('aria-controls') || `ro-panel-${tab.dataset.tab}`;
            return document.getElementById(id);
        }

        function isTabEnabled(tab) {
            return !tab.disabled && !tab.classList.contains('is-disabled');
        }

        function enabledTabs() {
            return tabs.filter(isTabEnabled);
        }

        tabs.forEach((tab) => {
            const empty = !panelHasContent(panelForTab(tab));
            tab.classList.toggle('is-disabled', empty);
            tab.disabled = empty;
            tab.setAttribute('aria-disabled', empty ? 'true' : 'false');
            if (empty) {
                tab.classList.remove('is-active');
                tab.setAttribute('aria-selected', 'false');
                tab.tabIndex = -1;
            }
        });

        function activate(tabId) {
            const target = tabs.find((tab) => tab.dataset.tab === tabId && isTabEnabled(tab));
            if (!target) return;

            tabs.forEach((tab) => {
                const selected = tab === target;
                tab.classList.toggle('is-active', selected);
                tab.setAttribute('aria-selected', selected ? 'true' : 'false');
                tab.tabIndex = selected ? 0 : -1;
            });

            panels.forEach((panel) => {
                const match = panel.id === `ro-panel-${tabId}`;
                panel.classList.toggle('is-active', match);
                if (match) {
                    panel.removeAttribute('hidden');
                } else {
                    panel.setAttribute('hidden', '');
                }
            });
        }

        const activeTab = tabs.find((tab) => tab.classList.contains('is-active') && isTabEnabled(tab));
        const firstEnabled = enabledTabs()[0];
        if (activeTab) {
            activate(activeTab.dataset.tab);
        } else if (firstEnabled) {
            activate(firstEnabled.dataset.tab);
        }

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                if (!isTabEnabled(tab)) return;
                activate(tab.dataset.tab);
            });

            tab.addEventListener('keydown', (e) => {
                if (!isTabEnabled(tab)) return;
                const live = enabledTabs();
                const i = live.indexOf(tab);
                if (i < 0) return;
                let next = -1;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % live.length;
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + live.length) % live.length;
                if (e.key === 'Home') next = 0;
                if (e.key === 'End') next = live.length - 1;
                if (next < 0) return;
                e.preventDefault();
                live[next].focus();
                activate(live[next].dataset.tab);
            });
        });
    }

    /* Large stills: float up on scroll */
    const stills = Array.from(document.querySelectorAll('.ro-still'));
    if (stills.length) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            stills.forEach((el) => el.classList.add('is-revealed'));
        } else {
            const io = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add('is-revealed');
                        io.unobserve(entry.target);
                    });
                },
                { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
            );
            stills.forEach((el) => io.observe(el));
        }
    }

    /* Footer arrows */
    const prevBtn = document.querySelector('.ro-footer-arrow--prev');
    const nextBtn = document.querySelector('.ro-footer-arrow--next');
    if (prevBtn || nextBtn) {
        const path = window.location.pathname.replace(/\/+$/, '') + '/';
        const isKo = /\/ko\/$/.test(path);
        const copperMatch = path.match(/\/copper\/rusty-odyssey\/([^/]+)\//);
        const copperSlug = copperMatch && copperMatch[1] !== 'ko' ? copperMatch[1] : null;

        if (copperSlug) {
            const PROJECT_SLUGS = ['exhibition', 'film', 'installation', 'essay'];
            const index = PROJECT_SLUGS.indexOf(copperSlug);

            function projectUrl(i) {
                const s = PROJECT_SLUGS[i];
                return isKo
                    ? `/copper/rusty-odyssey/${s}/ko/`
                    : `/copper/rusty-odyssey/${s}/`;
            }

            if (index >= 0) {
                const prevIndex = (index - 1 + PROJECT_SLUGS.length) % PROJECT_SLUGS.length;
                const nextIndex = (index + 1) % PROJECT_SLUGS.length;
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        window.location.href = projectUrl(prevIndex);
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        window.location.href = projectUrl(nextIndex);
                    });
                }
            }
        } else if (path.indexOf('/finedust/') === 0 && path !== '/finedust/') {
            const PROJECT_SLUGS = ['operation-d/02-changwon', 'operation-d/01-seoul', 'd-d-d-d/lecture-performance', 'd-d-d-d/exhibition', 'd-d-d-d/activism-performance', 'd-scape/2', 'd-scape/1', 'd-beacon'];
            const slug = path
                .replace(/^\/finedust\//, '')
                .replace(/\/ko\/$/, '/')
                .replace(/\/$/, '');
            const index = PROJECT_SLUGS.indexOf(slug);

            function projectUrl(i) {
                const s = PROJECT_SLUGS[i];
                return isKo ? `/finedust/${s}/ko/` : `/finedust/${s}/`;
            }

            if (index >= 0) {
                const prevIndex = (index - 1 + PROJECT_SLUGS.length) % PROJECT_SLUGS.length;
                const nextIndex = (index + 1) % PROJECT_SLUGS.length;
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        window.location.href = projectUrl(prevIndex);
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        window.location.href = projectUrl(nextIndex);
                    });
                }
            } else {
                const listUrl = '/finedust/';
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        window.location.href = listUrl;
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        window.location.href = listUrl;
                    });
                }
            }
        } else if (path.indexOf('/saharandust/') === 0 && path !== '/saharandust/') {
            const PROJECT_SLUGS = [
                'wind-sand-dust',
                'algeria-field-research',
                'morocco-field-research',
                'xiren',
                'xiren-0-1v',
                'x-scene',
            ];
            const slug = path
                .replace(/^\/saharandust\//, '')
                .replace(/\/ko\/$/, '/')
                .replace(/\/$/, '');
            const index = PROJECT_SLUGS.indexOf(slug);

            function projectUrl(i) {
                const s = PROJECT_SLUGS[i];
                return isKo ? `/saharandust/${s}/ko/` : `/saharandust/${s}/`;
            }

            if (index >= 0) {
                const prevIndex = (index - 1 + PROJECT_SLUGS.length) % PROJECT_SLUGS.length;
                const nextIndex = (index + 1) % PROJECT_SLUGS.length;
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        window.location.href = projectUrl(prevIndex);
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        window.location.href = projectUrl(nextIndex);
                    });
                }
            } else {
                const listUrl = '/saharandust/';
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        window.location.href = listUrl;
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        window.location.href = listUrl;
                    });
                }
            }
        } else if (path.indexOf('/weather/') === 0 && path !== '/weather/') {
            const PROJECT_SLUGS = [
                'bring-your-own-bike/05-taehwa-river-ulsan',
                'bring-your-own-bike/04-botlek-rotterdam',
                'bring-your-own-bike/03-westhafen-berlin',
                'cynthesizer',
                'bring-your-own-bike/02-waalhaven-rotterdam',
                'bring-your-own-bike/01-westpoort-amsterdam',
                'rooftop-radio',
                'weathering-ports',
            ];
            const slug = path
                .replace(/^\/weather\//, '')
                .replace(/\/ko\/$/, '/')
                .replace(/\/$/, '');
            const index = PROJECT_SLUGS.indexOf(slug);

            function projectUrl(i) {
                const s = PROJECT_SLUGS[i];
                return isKo ? `/weather/${s}/ko/` : `/weather/${s}/`;
            }

            if (index >= 0) {
                const prevIndex = (index - 1 + PROJECT_SLUGS.length) % PROJECT_SLUGS.length;
                const nextIndex = (index + 1) % PROJECT_SLUGS.length;
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        window.location.href = projectUrl(prevIndex);
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        window.location.href = projectUrl(nextIndex);
                    });
                }
            } else {
                const listUrl = '/weather/';
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        window.location.href = listUrl;
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        window.location.href = listUrl;
                    });
                }
            }
        }
    }

    function initMobileLangHideOnScroll() {
        const scroller = document.querySelector('.ro-main');
        if (!scroller) return;

        const HIDE_AFTER = 24;
        const DELTA = 6;
        let lastY = scroller.scrollTop;
        let ticking = false;

        const apply = () => {
            ticking = false;
            if (window.innerWidth > 768) {
                document.body.classList.remove('is-lang-hidden');
                return;
            }

            const y = scroller.scrollTop;
            const dy = y - lastY;
            lastY = y;

            if (y <= HIDE_AFTER) {
                document.body.classList.remove('is-lang-hidden');
                return;
            }
            if (dy > DELTA) {
                document.body.classList.add('is-lang-hidden');
            } else if (dy < -DELTA) {
                document.body.classList.remove('is-lang-hidden');
            }
        };

        scroller.addEventListener(
            'scroll',
            () => {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(apply);
            },
            { passive: true }
        );

        window.addEventListener('resize', () => {
            lastY = scroller.scrollTop;
            apply();
        });
    }

    initMobileLangHideOnScroll();

    function initYouTubeEmbed() {
        const wrap = document.getElementById('ro-youtube');
        const iframe = document.getElementById('ro-youtube-iframe');
        const playBtn = document.getElementById('ro-youtube-play');
        if (!wrap || !iframe) return;

        const playSrcInitial = iframe.getAttribute('src') || '';
        let playSrc = playSrcInitial;
        let player = null;
        let readyTimer = 0;
        let revealPoll = 0;
        let userPaused = false;

        function command(func) {
            if (player && typeof player[func] === 'function') {
                try {
                    player[func]();
                    return;
                } catch (e) {}
            }
            const win = iframe.contentWindow;
            if (!win) return;
            win.postMessage(
                JSON.stringify({ event: 'command', func: func, args: [] }),
                'https://www.youtube.com'
            );
        }

        function markReady() {
            wrap.classList.add('is-ready');
        }

        function setPlaying(playing) {
            wrap.classList.toggle('is-playing', playing);
            if (playBtn) {
                playBtn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
            }
        }

        function setMaxQuality() {
            if (!player) return;
            try {
                const levels = player.getAvailableQualityLevels ? player.getAvailableQualityLevels() : [];
                const preferred = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720'];
                let pick = 'hd1080';
                if (levels && levels.length) {
                    pick = preferred.find((q) => levels.indexOf(q) !== -1) || levels[0];
                }
                if (player.setPlaybackQualityRange) {
                    player.setPlaybackQualityRange(pick, pick);
                }
                if (player.setPlaybackQuality) {
                    player.setPlaybackQuality(pick);
                }
            } catch (e) {}
        }

        function hideCaptions() {
            if (!player) return;
            try {
                if (player.unloadModule) {
                    player.unloadModule('captions');
                    player.unloadModule('cc');
                }
            } catch (e) {}
            try {
                if (player.setOption) {
                    player.setOption('captions', 'track', {});
                    player.setOption('cc', 'track', {});
                }
            } catch (e) {}
        }

        function playMuted() {
            command('mute');
            command('playVideo');
            hideCaptions();
        }

        function canReveal() {
            if (!player) return false;
            try {
                const state = player.getPlayerState();
                const loaded = player.getVideoLoadedFraction ? player.getVideoLoadedFraction() : 0;
                const time = player.getCurrentTime ? player.getCurrentTime() : 0;
                return state === 1 && (loaded > 0.02 || time > 0.2);
            } catch (e) {
                return false;
            }
        }

        function stopRevealWatch() {
            if (readyTimer) {
                window.clearTimeout(readyTimer);
                readyTimer = 0;
            }
            if (revealPoll) {
                window.clearInterval(revealPoll);
                revealPoll = 0;
            }
        }

        function maybeReveal() {
            if (wrap.classList.contains('is-ready')) {
                stopRevealWatch();
                return;
            }
            if (canReveal()) markReady();
        }

        function startRevealWatch() {
            if (wrap.classList.contains('is-ready') || revealPoll) return;
            maybeReveal();
            let tries = 0;
            revealPoll = window.setInterval(() => {
                tries += 1;
                maybeReveal();
                if (wrap.classList.contains('is-ready')) {
                    stopRevealWatch();
                    return;
                }
                if (tries >= 16 && wrap.classList.contains('is-playing')) {
                    markReady();
                    stopRevealWatch();
                }
            }, 250);
        }

        function togglePlayback() {
            if (!player) {
                playMuted();
                return;
            }
            let state = -1;
            try {
                if (typeof player.getPlayerState === 'function') {
                    state = player.getPlayerState();
                }
            } catch (e) {}
            if (state === 1) {
                userPaused = true;
                command('pauseVideo');
                setPlaying(false);
                return;
            }
            userPaused = false;
            command('playVideo');
            try {
                if (player.unMute) player.unMute();
            } catch (e) {}
            setPlaying(true);
        }

        function attachPlayer() {
            if (player || !window.YT || !window.YT.Player) return;
            player = new window.YT.Player(iframe, {
                events: {
                    onReady: function () {
                        setMaxQuality();
                        hideCaptions();
                        playMuted();
                    },
                    onStateChange: function (e) {
                        const state = e && e.data;
                        if (state === 1) {
                            userPaused = false;
                            setPlaying(true);
                            setMaxQuality();
                            hideCaptions();
                            startRevealWatch();
                        } else if (state === 0) {
                            if (userPaused) {
                                setPlaying(false);
                                return;
                            }
                            try {
                                if (player.seekTo) player.seekTo(0, true);
                            } catch (e) {}
                            command('playVideo');
                            setPlaying(true);
                        } else if (state === 2) {
                            setPlaying(false);
                            if (!wrap.classList.contains('is-ready') && !userPaused) {
                                if (readyTimer) window.clearTimeout(readyTimer);
                                playMuted();
                            }
                        }
                    }
                }
            });
        }

        function loadApi() {
            if (window.YT && window.YT.Player) {
                attachPlayer();
                return;
            }
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = function () {
                if (typeof prev === 'function') prev();
                attachPlayer();
            };
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(script);
            }
        }

        try {
            const url = new URL(iframe.src, window.location.href);
            if (!url.searchParams.get('origin')) {
                url.searchParams.set('origin', window.location.origin);
            }
            const videoId = url.pathname.split('/').filter(Boolean).pop() || '';
            url.searchParams.set('loop', '1');
            url.searchParams.set('cc_load_policy', '0');
            url.searchParams.set('iv_load_policy', '3');
            if (videoId) url.searchParams.set('playlist', videoId);
            const nextSrc = url.toString();
            iframe.src = nextSrc;
            playSrc = nextSrc;
        } catch (e) {}

        loadApi();
        iframe.addEventListener('load', playMuted);

        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePlayback();
            });
        }
        wrap.addEventListener('click', () => {
            togglePlayback();
        });

        function pauseVideo() {
            command('pauseVideo');
            setPlaying(false);
        }

        function unloadVideo() {
            wrap.classList.remove('is-ready', 'is-playing');
            command('stopVideo');
            pauseVideo();
            iframe.src = 'about:blank';
        }

        function restoreVideo() {
            if (playSrc && iframe.getAttribute('src') !== playSrc) {
                iframe.src = playSrc;
            }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                userPaused = true;
                pauseVideo();
            }
        });
        window.addEventListener('pagehide', unloadVideo);
        window.addEventListener('beforeunload', unloadVideo);
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) restoreVideo();
        });

        document.addEventListener(
            'click',
            (e) => {
                const leave = e.target.closest('a[href], .ro-footer-arrow');
                if (!leave) return;
                const href = leave.getAttribute && leave.getAttribute('href');
                if (href && (href.charAt(0) === '#' || href.indexOf('javascript:') === 0)) return;
                unloadVideo();
            },
            true
        );
    }

    initYouTubeEmbed();

    const videoWrap = document.getElementById('ro-video');
    const iframe = document.getElementById('ro-vimeo');
    const playBtn = document.getElementById('ro-video-play');
    if (!videoWrap || !iframe || !playBtn) return;

    function initVimeoPlayer() {
        if (typeof window.Vimeo === 'undefined' || !window.Vimeo.Player) {
            window.setTimeout(initVimeoPlayer, 50);
            return;
        }

        const player = new window.Vimeo.Player(iframe);

        function setPlaying(playing) {
            videoWrap.classList.toggle('is-playing', playing);
            playBtn.setAttribute('aria-label', playing ? 'Pause trailer' : 'Play trailer');
        }

        player.on('play', () => setPlaying(true));
        player.on('pause', () => setPlaying(false));
        player.on('ended', () => setPlaying(false));

        function pausePlayer() {
            player.pause().catch(() => {});
        }

        function startPlayback() {
            player
                .play()
                .catch(() =>
                    player.setMuted(true).then(() => player.play()).catch(() => {})
                );
        }

        function togglePlayback() {
            player.getPaused().then((paused) => {
                if (paused) {
                    player.setMuted(false).then(() => player.play()).catch(() => startPlayback());
                } else {
                    pausePlayer();
                }
            });
        }

        player.ready().then(() => {
            startPlayback();
            player.getPaused().then((paused) => setPlaying(!paused)).catch(() => {});
        });

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlayback();
        });

        videoWrap.addEventListener('click', () => {
            if (videoWrap.classList.contains('is-playing')) {
                togglePlayback();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pausePlayer();
        });
        window.addEventListener('pagehide', pausePlayer);
    }

    initVimeoPlayer();
})();
