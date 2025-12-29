import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// CONFIGURAÇÃO FIREBASE
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

signInAnonymously(auth).catch(err => console.error("Erro Auth:", err));

// Quill
const quill = new Quill('#quill-editor', { theme: 'snow' });

// Tags e Categorias
const tagInput = document.getElementById('tag-input');
const tagContainer = document.getElementById('tag-container');
const categoryInput = document.getElementById('category-input');
const categoryContainer = document.getElementById('category-container');

function createBadge(text, container) {
  const span = document.createElement('span');
  span.classList.add('badge', 'bg-primary', 'me-2', 'mb-2');
  span.textContent = text;
  span.style.cursor = 'pointer';
  span.addEventListener('click', () => span.remove());
  container.appendChild(span);
}

tagInput.addEventListener('keypress', e => {
  if (e.key === 'Enter' && tagInput.value.trim()) {
    createBadge(tagInput.value.trim(), tagContainer);
    tagInput.value = '';
  }
});

categoryInput.addEventListener('keypress', e => {
  if (e.key === 'Enter' && categoryInput.value.trim()) {
    createBadge(categoryInput.value.trim(), categoryContainer);
    categoryInput.value = '';
  }
});

function getArrayFromBadges(container) {
  return Array.from(container.querySelectorAll('.badge')).map(b => b.textContent.trim());
}

// Upload de arquivos
async function uploadFile(file, path) {
  const storageReference = sRef(storage, path);
  await uploadBytes(storageReference, file);
  return await getDownloadURL(storageReference);
}

// Pré-visualização de imagens
document.getElementById('coverImage').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => document.getElementById('image-preview').src = reader.result;
    reader.readAsDataURL(file);
  }
});

document.getElementById('author-photo-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => document.getElementById('author-photo-preview').src = reader.result;
    reader.readAsDataURL(file);
  }
});

// ===============================================
// BOTÃO PUBLICAR – VERSÃO FINAL COM SWEETALERT2 + SEU SPINNER
// ===============================================
document.getElementById('publishBtn').addEventListener('click', async () => {
  const publishBtn = document.getElementById('publishBtn');
  const loadingOverlay = document.getElementById('publish-loading');

  // Validação simples
  const title = document.getElementById('title').value.trim();
  if (!title) {
    Swal.fire({
      icon: 'warning',
      title: 'Título obrigatório',
      text: 'Por favor, preencha o título do artigo antes de publicar.',
      confirmButtonColor: '#0d6efd'
    });
    return;
  }

  // Ativa spinner + desabilita botão
  loadingOverlay.style.display = 'flex';
  publishBtn.disabled = true;
  publishBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Publicando...';

  // Dados do artigo
  const slug = document.getElementById('slug').value.trim() ||
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const subtitle = document.getElementById('excerpt').value.trim();
  const date = document.getElementById('date').value || new Date().toISOString().split('T')[0];
  const authorName = document.getElementById('author-name').value.trim() || 'Equipe AM Consultoria';
  const contentHtml = quill.root.innerHTML;

  const tags = getArrayFromBadges(tagContainer);
  const categories = getArrayFromBadges(categoryContainer);

  const coverFile = document.getElementById('coverImage').files[0];
  const authorPhotoFile = document.getElementById('author-photo-input').files[0];

  let coverUrl = '';
  let authorPhotoUrl = '';

  try {
    if (coverFile) {
      coverUrl = await uploadFile(coverFile, `articles/${slug}/cover_${Date.now()}_${coverFile.name}`);
    }
    if (authorPhotoFile) {
      authorPhotoUrl = await uploadFile(authorPhotoFile, `articles/${slug}/author_${Date.now()}_${authorPhotoFile.name}`);
    }

    const articleData = {
      title,
      subtitle,
      slug,
      date,
      author: {
        name: authorName,
        photoUrl: authorPhotoUrl || null
      },
      featuredImage: coverUrl || null,
      tags,
      categories,
      contentHtml,
      publishedAt: new Date().toISOString(),
      status: 'published'
    };

    await set(ref(db, `articles/${slug}`), articleData);

    // Esconde spinner
    loadingOverlay.style.display = 'none';

    // SUCESSO — COM BOTÃO "FECHAR", SEM NENHUM "VER ARTIGO"
    Swal.fire({
      icon: 'success',
      title: 'Publicado com sucesso!',
      text: `"${title}" já está no blog!`,
      confirmButtonText: 'Fechar',
      confirmButtonColor: '#0d6efd',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      location.reload();
    });

  } catch (err) {
    console.error("Erro ao publicar:", err);

    // Esconde spinner e reativa botão
    loadingOverlay.style.display = 'none';
    publishBtn.disabled = false;
    publishBtn.innerHTML = '<i class="bi bi-check2-all me-2"></i>Publicar Artigo';

    // ERRO
    Swal.fire({
      icon: 'error',
      title: 'Falha ao publicar',
      text: 'Não foi possível salvar o artigo.',
      footer: err.message ? `<small>${err.message}</small>` : '',
      confirmButtonColor: '#d63384'
    });
  }
});