// scripts/admin.js
import { supabase } from './supabase-config.js';

// ============================================================================
// 1. INICIALIZAÇÃO DO EDITOR RICH TEXT (QUILL.JS)
// ============================================================================
const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Escreva o conteúdo completo da matéria aqui...',
    modules: {
        toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean']
        ]
    }
});

// Referências de Autenticação e Layout
const authSection = document.getElementById('auth-section');
const panelSection = document.getElementById('panel-section');
const loginForm = document.getElementById('admin-login-form');
const loginAlert = document.getElementById('login-alert');
const userEmailSpan = document.getElementById('admin-user-email');
const btnLogout = document.getElementById('btn-logout');
const btnLogoutMobile = document.getElementById('btn-logout-mobile');

// Elementos da Sidebar
const adminSidebar = document.getElementById('admin-sidebar');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const navBtnCreate = document.getElementById('nav-btn-create');
const navBtnList = document.getElementById('nav-btn-list');
const navBtnCategories = document.getElementById('nav-btn-categories');

// Vistas / Abas
const viewCreate = document.getElementById('view-create');
const viewList = document.getElementById('view-list');
const viewCategories = document.getElementById('view-categories');

// Formulário de Notícia
const newsForm = document.getElementById('news-form');
const newsCategorySelect = document.getElementById('news-category');
const coverInput = document.getElementById('news-cover');
const galleryInput = document.getElementById('news-gallery');
const coverPreview = document.getElementById('cover-preview');
const galleryPreview = document.getElementById('gallery-preview');
const progressBox = document.getElementById('upload-progress-box');
const progressBar = document.getElementById('upload-progress-bar');
const statusText = document.getElementById('upload-status-text');
const formFeedback = document.getElementById('form-feedback');
const btnPublish = document.getElementById('btn-publish');

// Listagem de Notícias
const adminTableBody = document.getElementById('admin-table-body');
const listSearchInput = document.getElementById('list-search-input');
const listCategoryFilter = document.getElementById('list-category-filter');

// Gestão de Categorias
const categoryForm = document.getElementById('category-form');
const categoryNameInput = document.getElementById('category-name');
const categoryFeedback = document.getElementById('category-feedback');
const categoriesTableBody = document.getElementById('categories-table-body');

let currentUser = null;
let todasAsNoticias = [];
let todasAsCategorias = [];

// ============================================================================
// 2. NAVEGAÇÃO ENTRE ABAS DO MENU LATERAL (SIDEBAR)
// ============================================================================
window.switchAdminTab = (tabName) => {
    // Atualiza classes ativas nos botões da sidebar
    navBtnCreate.classList.toggle('active', tabName === 'create');
    navBtnList.classList.toggle('active', tabName === 'list');
    navBtnCategories.classList.toggle('active', tabName === 'categories');

    // Alterna visibilidade das telas
    viewCreate.classList.toggle('hidden', tabName !== 'create');
    viewList.classList.toggle('hidden', tabName !== 'list');
    viewCategories.classList.toggle('hidden', tabName !== 'categories');

    // Fecha menu no mobile se aberto
    adminSidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('active');

    // Carrega dados específicos da aba
    if (tabName === 'list') {
        carregarNoticiasAdmin();
    } else if (tabName === 'categories') {
        renderizarTabelaCategorias();
    }
};

navBtnCreate.addEventListener('click', () => window.switchAdminTab('create'));
navBtnList.addEventListener('click', () => window.switchAdminTab('list'));
navBtnCategories.addEventListener('click', () => window.switchAdminTab('categories'));

// Mobile Sidebar Toggle
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
        adminSidebar.classList.toggle('open');
        sidebarBackdrop.classList.toggle('active');
    });
}
if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
        adminSidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('active');
    });
}

// ============================================================================
// 3. AUTENTICAÇÃO (SUPABASE AUTH)
// ============================================================================
const atualizarInterfaceAuth = (session) => {
    currentUser = session?.user || null;
    if (currentUser) {
        authSection.classList.add('hidden');
        panelSection.classList.remove('hidden');
        userEmailSpan.textContent = currentUser.email;
        carregarCategorias();
        carregarNoticiasAdmin();
    } else {
        panelSection.classList.add('hidden');
        authSection.classList.remove('hidden');
        userEmailSpan.textContent = '';
    }
};

supabase.auth.getSession().then(({ data: { session } }) => {
    atualizarInterfaceAuth(session);
});

supabase.auth.onAuthStateChange((_event, session) => {
    atualizarInterfaceAuth(session);
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.classList.add('hidden');

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const btnLogin = document.getElementById('btn-login');

    try {
        btnLogin.disabled = true;
        btnLogin.textContent = 'A autenticar...';

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        loginForm.reset();
    } catch (error) {
        console.error('Erro no login Supabase:', error);
        loginAlert.textContent = 'E-mail ou palavra-passe incorretos. Verifique suas credenciais no Supabase Auth.';
        loginAlert.classList.remove('hidden');
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar no Painel';
    }
});

const realizarLogout = async () => {
    await supabase.auth.signOut();
};
btnLogout.addEventListener('click', realizarLogout);
if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', realizarLogout);

