// ==========================================
// IMPORTS FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getStorage, ref as sRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

// ==========================================
// FIREBASE CONFIG
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCc7cboAR3IWLgd2Pt6qZWonAPTbHmK3qE",
  authDomain: "qualisanam-f0afa.firebaseapp.com",
  databaseURL: "https://qualisanam-f0afa-default-rtdb.firebaseio.com",
  projectId: "qualisanam-f0afa",
  storageBucket: "qualisanam-f0afa.firebasestorage.app",
  messagingSenderId: "607052175451",
  appId: "1:607052175451:web:c0f702b848566856b8477e",
  measurementId: "G-FN0NB403XG"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app, "gs://qualisanam-f0afa.firebasestorage.app");

// ==========================================
// HELPERS
// ==========================================
function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

// ==========================================
// BUSCAR ARTIGO PELO SLUG
// ==========================================
async function fetchArticle(slug) {
  try {
    const snap = await get(ref(db, "articles/" + slug));
    return snap.val();
  } catch (err) {
    console.error("Erro ao buscar artigo:", err);
    return null;
  }
}

// ==========================================
// PEGAR IMAGEM DO STORAGE
// ==========================================
async function getImg(path) {
  try {
    if (!path) return "";
    return await getDownloadURL(sRef(storage, path));
  } catch (err) {
    console.warn("Imagem não encontrada:", path);
    return "";
  }
}

// ==========================================
// CARREGAMENTO PRINCIPAL
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  const slug = new URLSearchParams(window.location.search).get("slug");

  if (!slug) return console.error("Nenhum slug encontrado.");

  toggleLoading(true);

  const article = await fetchArticle(slug);
  if (!article) {
    toggleLoading(false);
    return console.error("Artigo não encontrado.");
  }

  await renderArticle(article);

  // TOC precisa rodar APÓS as imagens carregarem
  setTimeout(() => {
    generateTOC();
  }, 250);

  toggleLoading(false);
});

// ==========================================
// RENDERIZAÇÃO DO ARTIGO
// ==========================================
async function renderArticle(data) {

  // TITULO / SUBTITULO
  document.getElementById("article-title").textContent = data.title;
  document.getElementById("article-subtitle").textContent = data.subtitle;

  // AUTOR
  document.getElementById("article-author").textContent = data.author?.name ?? "Autor desconhecido";
  document.getElementById("author-name").textContent = data.author?.name ?? "";
  document.getElementById("author-role").textContent = data.author?.role ?? "";

  // DATAS
  document.getElementById("article-date").textContent = formatDateBR(data.date);
  document.getElementById("author-date").textContent = formatDateBR(data.date);

  // CATEGORIA
  document.getElementById("article-category").textContent = data.categories?.[0] ?? "";

  // FOTO DO AUTOR
  if (data.author?.photoUrl) {
    const url = await getImg(data.author.photoUrl);
    if (url) document.getElementById("author-photo").src = url;
  }

  // IMAGEM DE DESTAQUE
  if (data.featuredImage) {
    document.getElementById("article-hero-image").src = await getImg(data.featuredImage);
  }

  // CONTEÚDO HTML
  const articleContentEl = document.getElementById("article-content");
  articleContentEl.innerHTML = data.contentHtml ?? "";

  // PRE-CARREGAR IMAGENS INTERNAS
  if (Array.isArray(data.innerImages)) {
    for (const imgPath of data.innerImages) {
      getImg(imgPath);
    }
  }

  // TEMPO DE LEITURA
  calcReadingTime();

  // TAGS COMO LINKS
  renderTags(data.tags);
}

// ==========================================
// TAGS CLICÁVEIS
// ==========================================
function renderTags(tags) {
  const container = document.getElementById("article-tags");
  container.innerHTML = "";

  if (!tags || !Array.isArray(tags)) return;

  tags.forEach(tag => {
    const a = document.createElement("a");
    a.classList.add("topic-tag");
    a.href = `/blog.html?tag=${encodeURIComponent(tag)}`;
    a.textContent = tag;
    container.appendChild(a);
  });
}

