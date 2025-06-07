window.addEventListener('DOMContentLoaded', () => {
  const copper = document.getElementById("copperSection");
  copper.classList.remove("hidden");

  const icon = document.getElementById("toggleIcon");
  icon.textContent = "▼";
});

function toggleCopper() {
  const copper = document.getElementById("copperSection");
  const icon = document.getElementById("toggleIcon");
  const isHidden = copper.classList.toggle("hidden");
  icon.textContent = isHidden ? "▲" : "▼";
}

document.querySelectorAll('.section.matter').forEach(section => {
  section.addEventListener('click', () => {
    const popup = document.getElementById('july-popup');
    popup.classList.add('show');

    // 자동으로 몇 초 뒤 닫히게 하려면:
    setTimeout(() => {
      popup.classList.remove('show');
    }, 2500); // 2.5초
  });
});