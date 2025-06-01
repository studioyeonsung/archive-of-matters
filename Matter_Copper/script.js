window.addEventListener('DOMContentLoaded', () => {
  // 항상 보여야 함
  const odyssey = document.getElementById("odysseySection");
  odyssey.classList.remove("hidden");

  const icon = document.getElementById("toggleIcon");
  if (icon) icon.textContent = "▼";

  // ✅ 드롭다운 기본 열림 상태
  const dropdown = document.getElementById("dropdownContent");
  if (dropdown) dropdown.style.display = "block";
});

function toggleDropdown() {
  const dropdown = document.getElementById("dropdownContent");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function toggleOdyssey() {
  const odyssey = document.getElementById("odysseySection");
  const icon = document.getElementById("toggleIcon");
  const isHidden = odyssey.classList.toggle("hidden");
  icon.textContent = isHidden ? "▲" : "▼";
}
