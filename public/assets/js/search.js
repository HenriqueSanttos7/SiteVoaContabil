// search.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getStorage, ref as sRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import { listAll } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";


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

// SITE_KEY
const SITE_KEY = "voa"; // ou "voa"


// FORMATAR DATA (d/m/y)
function formatDateDMY(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// INICIAR SEARCH
document.addEventListener("DOMContentLoaded", initializeBlogSearch);

async function initializeBlogSearch() {

    const loading = document.getElementById("search-loading");
    loading?.classList.add("active");

    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("q")?.toLowerCase();

    const resultsContainer = document.querySelector("#search-results-posts .row");
    const resultsCountElement = document.querySelector(".page-title .heading p");

    if (!searchTerm) {
        loading?.classList.remove("active");
        return;
    }

    resultsCountElement.textContent = `Buscando resultados para: "${searchTerm}"...`;

    const results = await searchArticlesFirebase(searchTerm);

    loading?.classList.remove("active"); // 

    displayResults(results, resultsContainer, resultsCountElement, searchTerm);
}


// BUSCA DIRETA NO FIREBASE
async function searchArticlesFirebase(searchTerm) {
    try {
        const snapshot = await get(ref(db, `sites/${SITE_KEY}/articles`));
        const articles = snapshot.val();

        if (!articles) return [];

        const results = [];

        for (const slug of Object.keys(articles)) {
            const a = articles[slug];

            const searchable = `
                ${a.title ?? ""}
                ${a.subtitle ?? ""}
                ${a.categories?.join(" ") ?? ""}
            `.toLowerCase();

            if (searchable.includes(searchTerm)) {
                let img = "/assets/img/blog/default.jpg";

                try {
                    const coverRef = sRef(
                        storage,
                        `${SITE_KEY}/articles/${slug}`
                    );

                    const res = await listAll(coverRef);
                    const coverFile = res.items.find(i =>
                        i.name.startsWith("cover")
                    );

                    if (coverFile) {
                        img = await getDownloadURL(coverFile);
                    }
                } catch (e) {
                    console.warn("Capa não carregou no search:", slug, e);
                }

                results.push({
                    title: a.title,
                    date: formatDateDMY(a.date), // 🔥 DATA FORMATADA
                    author: a.author?.name ?? "AM Consultoria",
                    category: a.categories?.[0] ?? "Sem Categoria",
                    subtitle: a.subtitle,
                    slug,
                    img
                });
            }
        }

        return results;

    } catch (e) {
        console.error("Erro ao buscar artigos:", e);
        return [];
    }
}


// EXIBIR RESULTADOS
function displayResults(results, container, countElement, term) {
    container.innerHTML = "";

    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
                <h3 class="mt-3">Nenhum resultado encontrado para "${term}".</h3>
                <p>Tente outros termos ou revise a digitação.</p>
                <a href="blog.html" class="btn btn-primary mt-3">Ver Todos os Artigos</a>
            </div>
        `;
        countElement.textContent = `Nenhum resultado encontrado para "${term}".`;
        return;
    }

    countElement.textContent = `Encontramos ${results.length} resultado(s) para "${term}":`;

    results.forEach(a => {
        container.innerHTML += `
            <div class="col-lg-4" data-aos="fade-up">
                <article>
                    <div class="post-img">
                        <img src="${a.img}" class="img-fluid">
                    </div>
                    <p class="post-category">${a.category}</p>
                    <h2 class="title">
                        <a href="../../artigo.html?slug=${a.slug}">${a.title}</a>
                    </h2>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle post-author-img flex-shrink-0"></i>
                        <div class="post-meta">
                            <p class="post-author">Por ${a.author}</p>
                            <p class="post-date"><time>${a.date}</time></p>
                        </div>
                    </div>
                </article>
            </div>
        `;
    });
}
