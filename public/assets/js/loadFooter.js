document.addEventListener("DOMContentLoaded", function () {
  const footerContainer = document.getElementById("footer-placeholder");
  if (!footerContainer) return;

  fetch("/components/footer.html")
    .then( (response) => {
      console.log("Resposta do fetch:", response);
      if (!response.ok) throw new Error("Erro ao carregar o footer");
      return response.text();
    })
    .then((html) => {
      footerContainer.innerHTML = html;
      if (typeof AOS !== "undefined") AOS.refresh();
    })
    .catch((err) => console.error("Falha ao carregar footer:", err));
});