// ============================================================================
// 4. GESTÃO DE CATEGORIAS
// ============================================================================
const gerarSlug = (texto) => {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

async function carregarCategorias() {
    try {
        const { data: categorias, error } = await supabase
            .from('categorias')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;

        todasAsCategorias = categorias || [];
        popularSelectsCategorias();
        renderizarTabelaCategorias();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Fallback básico caso o SQL ainda não tenha sido executado
        todasAsCategorias = [
            { id: '1', nome: 'Saúde Animal', slug: 'saude-animal' },
            { id: '2', nome: 'Resgates', slug: 'resgates' },
            { id: '3', nome: 'Projetos de Lei', slug: 'projetos-de-lei' }
        ];
        popularSelectsCategorias();
    }
}

function popularSelectsCategorias() {
    // 1. Select do Formulário de Criação
    newsCategorySelect.innerHTML = '<option value="" disabled selected>Selecione uma categoria...</option>';
    todasAsCategorias.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat.nome;
        opt.textContent = cat.nome;
        newsCategorySelect.appendChild(opt);
    });

    // 2. Select do Filtro de Listagem
    listCategoryFilter.innerHTML = '<option value="all">Todas as Categorias</option>';
    todasAsCategorias.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat.nome;
        opt.textContent = cat.nome;
        listCategoryFilter.appendChild(opt);
    });
}

function renderizarTabelaCategorias() {
    if (!categoriesTableBody) return;

    if (todasAsCategorias.length === 0) {
        categoriesTableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
                    Nenhuma categoria cadastrada.
                </td>
            </tr>
        `;
        return;
    }

    categoriesTableBody.innerHTML = '';
    todasAsCategorias.forEach((cat) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cat.nome}</strong></td>
            <td><code>${cat.slug}</code></td>
            <td style="text-align: right;">
                <button type="button" class="btn-danger-sm" data-id="${cat.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tr.querySelector('.btn-danger-sm').addEventListener('click', async () => {
            if (confirm(`Tem a certeza que deseja remover a categoria "${cat.nome}"?`)) {
                const { error } = await supabase.from('categorias').delete().eq('id', cat.id);
                if (error) {
                    alert(`Erro ao excluir categoria: ${error.message}`);
                } else {
                    carregarCategorias();
                }
            }
        });

        categoriesTableBody.appendChild(tr);
    });
}

// Formulário de Nova Categoria
categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    categoryFeedback.classList.add('hidden');

    const nome = categoryNameInput.value.trim();
    if (!nome) return;

    const slug = gerarSlug(nome);
    const btnSave = document.getElementById('btn-save-category');

    try {
        btnSave.disabled = true;
        const { error } = await supabase
            .from('categorias')
            .insert([{ nome, slug }]);

        if (error) throw error;

        categoryFeedback.textContent = `Categoria "${nome}" cadastrada com sucesso!`;
        categoryFeedback.className = 'alert-box alert-success';
        categoryFeedback.classList.remove('hidden');

        categoryForm.reset();
        await carregarCategorias();
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        categoryFeedback.textContent = `Erro ao salvar: ${error.message}`;
        categoryFeedback.className = 'alert-box alert-error';
        categoryFeedback.classList.remove('hidden');
    } finally {
        btnSave.disabled = false;
    }
});

// ============================================================================
// 5. UPLOAD DE IMAGENS E CRIAÇÃO DE NOTÍCIA
// ============================================================================
const gerarPreviewImagens = (files, container) => {
    container.innerHTML = '';
    Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;
            container.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
};

coverInput.addEventListener('change', (e) => gerarPreviewImagens(e.target.files, coverPreview));
galleryInput.addEventListener('change', (e) => gerarPreviewImagens(e.target.files, galleryPreview));

const sanitizarNomeFicheiro = (nome) => nome.replace(/[^a-zA-Z0-9._-]/g, '_');

const fazerUploadImagem = async (file, subpasta) => {
    const nomeUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizarNomeFicheiro(file.name)}`;
    const filePath = `${subpasta}/${nomeUnico}`;

    const { error: uploadError } = await supabase.storage
        .from('noticias')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('noticias').getPublicUrl(filePath);
    return data.publicUrl;
};

const exibirMensagemNoticia = (texto, tipo = 'success') => {
    formFeedback.textContent = texto;
    formFeedback.className = `alert-box ${tipo === 'error' ? 'alert-error' : 'alert-success'}`;
    formFeedback.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formFeedback.classList.add('hidden');

    const titulo = document.getElementById('news-title').value.trim();
    const subtitulo = document.getElementById('news-subtitle').value.trim();
    const categoria = newsCategorySelect.value;
    const corpoHtml = quill.root.innerHTML;
    const textoPuro = quill.getText().trim();
    const coverFile = coverInput.files[0];
    const galleryFiles = Array.from(galleryInput.files);

    if (!categoria) {
        exibirMensagemNoticia('Por favor, selecione uma categoria.', 'error');
        return;
    }

    if (!textoPuro) {
        exibirMensagemNoticia('Por favor, preencha o corpo da matéria.', 'error');
        return;
    }

    if (!coverFile) {
        exibirMensagemNoticia('Por favor, selecione a foto de capa principal.', 'error');
        return;
    }

    try {
        btnPublish.disabled = true;
        progressBox.classList.remove('hidden');
        progressBar.style.width = '20%';
        statusText.textContent = 'A enviar foto de capa para o Storage...';

        // 1. Upload Capa
        const capaUrl = await fazerUploadImagem(coverFile, 'capas');
        progressBar.style.width = '50%';

        // 2. Upload Múltiplo da Galeria
        let galeriaUrls = [];
        if (galleryFiles.length > 0) {
            statusText.textContent = `A enviar ${galleryFiles.length} foto(s) da galeria...`;
            galeriaUrls = await Promise.all(
                galleryFiles.map((file) => fazerUploadImagem(file, 'galerias'))
            );
        }
        progressBar.style.width = '85%';

        // 3. Salvar na Tabela 'noticias'
        statusText.textContent = 'A guardar notícia no Supabase...';
        const { error: dbError } = await supabase
            .from('noticias')
            .insert([{
                titulo,
                subtitulo,
                categoria,
                corpo: corpoHtml,
                capa_url: capaUrl,
                galeria_urls: galeriaUrls,
                publicado: true,
                autor_email: currentUser?.email || 'admin'
            }]);

        if (dbError) throw dbError;

        progressBar.style.width = '100%';
        exibirMensagemNoticia('Notícia publicada com sucesso!', 'success');

        // Limpar campos
        newsForm.reset();
        quill.setContents([]);
        coverPreview.innerHTML = '';
        galleryPreview.innerHTML = '';

        // Recarrega lista
        await carregarNoticiasAdmin();

        // Leva o utilizador para a listagem após 1.5s
        setTimeout(() => {
            window.switchAdminTab('list');
        }, 1200);

    } catch (error) {
        console.error('Erro ao publicar notícia:', error);
        exibirMensagemNoticia(`Erro ao publicar: ${error.message}`, 'error');
    } finally {
        btnPublish.disabled = false;
        setTimeout(() => {
            progressBox.classList.add('hidden');
            progressBar.style.width = '0%';
        }, 1200);
    }
});

