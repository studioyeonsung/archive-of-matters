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
