"use strict";

// ====================================================================================
// 1. FUNÇÕES DE LÓGICA (Definições)
// ====================================================================================

/**
 * Aplica a classe .scrolled no body ao rolar
 */
function toggleScrolled() {
  const selectBody = document.querySelector("body");
  const selectHeader = document.querySelector("#header");

  // Se não tem header ainda, não faz nada
  if (!selectHeader) return;

  if (
    !selectHeader.classList.contains("scroll-up-sticky") &&
    !selectHeader.classList.contains("sticky-top") &&
    !selectHeader.classList.contains("fixed-top")
  )
    return;

  window.scrollY > 100
    ? selectBody.classList.add("scrolled")
    : selectBody.classList.remove("scrolled");
}

/**
 * Lógica do Botão Scroll Top (Aparecer/Esconder)
 */
function toggleScrollTop() {
  const scrollTop = document.querySelector(".scroll-top");
  if (scrollTop) {
    window.scrollY > 100
      ? scrollTop.classList.add("active")
      : scrollTop.classList.remove("active");
  }
}

/**
 * Lógica do Menu Mobile (Abrir/Fechar)
 */
function mobileNavToogle() {
  const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");
  document.querySelector("body").classList.toggle("mobile-nav-active");

  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.classList.toggle("bi-list");
    mobileNavToggleBtn.classList.toggle("bi-x");
  }
}

/**
 * Lógica do Dark Mode (Alternar Tema e Ícone)
 */
// Sempre inicia no light ao menos que o usuário já tenha escolhido
if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "light");
}

function initializeDarkMode() {
  const body = document.body;
  const themeToggleBtn = document.getElementById("theme-toggle");

  if (!themeToggleBtn) return;

  const savedTheme = localStorage.getItem("theme");

  let isDarkMode = savedTheme === "dark";

  const applyTheme = (dark) => {
    const iconElement = themeToggleBtn.querySelector("i");
    if (dark) {
      body.classList.add("dark-mode");
      iconElement?.classList.remove("bi-sun");
      iconElement?.classList.add("bi-moon");
      localStorage.setItem("theme", "dark");
    } else {
      body.classList.remove("dark-mode");
      iconElement?.classList.remove("bi-moon");
      iconElement?.classList.add("bi-sun");
      localStorage.setItem("theme", "light");
    }
  };

  applyTheme(isDarkMode);

  themeToggleBtn.addEventListener("click", () => {
    const newIsDarkMode = !body.classList.contains("dark-mode");
    applyTheme(newIsDarkMode);
  });
}



/**
 * Lógica do Filtro de Clientes (Página Clientes)
 */
function initializeClientFilter() {
  const filterContainer = document.querySelector("#clientTabs");
  const clientCards = document.querySelectorAll(".cliente-card");

  if (!filterContainer || clientCards.length === 0) return;

  filterContainer.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;

    filterContainer.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    const filterValue = button.getAttribute("data-filter");

    clientCards.forEach((card) => {
      if (filterValue === "todos" || card.classList.contains(filterValue)) {
        card.classList.remove("d-none");
        card.classList.add("d-block");
      } else {
        card.classList.remove("d-block");
        card.classList.add("d-none");
      }
    });
  });
}

/**
 * Lógica de Expansão de Clientes (Home)
 */
function initializeClientExpansion() {
  const expandButton = document.getElementById("btn-expand-clients");
  const hiddenLogos = document.getElementById("client-list-expanded");
  const linkToClients = document.getElementById("link-to-clients");

  if (expandButton && hiddenLogos && linkToClients) {
    hiddenLogos.classList.add("d-none"); // Garante que começa oculto
    linkToClients.classList.add("d-none");

    expandButton.addEventListener("click", function () {
      hiddenLogos.classList.remove("d-none");
      this.classList.add("d-none");
      linkToClients.classList.remove("d-none");
    });
  }
}

/**
 * Inicialização de Bibliotecas (AOS, Swiper, PureCounter)
 */
function initLibs() {
  // AOS
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 600,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }
  // Swiper
  if (typeof Swiper !== "undefined") {
    document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );
      new Swiper(swiperElement, config);
    });
  }
  // PureCounter
  if (typeof PureCounter !== "undefined") new PureCounter();

  // Preloader
  const preloader = document.querySelector("#preloader");
  if (preloader) {
    window.addEventListener("load", () => preloader.remove());
  }
}

// ====================================================================================
// 2. INICIALIZAÇÃO PADRÃO (Roda assim que a página carrega)
//    Aqui ficam ScrollTop, Filtros, Carrossel (Coisas que NÃO dependem do Header)
// ====================================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa Bibliotecas (Swiper, AOS)
  initLibs();

  // Inicializa Lógicas de Página
  initializeClientFilter();
  initializeClientExpansion();

  // Configura Scroll Top (Elemento já existe no HTML base)
  const scrollTopBtn = document.querySelector(".scroll-top");
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    // Adiciona listeners para mostrar/esconder
    document.addEventListener("scroll", toggleScrollTop);
    window.addEventListener("load", toggleScrollTop);
  }

  // Adiciona listener de scroll para o Body (efeito scrolled)
  document.addEventListener("scroll", toggleScrolled);
  window.addEventListener("load", toggleScrolled);
});

// ====================================================================================
// 3. INICIALIZAÇÃO DO HEADER (Chamada externamente pelo loadHeader.js)
//    Aqui ficam Dark Mode e Menu Mobile (Coisas que SÓ existem depois do Header)
// ====================================================================================
function initGlobalScripts() {
  // Inicializa Dark Mode
  initializeDarkMode();

  // Configura Botão Mobile Nav
  const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");
  if (mobileNavToggleBtn) {
    // Remove listener anterior para evitar duplicação em reloads
    mobileNavToggleBtn.removeEventListener("click", mobileNavToogle);
    mobileNavToggleBtn.addEventListener("click", mobileNavToogle);
  }

  // Configura Dropdowns do Mobile Nav
  document.querySelectorAll(".navmenu .toggle-dropdown").forEach((navmenu) => {
    navmenu.addEventListener("click", function (e) {
      e.preventDefault();
      this.parentNode.classList.toggle("active");
      this.parentNode.nextElementSibling.classList.toggle("dropdown-active");
      e.stopImmediatePropagation();
    });
  });

  // Fecha Mobile Nav ao clicar em links
  document.querySelectorAll("#navmenu a").forEach((navmenu) => {
    navmenu.addEventListener("click", () => {
      if (document.querySelector(".mobile-nav-active")) {
        mobileNavToogle();
      }
    });
  });

  // Reaplica verificação de scroll no header novo
  toggleScrolled();
}
