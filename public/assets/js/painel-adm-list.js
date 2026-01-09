import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

/* ============== CONFIG FIREBASE ============== */
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
const auth = getAuth(app);

signInAnonymously(auth).catch(err => {
    console.error("Erro auth:", err);
});

// SITE_KEY
const SITE_KEY = "voa"; // ou "voa"

/* ============================================= */

const tableBody = document.getElementById("articles-table-body");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const totalCountEl = document.getElementById("total-count");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const perPageSelect = document.getElementById("per-page");

let allArticles = [];
let filtered = [];
let currentPage = 1;
let itemsPerPage = parseInt(perPageSelect.value, 10);

/* formata data para D/M/Y */
function formatDateDMY(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

/* carregar todos os artigos (uma só leitura) */
async function loadAllArticles() {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Carregando...</td></tr>`;
    try {
        const snap = await get(ref(db, `sites/${SITE_KEY}/articles`)); // ajuste para 'artigos' se for o seu nó
        const val = snap.exists() ? snap.val() : null;

        allArticles = [];

        if (val) {
            for (const slug in val) {
                const item = val[slug];
                // garantir campos essenciais
                allArticles.push({
                    slug,
                    title: item.title || '',
                    date: item.date || '',
                    categories: Array.isArray(item.categories) ? item.categories : (item.categories ? Object.values(item.categories) : []),
                    raw: item
                });
            }

            // ordenar por data desc (mais recente primeiro)
            allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        buildCategoryOptions();
        applyFilters();

    } catch (err) {
        console.error('Erro ao buscar artigos:', err);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar artigos.</td></tr>`;
    }
}

/* montar opções de categoria dinamicamente */
function buildCategoryOptions() {
    const s = new Set();
    allArticles.forEach(a => (a.categories || []).forEach(c => s.add(c)));
    categoryFilter.innerHTML = `<option value="">Filtrar por categoria</option>`;
    Array.from(s).sort().forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.appendChild(opt);
    });
}

/* aplicar busca e filtro */
function applyFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const cat = categoryFilter.value;

    filtered = allArticles.filter(a => {
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchCat = !cat || (a.categories || []).includes(cat);
        return matchTitle && matchCat;
    });

    totalCountEl.textContent = filtered.length;
    currentPage = 1;
    renderTable();
}

/* renderizar tabela com paginação */
function renderTable() {
    itemsPerPage = parseInt(perPageSelect.value, 10) || 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    tableBody.innerHTML = '';
    if (pageItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum resultado.</td></tr>`;
    } else {
        pageItems.forEach(a => {
            const tr = document.createElement('tr');

            const cats = (a.categories || []).map(c => `<span class="badge bg-primary me-1">${c}</span>`).join(' ');

            tr.innerHTML = `
        <td>${escapeHtml(a.title)}</td>
        <td>${escapeHtml(a.slug)}</td>
        <td>${cats}</td>
        <td>${formatDateDMY(a.date)}</td>
        <td>
          <button class="btn btn-sm btn-primary me-2 btn-edit" data-slug="${a.slug}">Editar</button>
          <button class="btn btn-sm btn-danger btn-delete" data-slug="${a.slug}">Excluir</button>
        </td>
      `;
            tableBody.appendChild(tr);
        });
    }

    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    attachRowActions();
}

/* attach edit/delete handlers */
function attachRowActions() {
    tableBody.querySelectorAll('.btn-edit').forEach(b => {
        b.onclick = () => {
            const slug = b.dataset.slug;
            // abre seu formulário de edição (mesmo form de post)
            window.location.href = `/adm-edit.html?slug=${encodeURIComponent(slug)}`;
        };
    });

    tableBody.querySelectorAll('.btn-delete').forEach(b => {
        b.onclick = async () => {
            const slug = b.dataset.slug;
            const res = await Swal.fire({
                title: 'Confirmar exclusão?',
                text: `O artigo "${slug}" será removido permanentemente.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Excluir',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d'
            });

            if (!res.isConfirmed) return;

            try {
                await remove(ref(db, `sites/${SITE_KEY}/articles/${slug}`)); // ajusta nó se necessário
                // recarregar dados
                await loadAllArticles();
            } catch (err) {
                console.error('Erro ao excluir:', err);
                alert('Erro ao excluir. Veja o console.');
            }
        };
    });
}

/* util: escape simples para evitar injeção no título/slug */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/* eventos UI */
searchInput.addEventListener('input', () => { applyFilters(); });
categoryFilter.addEventListener('change', () => { applyFilters(); });
perPageSelect.addEventListener('change', () => { renderTable(); });

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderTable(); }
});
nextBtn.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    if (currentPage < totalPages) { currentPage++; renderTable(); }
});

/* inicializa */
loadAllArticles();
