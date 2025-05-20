// 색상 반전 유지 (matter 섹션만 예외 처리)
document.querySelectorAll('.section').forEach(section => {
  const color = section.getAttribute('data-color');
  section.addEventListener('mouseenter', () => {
    section.style.backgroundColor = color;

    if (!section.classList.contains('matter')) {
      section.style.color = 'white';
    } else {
      section.style.color = 'black'; // matter 섹션은 항상 검정 유지
    }
  });

  section.addEventListener('mouseleave', () => {
    section.style.backgroundColor = 'white';
    section.style.color = 'black';
  });
});

// 마우스 기반 marquee
document.querySelectorAll('.marquee-wrapper').forEach(wrapper => {
  const track = wrapper.querySelector('.marquee-track');
  const original = track.innerHTML;
  track.innerHTML = original + original;

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

<script>
  function checkViewport() {
    const blocker = document.getElementById('mobile-blocker');
    if (window.innerWidth <= 768) {
      blocker.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // prevent scroll
    } else {
      blocker.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  window.addEventListener('DOMContentLoaded', checkViewport);
  window.addEventListener('resize', checkViewport);
</script>
