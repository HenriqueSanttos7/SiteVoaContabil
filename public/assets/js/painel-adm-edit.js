// /assets/js/painel-adm-edit.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref as dbRef, get, set } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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
const auth = getAuth(app);
signInAnonymously(auth);

const quill = new Quill('#quill-editor', { theme: 'snow' });

const titleEl = document.getElementById('title');
const slugEl = document.getElementById('slug');
const excerptEl = document.getElementById('excerpt');
const dateEl = document.getElementById('date');
const authorNameEl = document.getElementById('author-name');
const authorPhotoInput = document.getElementById('author-photo-input');
const authorPhotoPreview = document.getElementById('author-photo-preview');
const coverInput = document.getElementById('coverImage');
const coverPreview = document.getElementById('image-preview');
const categoryContainer = document.getElementById('category-container');
const tagContainer = document.getElementById('tag-container');
const categoryInput = document.getElementById('category-input');
const tagInput = document.getElementById('tag-input');
const publishBtn = document.getElementById('publishBtn');
const loadingOverlay = document.getElementById('publish-loading');

const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');

if (!slug) {
  Swal.fire({ icon: "error", title: "Erro", text: "Abra com ?slug=seu-artigo" });
}

// === BADGES ===
function createBadge(text, container) {
  const b = document.createElement('span');
  b.className = 'badge bg-primary me-2 mb-2';
  b.textContent = text;
  b.style.cursor = 'pointer';
  b.onclick = () => b.remove();
  container.appendChild(b);
}

['category', 'tag'].forEach(type => {
  const input = type === 'category' ? categoryInput : tagInput;
  const container = type === 'category' ? categoryContainer : tagContainer;
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter' && input.value.trim()) {
      createBadge(input.value.trim(), container);
      input.value = '';
      e.preventDefault();
    }
  });
});

// === PREVIEW IMAGENS ===
[coverInput, authorPhotoInput].forEach(input => {
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = input.id === 'coverImage' ? coverPreview : authorPhotoPreview;
      img.src = e.target.result;
      img.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
});

// === FUNÇÕES ===
async function resolveURL(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  try { return await getDownloadURL(storageRef(storage, path)); } catch { return ''; }
}

function toDateInput(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}

async function upload(file, prefix) {
  if (!file) return null;
  const name = `${prefix}_${Date.now()}_${file.name}`;
  const ref = storageRef(storage, name);
  await uploadBytes(ref, file);
  return name;
}

async function load() {
  const snap = await get(dbRef(db, `articles/${slug}`));
  if (!snap.exists()) {
    Swal.fire("Erro", "Artigo não encontrado", "error");
    return;
  }

  const d = snap.val();

  titleEl.value = d.title || '';
  slugEl.value = slug;
  excerptEl.value = d.subtitle || '';
  dateEl.value = toDateInput(d.date || d.publishedAt || Date.now());

  authorNameEl.value = d.author?.name || 'Equipe AM Consultoria';

  categoryContainer.innerHTML = ''; (d.categories || []).forEach(c => createBadge(c, categoryContainer));
  tagContainer.innerHTML = ''; (d.tags || []).forEach(t => createBadge(t, tagContainer));

  quill.root.innerHTML = d.contentHtml || '';

  if (d.featuredImage) {
    const url = await resolveURL(d.featuredImage);
    if (url) { coverPreview.src = url; coverPreview.style.display = 'block'; }
  }
  if (d.author?.photoUrl) {
    const url = await resolveURL(d.author.photoUrl);
    if (url) { authorPhotoPreview.src = url; authorPhotoPreview.style.display = 'block'; }
  }

  // Muda botão para verde
  publishBtn.classList.replace('btn-primary', 'btn-success');
  publishBtn.innerHTML = '<i class="bi bi-check2-all me-2"></i> Salvar Alterações';

  window.isDirty = false;
}

// === SALVAR ===
publishBtn.onclick = async () => {
  if (!titleEl.value.trim()) return Swal.fire({ icon: 'warning', title: 'Título obrigatório' });

  publishBtn.disabled = true;
  loadingOverlay.style.display = 'flex';

  try {
    const coverFile = coverInput.files[0];
    const authorFile = authorPhotoInput.files[0];

    let coverPath = (await get(dbRef(db, `articles/${slug}/featuredImage`))).val() || '';
    let authorPath = (await get(dbRef(db, `articles/${slug}/author/photoUrl`))).val() || '';

    if (coverFile) coverPath = await upload(coverFile, `articles/${slug}/cover`);
    if (authorFile) authorPath = await upload(authorFile, `articles/${slug}/author`);

    const data = {
      title: titleEl.value.trim(),
      subtitle: excerptEl.value.trim(),
      date: dateEl.value,
      author: { name: authorNameEl.value.trim() || 'Equipe AM Consultoria', photoUrl: authorPath },
      featuredImage: coverPath,
      categories: Array.from(categoryContainer.querySelectorAll('.badge')).map(b => b.textContent),
      tags: Array.from(tagContainer.querySelectorAll('.badge')).map(b => b.textContent),
      contentHtml: quill.root.innerHTML,
      updatedAt: new Date().toISOString()
    };

    await set(dbRef(db, `articles/${slug}`), data);

    loadingOverlay.style.display = 'none';
    Swal.fire({ icon: 'success', title: 'Salvo!', text: 'Alterações aplicadas com sucesso' }).then(() => {
      load(); // recarrega e limpa o dirty
    });

  } catch (e) {
    loadingOverlay.style.display = 'none';
    publishBtn.disabled = false;
    Swal.fire({ icon: 'error', title: 'Erro', text: e.message });
  }
};

// Init
load();