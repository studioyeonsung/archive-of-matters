// 1. Hover color effect (preserve black text for .matter section)
document.addEventListener("DOMContentLoaded", () => {
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

  // 3. Mobile menu open/close
  const menuIcon = document.querySelector(".menu");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuClose = document.getElementById("menu-close");

  if (menuIcon && mobileMenu && menuClose) {
    menuIcon.addEventListener("click", () => {
      mobileMenu.classList.add("active");
    });

    menuClose.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
    });
  }

  // 4. Universal popup trigger (mobile + desktop)
  const popup = document.getElementById("july-popup");
  const clickableSections = document.querySelectorAll(
    ".section.matter, .section.heading, .section.subtitle, .section.announcement"
  );

  clickableSections.forEach(section => {
    section.addEventListener("click", () => {
      if (!popup) return;
      popup.classList.add("show");
      setTimeout(() => {
        popup.classList.remove("show");
      }, 2500);
    });
  });

  console.log("✅ all JS initialized");
});
