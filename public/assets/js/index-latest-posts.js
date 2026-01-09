import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { getStorage, ref as sRef, getDownloadURL, list } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";


//CONFIG FIREBASE 
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


const SITE_KEY = "voa"; // ou "voa"


// 1) SKELETON LOADER
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


//2) CONVERTER OBJETOS DO FIREBASE EM POSTS
async function formatPost(slug, a) {
  let img = "/assets/img/blog/default.jpg"; // fallback
  const folderPath = `${SITE_KEY}/articles/${slug}`;

  try {
    const folderRef = sRef(storage, folderPath);
    const res = await list(folderRef); // lista todos os arquivos da pasta

    // procura o primeiro arquivo que começa com "cover"
    const coverFile = res.items.find(file => file.name.startsWith("cover"));

    if (coverFile) {
      img = await getDownloadURL(coverFile);
    }
  } catch (e) {
    console.warn("Imagem não carregou para slug:", slug, e);
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


//3) CARREGAR ARTIGOS PARA A HOME
async function loadLatestPosts() {
  const container = document.getElementById("latest-posts-container");
  if (!container) return;

  container.innerHTML = renderSkeletons();

  try {
    const snapshot = await get(ref(db, `sites/${SITE_KEY}/articles`));
    const data = snapshot.val();

    if (!data) {
      container.innerHTML = "<p>Nenhum artigo encontrado.</p>";
      return;
    }

    const posts = await Promise.all(
      Object.entries(data).map(([slug, post]) =>
        formatPost(slug, post)
      )
    );

    posts.sort((a, b) => b.dateValue - a.dateValue);
    container.innerHTML = buildIndexLayout(posts.slice(0, 7));

  } catch (err) {
    console.error("Erro ao carregar posts da home:", err);
    container.innerHTML = "<p>Erro ao carregar artigos.</p>";
  }
}



//4) CONSTRUTOR DO LAYOUT
function buildIndexLayout(posts) {
  window.__totalCompactPosts = posts.slice(1, 3).filter(Boolean).length;

  return `
    <div class="col-lg-7">${featuredPost(posts[0])}</div>

    <div class="col-lg-5 d-flex flex-column gap-4">
      ${compactPost(posts[1])}
      ${compactPost(posts[2])}
      ${compactPost(posts[3])}
    </div>

    <div class="col-lg-4 mt-4">${cardPost(posts[4])}</div>
    <div class="col-lg-4 mt-4">${cardPost(posts[5])}</div>
    <div class="col-lg-4 mt-4">${cardPost(posts[6])}</div>
  `;
}


// COMPONENTES DO TEMPLATE
function featuredPost(p) {
  if (!p) return "";

  return `
    <article class="featured-post position-relative h-100"
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
        <a class="readmore stretched-link">
          <span>Continuar Lendo</span><i class="bi bi-arrow-right"></i>
        </a>
      </div>
    </article>
  `;
}

function compactPost(p) {
  if (!p) return "";

  const compactClass =
    window.__totalCompactPosts === 1
      ? "compact-post compact-single"
      : "compact-post h-100";

  return `
    <article class="${compactClass}"
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
      onclick="window.location='artigo.html?slug=${p.slug}'">
      <div class="post-img">
        <img src="${p.img}" class="img-fluid w-100" alt="${p.title}">
      </div>
      <div class="content">
        <span class="cat-badge">${p.categories[0] ?? ""}</span>
        <h3 class="title">${p.title}</h3>
        <a class="readmore">
          <span>Ler Mais</span><i class="bi bi-arrow-right"></i>
        </a>
      </div>
    </article>
  `;
}

//FORMATADORES DE DATA
function formatDay(date) {
  return new Date(date).getDate().toString().padStart(2, "0");
}

function formatMonth(date) {
  return new Date(date).toLocaleString("pt-BR", { month: "short" });
}

function formatShortDate(date) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}


// EXECUTAR
loadLatestPosts();