// ==========================================
// ÍNDICE (TOC) - VERSÃO ATUALIZADA
// Substitui a função anterior generateTOC
// ==========================================
// =========================
// TOC: truncate + generate + observer (pronto p/ colar)
// =========================
function truncateWords(text, words = 2) {
  const parts = (text || "").trim().split(/\s+/).filter(Boolean);
  return parts.length <= words ? parts.join(" ") : parts.slice(0, words).join(" ") + "…";
}
// =========================
// TOC: generate + observer (fixes: inline arrow, truncation H2=2 H3=3, no auto-open)
// =========================
function generateTOC() {
  const content = document.getElementById("article-content");
  const toc = document.getElementById("article-index");
  if (!content || !toc) return;

  toc.innerHTML = "";

  const headings = Array.from(content.querySelectorAll("h2, h3"));
  if (!headings.length) {
    toc.innerHTML = "<li><em>Sem tópicos</em></li>";
    return;
  }

  // criar ids únicos
  headings.forEach((h, i) => {
    if (!h.id) {
      const base = h.textContent.trim().toLowerCase()
        .replace(/[^\w\- ]+/g, "")
        .replace(/\s+/g, "-");
      let id = base || `toc-${i}`;
      let n = 1;
      while (document.getElementById(id)) id = `${base}-${n++}`;
      h.id = id;
    }
  });

  // Agrupar H2 -> H3
  const groups = [];
  let current = null;
  headings.forEach(h => {
    if (h.tagName.toLowerCase() === "h2") {
      current = { h2: h, h3: [] };
      groups.push(current);
    } else if (h.tagName.toLowerCase() === "h3" && current) {
      current.h3.push(h);
    }
  });

  // Montar TOC
  groups.forEach(group => {
    const li = document.createElement("li");
    li.className = "toc-item";

    const hasH3 = group.h3.length > 0;

    // row: H2 link + optional toggle button (inline)
    const row = document.createElement("div");
    row.className = "toc-h2-row";

    const aH2 = document.createElement("a");
    aH2.className = "toc-link toc-h2";
    aH2.href = `#${group.h2.id}`;
    aH2.textContent = truncateWords(group.h2.textContent, 5);
    row.appendChild(aH2);

    if (hasH3) {
      const btn = document.createElement("button");
      btn.className = "toc-toggle";
      btn.type = "button";
      btn.innerHTML = `<i class="bi bi-chevron-right toc-arrow" aria-hidden="true"></i>`;
      row.appendChild(btn);
    }

    li.appendChild(row);

    // submenu
    const submenu = document.createElement("ul");
    submenu.className = "toc-submenu";
    group.h3.forEach(h3 => {
      const liSub = document.createElement("li");
      const a = document.createElement("a");
      a.className = "toc-link toc-h3";
      a.href = `#${h3.id}`;
      a.textContent = truncateWords(h3.textContent, 3);
      liSub.appendChild(a);
      submenu.appendChild(liSub);
    });
    li.appendChild(submenu);

    toc.appendChild(li);
  });

  // Scroll suave para TODOS links
  toc.querySelectorAll(".toc-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      const headerOffset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  // Toggle submenus - MANUAL only
  toc.querySelectorAll(".toc-toggle").forEach(btn => {
    const row = btn.closest(".toc-h2-row");
    const li = row.closest(".toc-item");
    const submenu = li.querySelector(".toc-submenu");
    const arrow = btn.querySelector(".toc-arrow");

    // Ensure closed by default
    submenu.classList.remove("open");
    if (arrow) arrow.classList.remove("rotate");

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = submenu.classList.toggle("open");
      if (arrow) arrow.classList.toggle("rotate", open);
      // keep it manual: do not auto-open on scroll
      // optional: scroll into view if opened
      if (open) btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  });

  // initialize observer/progress
  initTOCProgress(headings);
}

// ============================
// Observer + progress (no auto-open of submenu)
// ============================
function initTOCProgress(headings) {
  const tocLinks = document.querySelectorAll("#article-index .toc-link");
  const content = document.getElementById("article-content");
  const progressFill = document.querySelector(".progress-fill");
  const progressText = document.querySelector(".progress-text");

  if (!content || !tocLinks.length) return;

  const linkById = {};
  tocLinks.forEach(link => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#")) linkById[href.slice(1)] = link;
  });

  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -60% 0px",
    threshold: [0, 0.15, 0.25, 0.5, 0.75, 1]
  };

  let currentActiveId = null;
  const ratioMap = new Map();

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      if (!id) return;
      ratioMap.set(id, entry.intersectionRatio);
    });

    // choose id with largest ratio
    let bestId = null;
    let bestRatio = 0;
    ratioMap.forEach((ratio, id) => {
      if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
    });

    if (bestId !== currentActiveId) {
      if (currentActiveId && linkById[currentActiveId]) linkById[currentActiveId].classList.remove("active");
      currentActiveId = bestId;
      if (currentActiveId && linkById[currentActiveId]) {
        linkById[currentActiveId].classList.add("active");
        // DO NOT auto-open submenu anymore — only highlight
        // keep submenu state untouched (manual control)
        const activeLink = linkById[currentActiveId];
        const tocContainer = document.getElementById("article-index");
        if (tocContainer && activeLink) activeLink.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, observerOptions);

  headings.forEach(h => {
    if (h.id) io.observe(h);
  });

  // Progress (if elements exist)
  if (progressFill && progressText) {
    const contentTop = () => content.getBoundingClientRect().top + window.scrollY;
    const contentHeight = () => content.offsetHeight;
    let ticking = false;

    function updateProgress() {
      ticking = false;
      const scrollY = window.scrollY;
      const top = contentTop();
      const height = contentHeight();
      const winH = window.innerHeight;

      let pct;
      if (height <= winH) {
        pct = 100;
      } else {
        const totalScrollable = height - winH;
        const scrolled = Math.min(Math.max(scrollY - top, 0), totalScrollable);
        pct = Math.round((scrolled / totalScrollable) * 100);
      }

      progressFill.style.width = pct + "%";
      progressText.textContent = `${pct}% Concluído`;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => updateProgress());
    updateProgress();
  }
}

