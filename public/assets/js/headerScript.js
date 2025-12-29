function initHeaderScripts() {
  "use strict";

  if(typeof initializeDarkMode === "function") {
    initializeDarkMode();
  }

  function setActiveMenuItem() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const menuLinks = document.querySelectorAll("#navmenu a");

    if (!menuLinks.length) {
      console.warn("Nenhum link de menu encontrado para marcar active.");
      return;
    }

    menuLinks.forEach((link) => {
      const linkPath = link.getAttribute("href");

      if (linkPath === currentPath) {
        link.classList.add("active");
      } else if (linkPath === "index.html" && currentPath === "") {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  // Espera um pouquinho até o DOM do header estar renderizado
  setTimeout(() => setActiveMenuItem(), 100);

  // ========== resto do seu script normal ==========
  function toggleScrolled() {
    const selectBody = document.querySelector("body");
    const selectHeader = document.querySelector("#header");
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

  document.addEventListener("scroll", toggleScrolled);
  window.addEventListener("load", toggleScrolled);

  const mobileNavToggleBtn = document.querySelector(".mobile-nav-toggle");

  function mobileNavToogle() {
    document.querySelector("body").classList.toggle("mobile-nav-active");
    mobileNavToggleBtn.classList.toggle("bi-list");
    mobileNavToggleBtn.classList.toggle("bi-x");
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener("click", mobileNavToogle);
  }

  document.querySelectorAll("#navmenu a").forEach((navmenu) => {
    navmenu.addEventListener("click", () => {
      if (document.querySelector(".mobile-nav-active")) {
        mobileNavToogle();
      }
    });
  });

  document.querySelectorAll(".navmenu .toggle-dropdown").forEach((navmenu) => {
    navmenu.addEventListener("click", function (e) {
      e.preventDefault();
      this.parentNode.classList.toggle("active");
      this.parentNode.nextElementSibling.classList.toggle("dropdown-active");
      e.stopImmediatePropagation();
    });
  });

  const contactLink = document.querySelector('#contact-link');
  if (contactLink) {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    if (currentPage !== "index.html") {
      contactLink.setAttribute("href", "contact.html");
    }
  }

}
