document.addEventListener("DOMContentLoaded", async () => {
    const sidebarContainer = document.getElementById("sidebar");
    if (!sidebarContainer) return;

    // Carrega o HTML do componente sidebar
    const response = await fetch("/components/sidebar.html");
    const html = await response.text();
    sidebarContainer.innerHTML = html;

    const sidebar = sidebarContainer.querySelector(".sidebar");
    const toggle = sidebarContainer.querySelector(".menu-toggle");
    const items = sidebar.querySelectorAll("li");

    // =============================
    // Toggle para mobile
    // =============================
    toggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    // Fecha sidebar ao clicar fora (opcional)
    document.addEventListener("click", (e) => {
        if (
            window.innerWidth <= 992 &&
            !sidebar.contains(e.target) &&
            !toggle.contains(e.target)
        ) {
            sidebar.classList.remove("open");
        }
    });

    // =============================
    // Navegação do menu
    // =============================
    items.forEach((li) => {
        const page = li.getAttribute("data-page");
        li.addEventListener("click", () => {
            if (page === "post") location.href = "adm.html";
            if (page === "lista") location.href = "adm-list.html";
            if (page === "logout") location.href = "/index.html";

            // Fechar sidebar no mobile ao clicar
            if (window.innerWidth <= 992) sidebar.classList.remove("open");
        });
    });

    // =============================
    // Marcar item ativo
    // =============================
    const filename = window.location.pathname.split("/").pop();
    items.forEach((li) => {
        const page = li.getAttribute("data-page");
        if (
            (page === "post" && filename.includes("painel-post")) ||
            (page === "lista" && filename.includes("lista")) ||
            (page === "config" && filename.includes("config"))
        ) {
            li.classList.add("active");
        }
    });
});