// auto-init on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  generateTOC();
  // mutation observer to regenerate if content inserted dynamically
  const content = document.getElementById("article-content");
  if (content) {
    const mo = new MutationObserver((mutations) => {
      const added = mutations.some(m => m.addedNodes && m.addedNodes.length);
      if (added) setTimeout(() => generateTOC(), 60);
    });
    mo.observe(content, { childList: true, subtree: true });
  }
});

// ==========================================
// TEMPO DE LEITURA
// ==========================================
function calcReadingTime() {
  const el = document.getElementById("article-reading-time");
  const text = document.getElementById("article-content")?.innerText ?? "";
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(totalWords / 200));
  if (el) el.textContent = `${minutes} min de leitura`;
}

// === COMPARTILHAMENTO — VERSÃO QUE NUNCA FALHA ===
document.addEventListener("DOMContentLoaded", () => {
  // Garante que Swal existe antes de tocar nos botões
  if (typeof Swal === "undefined") {
    console.error("SweetAlert2 não carregou");
    return;
  }

  // Remove qualquer listener antigo de uma vez por todas
  document.querySelectorAll("a[data-share]").forEach(btn => {
    const novo = btn.cloneNode(true);
    btn.replaceWith(novo);
  });

  // Aplica o novo comportamento
  document.querySelectorAll("a[data-share]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const rede = btn.dataset.share;
      const url = encodeURIComponent(location.href);
      const titulo = encodeURIComponent(document.title);

      if (rede === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=500");
      }
      else if (rede === "linkedin") {
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${titulo}`, "_blank", "width=620,height=750");
      }
      else if (rede === "email") {
        Swal.fire({
          title: "Compartilhar por e-mail",
          text: "Como prefere enviar?",
          icon: "envelope",
          showCancelButton: true,
          confirmButtonText: "App de e-mail",
          cancelButtonText: "Gmail no navegador",
          confirmButtonColor: "#0d6efd",
          cancelButtonColor: "#34a853",
          reverseButtons: true
        }).then(r => {
          const s = `Confira: ${document.title}`;
          const b = `Oi! Achei esse artigo:\n\n${location.href}\n\nAbraços!`;
          if (r.isConfirmed) {
            location.href = `mailto:?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(b)}`;
          } else {
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(s)}&body=${encodeURIComponent(b)}`, "_blank");
          }
        });
      }
    });
  });
});

// ==========================================
// LOADING
// ==========================================
function toggleLoading(state) {
  const loader = document.getElementById("article-loading");
  if (!loader) return;
  state ? loader.classList.add("active") : loader.classList.remove("active");
}
