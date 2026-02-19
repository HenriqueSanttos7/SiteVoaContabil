document.addEventListener("DOMContentLoaded", function () {
  const footerContainer = document.getElementById("footer-placeholder");
  if (!footerContainer) return;

  fetch("/components/footer.html")
    .then((response) => {
      if (!response.ok) throw new Error("Erro ao carregar o footer");
      return response.text();
    })
    .then((html) => {
      footerContainer.innerHTML = html;

      // 🔹 Inicializações do footer
      initFooterYear();

      if (typeof AOS !== "undefined") AOS.refresh();
    })
    .catch((err) => console.error("Falha ao carregar footer:", err));

  function initFooterYear() {
    const yearSpan = document.getElementById("currentYear");
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  }
});
