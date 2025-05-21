// Hover background color effect
document.querySelectorAll('.section').forEach(section => {
  const color = section.getAttribute('data-color');

  section.addEventListener('mouseenter', () => {
    section.style.backgroundColor = color;
    if (!section.classList.contains('matter')) {
      section.style.color = 'white';
    } else {
      section.style.color = 'black';
    }
  });

  section.addEventListener('mouseleave', () => {
    section.style.backgroundColor = 'white';
    section.style.color = 'black';
  });
});

// Marquee: scroll by default, stop on hover
document.querySelectorAll('.marquee-wrapper').forEach(wrapper => {
  const track = wrapper.querySelector('.marquee-track');
  const originalContent = track.innerHTML;
  track.innerHTML = originalContent + originalContent;

  let offset = 0;
  let speed = window.innerWidth <= 768 ? 0.5 : 1;
  let animationId = null;

  function animate() {
    offset -= speed;
    track.style.transform = `translateX(${offset}px)`;
    animationId = requestAnimationFrame(animate);
  }

  animate();

  wrapper.addEventListener('mouseenter', () => {
    cancelAnimationFrame(animationId);
    animationId = null;
  });

  wrapper.addEventListener('mouseleave', () => {
    if (!animationId) animate();
  });
});

// unblock mobile
const blocker = document.getElementById('mobile-blocker');
if (blocker) {
  blocker.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// hamburger click
const hamburger = document.querySelector('.hamburger');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    alert("📱 모바일 메뉴 준비 중입니다!");
  });
}
