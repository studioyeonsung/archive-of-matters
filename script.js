// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

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
            return; /* 텍스트 타이틀은 CSS color 사용, filter 미적용 */
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

// Wait for window load to ensure all assets are loaded
window.addEventListener('load', () => {
    setVisualViewportHeight();
    initHorizontalScroll();
    // Set initial color for section 1
    updateSectionColor(0);
    initMatterPopup();
    alignFixedArrowsWithKoreanTitle();
    initMobileArrowNav();
    initMobileSwipeNav();
});

// 모바일 브라우저 하단 탭/주소창이 보일 때 실제 보이는 높이를 --vh로 설정 (가려짐·레이아웃 튐 방지)
function setVisualViewportHeight() {
    const setVh = () => {
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', setVh);
        window.visualViewport.addEventListener('scroll', setVh);
    }
    window.addEventListener('resize', setVh);
}

// 모바일: 고정 화살표를 영문 물질 텍스트(섹션 왼쪽) 라인과 세로 정렬
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
            fixedArrows.style.top = `${centerY - 16}px`; /* 영문 물질 텍스트보다 16px 위 */
        }
    };

    update();
    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.addEventListener('refresh', update);
    }
}

// 모바일: 고정 화살표 클릭 시 이전/다음 섹션으로 스크롤 (순환), 호버 시 클릭 가능 표시
function initMobileArrowNav() {
    const fixedArrowsWrap = document.querySelector('.page-index .matter-move-arrows-fixed');
    if (!fixedArrowsWrap) return;

    const arrowLeft = fixedArrowsWrap.querySelector('.matter-move-arrow-fixed-left');
    const arrowRight = fixedArrowsWrap.querySelector('.matter-move-arrow-fixed-right');
    if (!arrowLeft || !arrowRight) return;

    const sections = document.querySelectorAll('.page-index .matter-section');
    const scrollDistancePerSection = 300;
    const scrollDistance = sections.length * scrollDistancePerSection;

    function getCurrentSection() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const progress = Math.min(1, Math.max(0, scrollTop / scrollDistance));
        // 인디케이터와 동일: progress = index / (sections.length - 1)
        const index = Math.round(progress * (sections.length - 1));
        return Math.max(0, Math.min(index, sections.length - 1));
    }

    function scrollToSection(index) {
        // 인디케이터 숫자 클릭과 동일한 계산: 섹션이 가운데 오도록
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

// 모바일: 이미지 영역 좌우 스와이프로 이전/다음 섹션 부드럽게 이동
function initMobileSwipeNav() {
    const scrollContainer = document.querySelector('.page-index .scroll-container');
    if (!scrollContainer) return;

    const sections = document.querySelectorAll('.page-index .matter-section');
    const scrollDistancePerSection = 300;
    const scrollDistance = sections.length * scrollDistancePerSection;
    const minSwipeDistance = 50;

    function getCurrentSection() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const progress = Math.min(1, Math.max(0, scrollTop / scrollDistance));
        const index = Math.round(progress * (sections.length - 1));
        return Math.max(0, Math.min(index, sections.length - 1));
    }

    function scrollToSection(index) {
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
        if (Math.abs(deltaX) < minSwipeDistance || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        const current = getCurrentSection();
        if (deltaX < 0) {
            const next = (current + 1) % sections.length;
            scrollToSection(next);
        } else {
            const prev = (current - 1 + sections.length) % sections.length;
            scrollToSection(prev);
        }
    }, { passive: true });
}

// Matter popup: open on matter image/title/header matter icon click; close on overlay or X
function initMatterPopup() {
    const popup = document.getElementById('matter-popup');
    if (!popup) return;

    const openPopup = () => {
        popup.classList.add('is-open');
        popup.setAttribute('aria-hidden', 'false');
    };

    const closePopup = () => {
        popup.classList.remove('is-open');
        popup.setAttribute('aria-hidden', 'true');
    };

    const triggers = document.querySelectorAll('.matter-image, .matter-title-eng, .matter-title-kor, .header-matter-icon');
    triggers.forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openPopup();
        });
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) closePopup();
    });

    const closeBtn = popup.querySelector('.matter-popup-close');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
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

    // Calculate scroll distance per section
    // 값을 줄수록 섹션 간 스크롤 거리가 짧아짐
    // 체감 확실하게 나도록 섹션당 약 300px로 크게 축소
    const scrollDistancePerSection = 300;
    const scrollDistance = sections.length * scrollDistancePerSection;

    // Set body height to ensure scrollable space (모바일: 실제 보이는 높이 사용)
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

    // Parallax: 전체 그레인 레이어 하나 (스크롤 구간 자연스럽게 연결)
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

    // Parallax: matter-title-eng, matter-title-kor (002 방식)
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

    // Parallax: 중앙 이미지 (002 방식 - 텍스트보다 빠르게)
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
        
        // 모바일: 인디케이터 원 홀드 후 드래그로 스크롤
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

