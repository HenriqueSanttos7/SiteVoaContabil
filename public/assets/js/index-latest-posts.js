import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

import {
  getStorage,
  ref as sRef,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

/* ==========================================================
    CONFIG FIREBASE 
   ========================================================== */
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

/* ==========================================================
   1) SKELETON LOADER — versão personalizada para INDEX
   ========================================================== */
function renderSkeletons() {
  return `
    <div class="col-lg-7">
      <div class="featured-post skeleton-box"></div>
    </div>

    <div class="col-lg-5">
      <div class="skeleton-box compact-skeleton"></div>
      <div class="skeleton-box compact-skeleton mt-3"></div>
    </div>

    <div class="col-lg-4 mt-4">
      <div class="skeleton-box card-skeleton"></div>
    </div>
    <div class="col-lg-4 mt-4">
      <div class="skeleton-box card-skeleton"></div>
    </div>
    <div class="col-lg-4 mt-4">
      <div class="skeleton-box card-skeleton"></div>
    </div>
  `;
}

/* ==========================================================
   2) CONVERTER OBJETOS DO FIREBASE EM POSTS
   ========================================================== */
async function formatPost(slug, a) {
  let img = "/assets/img/blog/default.jpg";

  if (a.featuredImage) {
    try {
      img = await getDownloadURL(sRef(storage, a.featuredImage));
    } catch (e) {
      console.warn("Imagem não carregou:", e);
    }
  }

  return {
    slug,
    title: a.title ?? "",
    subtitle: a.subtitle ?? "",
    author: a.author?.name ?? "AM Consultoria",
    categories: Array.isArray(a.categories)
      ? a.categories
      : a.categories
        ? [a.categories]
        : [],
    date: a.date ?? "",
    dateValue: isNaN(Date.parse(a.date)) ? 0 : Date.parse(a.date),
    img,
  };
}

/* ==========================================================
   3) CARREGAR ARTIGOS PARA A HOME
   ========================================================== */
async function loadLatestPosts() {
  const container = document.getElementById("latest-posts-container");
  if (!container) return;

  // SKELETON entra primeiro
  container.innerHTML = renderSkeletons();

  try {
    const snapshot = await get(ref(db, "articles"));
    const data = snapshot.val();

    if (!data) {
      container.innerHTML = "<p>Nenhum artigo encontrado.</p>";
      return;
    }

    // Formatando posts
    const promises = Object.entries(data).map(([slug, post]) =>
      formatPost(slug, post)
    );
    const posts = await Promise.all(promises);

    // Ordena por data
    posts.sort((a, b) => b.dateValue - a.dateValue);

    // Pega somente os 6 mais recentes
    const latest = posts.slice(0, 7);

    // Render final com layout IGUAL ao seu HTML base
    container.innerHTML = buildIndexLayout(latest);
  } catch (err) {
    console.error("Erro ao carregar posts da home:", err);
    container.innerHTML = "<p>Erro ao carregar artigos.</p>";
  }
}

/* ==========================================================
   4) CONSTRUTOR DO LAYOUT — 100% IGUAL AO SEU TEMPLATE
   ========================================================== */
function buildIndexLayout(posts) {
  // Quantos compact-posts existem (índices 1 e 2)
  window.__totalCompactPosts = posts.slice(1, 3).filter(Boolean).length;

  return `
    <!-- POST DESTACADO -->
    <div class="col-lg-7">
      ${featuredPost(posts[0])}
    </div>

    <!-- POSTS COMPACTOS -->
    <div class="col-lg-5 d-flex flex-column gap-4">
      ${compactPost(posts[1])}
      ${compactPost(posts[2])}
      ${compactPost(posts[3])}
    </div>

    <!-- 3 POSTS EM CARD -->
    <div class="col-lg-4 mt-4">${cardPost(posts[4])}</div>
    <div class="col-lg-4 mt-4">${cardPost(posts[5])}</div>
    <div class="col-lg-4 mt-4">${cardPost(posts[6])}</div>
  `;
}


/* ==========================================================
   COMPONENTES DO TEMPLATE
   ========================================================== */
function featuredPost(p) {
  if (!p) return "";

  return `
    <article class="featured-post position-relative h-100" 
             style="cursor: pointer;" 
             onclick="window.location='artigo.html?slug=${p.slug}'">
      <figure class="featured-media m-0">
        <img src="${p.img}" class="img-fluid w-100" alt="${p.title}" />
      </figure>

      <div class="featured-content">
        <div class="date-badge">
          <span class="day">${formatDay(p.date)}</span>
          <span class="mon">${formatMonth(p.date)}</span>
        </div>

        <span class="cat-badge inverse">${p.categories[0] ?? ""}</span>

        <h3 class="title">${p.title}</h3>
        <p class="excerpt d-none d-md-block">${p.subtitle}</p>

        <div class="meta d-flex align-items-center gap-3">
          <div class="d-flex align-items-center">
            <i class="bi bi-person"></i><span class="ps-2">${p.author}</span>
          </div>
        </div>

        <!-- Botão continua existindo, mas agora é só visual -->
        <a class="readmore stretched-link">
          <span>Continuar Lendo</span><i class="bi bi-arrow-right"></i>
        </a>
      </div>
    </article>
  `;
}

function compactPost(p) {
  if (!p) return "";

  const compactClass = window.__totalCompactPosts === 1
    ? "compact-post compact-single"
    : "compact-post h-100";

  return `
    <article class="${compactClass}" 
             style="cursor: pointer;" 
             onclick="window.location='artigo.html?slug=${p.slug}'">
      <div class="thumb">
        <img src="${p.img}" class="img-fluid" alt="${p.title}">
      </div>

      <div class="content">
        <div class="meta">
          <span class="date">${formatShortDate(p.date)}</span>
          <span class="dot">•</span>
          <span class="category">${p.categories[0] ?? ""}</span>
        </div>

        <h4 class="title">${p.title}</h4>

        <!-- Botão visual apenas -->
        <a class="readmore">
          <span>Ler Artigo</span><i class="bi bi-arrow-right"></i>
        </a>
      </div>
    </article>
  `;
}


function cardPost(p) {
  if (!p) return "";

  return `
    <article class="card-post h-100" 
             style="cursor: pointer;" 
             onclick="window.location='artigo.html?slug=${p.slug}'">
      <div class="post-img">
        <img src="${p.img}" class="img-fluid w-100" alt="${p.title}">
      </div>
      <div class="content">
        <div class="meta d-flex align-items-center flex-wrap gap-2">
          <span class="cat-badge">${p.categories[0] ?? ""}</span>
        </div>
        <h3 class="title">${p.title}</h3>
        <a class="readmore">
          <span>Ler Mais</span><i class="bi bi-arrow-right"></i>
        </a>
      </div>
    </article>
  `;
}

/* ==========================================================
   FORMATADORES DE DATA
   ========================================================== */
function formatDay(date) {
  const d = new Date(date);
  return d.getDate().toString().padStart(2, "0");
}

function formatMonth(date) {
  const d = new Date(date);
  return d.toLocaleString("pt-BR", { month: "short" });
}

function formatShortDate(date) {
  const d = new Date(date);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short" });
}

/* ==========================================================
   EXECUTAR
   ========================================================== */
loadLatestPosts();
