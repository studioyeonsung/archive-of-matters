// 1. Hover color effect (preserve black text for .matter section)
document.querySelectorAll('.section').forEach(section => {
  const color = section.getAttribute('data-color');
  
  section.addEventListener('mouseenter', () => {
    section.style.backgroundColor = color;

    if (!section.classList.contains('matter')) {
      section.style.color = 'white';
    } else {
      section.style.color = 'black'; // Keep black text for matter sections
    }
  });

  section.addEventListener('mouseleave', () => {
    section.style.backgroundColor = 'white';
    section.style.color = 'black';
  });
});

// 2. Marquee animation on mouse hover
document.querySelectorAll('.marquee-wrapper').forEach(wrapper => {
  const track = wrapper.querySelector('.marquee-track');
  const originalContent = track.innerHTML;
  track.innerHTML = originalContent + originalContent;

  let offset = 0;
  let speed = 1;
  let animationId = null;

  function animate() {
    offset -= speed;
    track.style.transform = `translateX(${offset}px)`;
    animationId = requestAnimationFrame(animate);
  }

  wrapper.addEventListener('mouseenter', () => {
    if (!animationId) animate();
  });

  wrapper.addEventListener('mouseleave', () => {
    cancelAnimationFrame(animationId);
    animationId = null;
  });
});

// // 3. Block access on mobile/tablet (<= 768px)
// function checkViewport() {
//   const blocker = document.getElementById('mobile-blocker');
//   if (!blocker) return; // Prevent error if element is missing

//   if (window.innerWidth <= 768) {
//     blocker.style.display = 'flex';
//     document.body.style.overflow = 'hidden'; // Disable scroll
//   } else {
//     blocker.style.display = 'none';
//     document.body.style.overflow = 'auto';
//   }
// }

// window.addEventListener('DOMContentLoaded', checkViewport);
// window.addEventListener('resize', checkViewport);

// ✅ 1. 모바일/태블릿 접근 차단 해제
const blocker = document.getElementById('mobile-blocker');
if (blocker) {
  blocker.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// ✅ 2. 모바일용 햄버거 메뉴 클릭 이벤트
const hamburger = document.querySelector('.hamburger');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    alert("📱 모바일 메뉴 준비 중입니다. 메뉴를 여는 기능이 곧 추가될 예정이에요!");
  });
}
