// assets/js/blog.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getStorage, ref as sRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

// --------------------
// CONFIG FIREBASE (seu)
// --------------------
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
const storage = getStorage(app);

// --------------------
// SELECTORS (compatíveis com seu HTML)
// --------------------
const SELECTORS = {
    articlesContainer: "#articles-container",
    pagination: "#pagination",
    morePostsList: "#more-posts-list",
    categoriesContainer: "#sidebar-categories",        // div onde vamos inserir <ul>
    tagsContainer: "#sidebar-popular-tags",            // div .tag-cloud
    loadingBox: "#search-loading",                     // seu spinner
    searchFormSelector: ".search-widget form"
};

// --------------------
// ESTADO
// --------------------
let allArticles = [];
let filteredArticles = [];
let currentPage = 1;
const postsPerPage = 6;

// --------------------
// UTILITÁRIOS
// --------------------
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
function escapeHtml(s) { if (s == null) return ""; return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
function formatDateDMY(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
function showLoading() { const b = qs(SELECTORS.loadingBox); if (b) b.classList.add("active"); }
function hideLoading() { const b = qs(SELECTORS.loadingBox); if (b) b.classList.remove("active"); }

// --------------------
// LOAD ARTICLES
// --------------------
async function loadArticles() {
    const container = qs(SELECTORS.articlesContainer);

    // Spinner dedicado da página do blog
    const loading = document.getElementById("articles-loading");
    if (loading) loading.classList.add("active");

    // Oculta os artigos até carregarem
    if (container) {
        container.innerHTML = "";
        container.style.opacity = "0";
    }

    try {
        const snapshot = await get(ref(db, "articles"));
        const data = snapshot?.val();

        if (!data || Object.keys(data).length === 0) {
            if (container) container.innerHTML = "<p>Nenhum artigo encontrado.</p>";
            renderSidebarLatest();
            renderSidebarCategories([]);
            renderSidebarTags([]);
            return;
        }

        const entries = Object.entries(data);
        const list = [];

        for (const [slug, a] of entries) {
            let img = "assets/img/blog/default.jpg";

            if (a.featuredImage) {
                try {
                    img = await getDownloadURL(sRef(storage, a.featuredImage));
                } catch (e) {
                    console.warn("imagem não carregou para", slug, e);
                }
            }

            list.push({
                slug,
                title: a.title ?? "",
                subtitle: a.subtitle ?? "",
                categories: Array.isArray(a.categories)
                    ? a.categories
                    : (a.categories ? [a.categories] : []),
                tags: Array.isArray(a.tags)
                    ? a.tags
                    : (a.tags ? [a.tags] : []),
                date: a.date ?? "",
                dateValue: isNaN(Date.parse(a.date)) ? 0 : Date.parse(a.date),
                author: a.author?.name ?? "AM Consultoria",
                img
            });
        }

        list.sort((x, y) => y.dateValue - x.dateValue);

        allArticles = list;
        filteredArticles = [...list];

        applyURLFilters();
        renderArticlesPage();
        renderPagination();
        renderSidebarLatest();
        renderSidebarCategories(list);
        renderSidebarTags(list);

    } catch (err) {
        console.error("Erro ao carregar artigos:", err);
        if (container) container.innerHTML = "<p>Erro ao carregar artigos.</p>";
    } finally {
        if (loading) loading.classList.remove("active");

        if (container) {
            // pequena transição suave
            container.style.transition = "opacity .2s";
            container.style.opacity = "1";
        }
    }
}





// --------------------
// RENDER ARTCILES (pagina atual)
// --------------------
function renderArticlesPage() {
    const container = qs(SELECTORS.articlesContainer);
    if (!container) { console.warn("articles container não encontrado"); return; }

    container.innerHTML = "";
    const start = (currentPage - 1) * postsPerPage;
    const pageItems = filteredArticles.slice(start, start + postsPerPage);

    if (pageItems.length === 0) {
        container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
        return;
    }

    for (const art of pageItems) {
        const col = document.createElement("div");
        col.className = "col-md-12";
        col.setAttribute("data-aos", "fade-up");
        col.innerHTML = `
      <article class="blog-entry">
        <div class="post-img">
          <img src="${escapeHtml(art.img)}" alt="${escapeHtml(art.title)}" class="img-fluid">
          <span class="category-tag">${escapeHtml(art.categories[0] ?? "Sem Categoria")}</span>
        </div>
        <div class="post-meta">
          <div class="author-info">
            <i class="bi bi-person-circle"></i>
            <span class="author-name">Por ${escapeHtml(art.author)}</span>
            <i class="bi bi-calendar"></i>
            <span class="post-date">${formatDateDMY(art.date)}</span>
          </div>
        </div>
        <h2 class="title">
          <a href="../../artigo.html?slug=${encodeURIComponent(art.slug)}">${escapeHtml(art.title)}</a>
        </h2>
        <p>${escapeHtml(art.subtitle)}</p>
        <a href="../../artigo.html?slug=${encodeURIComponent(art.slug)}" class="read-more">Ler Artigo <i class="bi bi-arrow-right"></i></a>
      </article>
    `;
        container.appendChild(col);
    }
}

// --------------------
// PAGINATION
// --------------------
function renderPagination() {
    const pag = qs(SELECTORS.pagination);
    if (!pag) { console.warn("pagination element not found"); return; }
    pag.innerHTML = "";

    const total = Math.ceil(filteredArticles.length / postsPerPage);
    if (total <= 1) return;

    const prev = document.createElement("button");
    prev.className = "btn mx-1";
    prev.textContent = "«";
    prev.disabled = currentPage === 1;
    prev.addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderArticlesPage(); renderPagination(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    pag.appendChild(prev);

    for (let i = 1; i <= total; i++) {
        const btn = document.createElement("button");
        btn.className = `btn mx-1 ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
        btn.style.borderRadius = "6px";
        btn.textContent = i;
        btn.addEventListener("click", () => { currentPage = i; renderArticlesPage(); renderPagination(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        pag.appendChild(btn);
    }

    const next = document.createElement("button");
    next.className = "btn mx-1";
    next.textContent = "»";
    next.disabled = currentPage === total;
    next.addEventListener("click", () => { if (currentPage < total) { currentPage++; renderArticlesPage(); renderPagination(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    pag.appendChild(next);
}

// --------------------
// SIDEBAR: MAIS ARTIGOS
// --------------------
function renderSidebarLatest() {
    const sidebar = qs(SELECTORS.morePostsList);
    if (!sidebar) { console.warn("#more-posts-list não encontrado"); return; }
    sidebar.innerHTML = "";
    const latest = allArticles.slice(0, 5);
    latest.forEach(a => {
        const item = document.createElement("div");
        item.className = "post-item";
        item.innerHTML = `
      <img src="${escapeHtml(a.img)}" alt="${escapeHtml(a.title)}" class="img-fluid">
      <div>
        <h4><a href="../../artigo.html?slug=${encodeURIComponent(a.slug)}">${escapeHtml(a.title)}</a></h4>
        <time>${formatDateDMY(a.date)}</time>
      </div>
    `;
        sidebar.appendChild(item);
    });
}

// --------------------
// SIDEBAR: CATEGORIAS (insere <ul> dentro da div #sidebar-categories)
// --------------------
function renderSidebarCategories(articles) {
    const containerDiv = qs(SELECTORS.categoriesContainer);
    if (!containerDiv) { console.warn("#sidebar-categories não encontrado"); return; }
    containerDiv.innerHTML = ""; // limpa

    const counts = {};
    articles.forEach(a => {
        if (Array.isArray(a.categories)) a.categories.forEach(c => { if (!c) return; counts[c] = (counts[c] || 0) + 1; });
    });

    const ul = document.createElement("ul");
    ul.className = "list-unstyled";
    Object.keys(counts).sort((x, y) => x.localeCompare(y, "pt-BR")).forEach(cat => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="blog.html?category=${encodeURIComponent(cat)}">${escapeHtml(cat)} <span>(${counts[cat]})</span></a>`;
        ul.appendChild(li);
    });

    if (Object.keys(counts).length === 0) {
        containerDiv.innerHTML = "<p>Sem categorias.</p>";
    } else {
        containerDiv.appendChild(ul);
    }
}

// --------------------
// SIDEBAR: TAGS POPULARES (gera dentro de #sidebar-popular-tags .tag-cloud)
// --------------------
function renderSidebarTags(articles) {
    const tagDiv = qs(SELECTORS.tagsContainer);
    if (!tagDiv) { console.warn("#sidebar-popular-tags não encontrado"); return; }
    tagDiv.innerHTML = "";

    const tagCounts = {};
    articles.forEach(a => {
        if (Array.isArray(a.tags)) a.tags.forEach(t => { if (!t) return; tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });

    // pegar top 20 por frequência
    const top = Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR")).slice(0, 20);

    if (top.length === 0) {
        tagDiv.innerHTML = "<p>Sem tags.</p>";
        return;
    }

    top.forEach(([tag, count]) => {
        const el = document.createElement("a");
        el.href = `blog.html?tag=${encodeURIComponent(tag)}`;
        el.className = "tag";
        el.style.margin = "4px";
        el.textContent = tag + (count ? ` (${count})` : "");
        tagDiv.appendChild(el);
    });
}

// --------------------
// APLICAR FILTROS URL (?category=.. ?tag=..)
// --------------------
function applyURLFilters() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const tag = params.get("tag");

    if (!category && !tag) {
        filteredArticles = [...allArticles];
        return;
    }

    filteredArticles = allArticles.filter(a => {
        if (category && Array.isArray(a.categories) && a.categories.includes(category)) return true;
        if (tag && Array.isArray(a.tags) && a.tags.includes(tag)) return true;
        return false;
    });

    currentPage = 1;
}

// --------------------
// SETUP SEARCH FORM (mantém layout: envia para search-results.html?q=...)
// --------------------
function setupSearchForm() {
    const form = qs(SELECTORS.searchFormSelector);
    if (!form) return;
    form.addEventListener("submit", (ev) => {
        const q = form.querySelector('input[name="q"]')?.value?.trim();
        if (!q) { ev.preventDefault(); alert("Digite algo para buscar."); }
        // caso deseje interceptar e fazer busca local, podemos implementar
    });
}

// --------------------
// INICIALIZAÇÃO
// --------------------
document.addEventListener("DOMContentLoaded", () => {
    setupSearchForm();
    loadArticles();
});
