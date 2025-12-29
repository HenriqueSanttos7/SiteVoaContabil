document.addEventListener("DOMContentLoaded", () => {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  fetch("components/header.html")
    .then((response) => {
      if (!response.ok) throw new Error("Erro ao carregar header.html");
      return response.text();
    })
    .then((html) => {
      placeholder.innerHTML = html;
      if (typeof initHeaderScripts === "function") {
        initHeaderScripts();
      }
    })
    .catch((error) => console.error("Falha ao carregar header:", error));
});
