document.addEventListener("DOMContentLoaded", function () {
  const whatsContainer = document.getElementById("whats-placeholder");
  if (whatsContainer) {
    fetch("components/float-bottom-whatsapp.html")
      .then(response => {
        if (!response.ok) throw new Error("Erro ao carregar o whatsapp");
        return response.text();
      })
      .then(html => {
        whatsContainer.innerHTML = html;

        // Reexecuta scripts dependentes (se necessário)
        if (typeof AOS !== "undefined") {
          AOS.refresh();
        }
      })
      .catch(err => console.error("Falha ao carregar whats:", err));
  }
});
