// Detectar idioma da URL
const urlParams = new URLSearchParams(window.location.search);
let lang = urlParams.get("lang");

// Se não houver na URL, tenta localStorage ou padrão pt
if (!lang) {
  lang = localStorage.getItem("lang") || "pt";
}

// Salva a escolha no navegador (opcional)
localStorage.setItem("lang", lang);

// Aplica as traduções
if (window.translations && window.translations[lang]) {
  const t = window.translations[lang];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) {
      el.innerHTML = t[key];
    }
  });
}
// Aplica placeholders se existir
document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
  const key = el.getAttribute("data-i18n-placeholder");
  if (t[key]) {
    el.setAttribute("placeholder", t[key]);
  }
});