// ============================================================================
// 6. LISTAGEM DE NOTÍCIAS & FILTROS
// ============================================================================
async function carregarNoticiasAdmin() {
    try {
        const { data: noticias, error } = await supabase
            .from('noticias')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        todasAsNoticias = noticias || [];
        renderizarTabelaNoticias();
    } catch (error) {
        console.error('Erro ao carregar lista de notícias:', error);
        adminTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #b91c1c; padding: 2rem;">
                    Erro ao carregar notícias. Verifique a tabela <code>noticias</code> no Supabase.
                </td>
            </tr>
        `;
    }
}

function renderizarTabelaNoticias() {
    const termoBusca = (listSearchInput?.value || '').toLowerCase().trim();
    const filtroCat = listCategoryFilter?.value || 'all';

    const noticiasFiltradas = todasAsNoticias.filter((n) => {
        const matchBusca = !termoBusca || n.titulo.toLowerCase().includes(termoBusca);
        const matchCat = filtroCat === 'all' || n.categoria === filtroCat;
        return matchBusca && matchCat;
    });

    if (noticiasFiltradas.length === 0) {
        adminTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                    Nenhuma notícia encontrada com os filtros selecionados.
                </td>
            </tr>
        `;
        return;
    }

    adminTableBody.innerHTML = '';
    noticiasFiltradas.forEach((noticia) => {
        const dataFormatada = noticia.criado_em
            ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(noticia.criado_em))
            : 'Recente';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${noticia.capa_url}" alt="Capa" class="table-news-cover">
            </td>
            <td>
                <strong style="color: var(--primary); display: block; font-size: 0.95rem;">${noticia.titulo}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${noticia.subtitulo || ''}</span>
            </td>
            <td>
                <span class="badge-category">${noticia.categoria || 'Geral'}</span>
            </td>
            <td style="white-space: nowrap; font-size: 0.85rem; color: var(--text-muted);">
                ${dataFormatada}
            </td>
            <td style="text-align: right; white-space: nowrap;">
                <a href="materia.html?id=${noticia.id}" target="_blank" class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; margin-right: 0.35rem;">
                    <i class="fas fa-eye"></i> Ver
                </a>
                <button type="button" class="btn-danger-sm" data-id="${noticia.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tr.querySelector('.btn-danger-sm').addEventListener('click', async () => {
            if (confirm(`Tem a certeza que deseja eliminar a matéria "${noticia.titulo}"?`)) {
                const { error: delError } = await supabase
                    .from('noticias')
                    .delete()
                    .eq('id', noticia.id);

                if (delError) {
                    alert(`Erro ao excluir: ${delError.message}`);
                } else {
                    await carregarNoticiasAdmin();
                }
            }
        });

        adminTableBody.appendChild(tr);
    });
}

listSearchInput?.addEventListener('input', renderizarTabelaNoticias);
listCategoryFilter?.addEventListener('change', renderizarTabelaNoticias);
