(() => {
  "use strict";
  const key = "hotelerp_theme";
  const root = document.documentElement;
  let button;

  function storedTheme() {
    try { return localStorage.getItem(key); }
    catch { return null; }
  }

  function applyTheme(value) {
    const dark = value === "dark";
    root.dataset.hotelerpTheme = dark ? "dark" : "light";
    if (button) button.setAttribute("aria-pressed", String(dark));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#111827" : "#f8f7f3";
  }

  applyTheme(storedTheme());
  document.addEventListener("DOMContentLoaded", () => {
    button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    button.setAttribute("aria-pressed", String(root.dataset.hotelerpTheme === "dark"));
    button.addEventListener("click", () => {
      const next = root.dataset.hotelerpTheme === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(key, next); } catch { /* Tema disponible en esta página. */ }
    });
    button.hidden = false;
  }, { once: true });

  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) applyTheme(storedTheme());
  });
})();
