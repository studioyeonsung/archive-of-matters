window.addEventListener('DOMContentLoaded', () => {
  const odyssey = document.getElementById("odysseySection");
  odyssey.classList.remove("hidden");

  const icon = document.getElementById("toggleIcon");
  icon.textContent = "▼";
});

function toggleOdyssey() {
  const odyssey = document.getElementById("odysseySection");
  const icon = document.getElementById("toggleIcon");
  const isHidden = odyssey.classList.toggle("hidden");
  icon.textContent = isHidden ? "▲" : "▼";
}
