// scripts/admin.js
import { supabase } from './supabase-config.js';

// ============================================================================
// 1. INICIALIZAÇÃO DO EDITOR RICH TEXT COMPLETO (ESTILO PRINT 2)
// ============================================================================
const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: '',
    modules: {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'underline', 'italic', 'strike'],
            [{ font: [] }],
            [{ color: [] }, { background: [] }],
            [{ list: 'unordered' }, { list: 'ordered' }, { align: [] }],
            ['blockquote', 'code-block'],
            ['link', 'image', 'video'],
            ['clean']
        ]
    }
});

// ============================================================================
// 2. REFERÊNCIAS DO DOM E ESTADO GLOBAL
// ============================================================================
const authSection = document.getElementById('auth-section');
const panelSection = document.getElementById('panel-section');
const loginForm = document.getElementById('admin-login-form');
const loginAlert = document.getElementById('login-alert');

const cmsWrapper = document.getElementById('cms-wrapper');
const cmsSidebar = document.getElementById('cms-sidebar');
const sidebarToggle = document.getElementById('cms-sidebar-toggle');
const userMenuBtn = document.getElementById('cms-user-menu-btn');
const userDropdown = document.getElementById('cms-user-dropdown');
const btnLogout = document.getElementById('btn-logout');

const headerTitleText = document.getElementById('cms-header-title-text');
const headerBackBtn = document.getElementById('cms-header-back-btn');
const headerActions = document.getElementById('cms-header-actions');
const breadcrumbText = document.getElementById('cms-breadcrumb-text');

// Formulário de Postagens (Print 2)
const postForm = document.getElementById('cms-post-form');
const postEditId = document.getElementById('post-edit-id');
const postDateInput = document.getElementById('post-date');
const postTitleInput = document.getElementById('post-title');
const btnVerifyTitle = document.getElementById('btn-verify-title');
const postSeoTitleInput = document.getElementById('post-seo-title');
const postSeoDescInput = document.getElementById('post-seo-desc');
const postKeywordsInput = document.getElementById('post-keywords');
const postCategorySelect = document.getElementById('post-category');
const postCompressionSelect = document.getElementById('post-compression');

const postImageFilename = document.getElementById('post-image-filename');
const btnSelectImage = document.getElementById('btn-select-image');
const postImageFile = document.getElementById('post-image-file');
const postCoverPreview = document.getElementById('post-cover-preview');
const postImageCaption = document.getElementById('post-image-caption');

const postGalleryFilename = document.getElementById('post-gallery-filename');
const btnSelectGallery = document.getElementById('btn-select-gallery');
const postGalleryFiles = document.getElementById('post-gallery-files');
const postGalleryPreview = document.getElementById('post-gallery-preview');

const editorVisualWrapper = document.getElementById('editor-wrapper-visual');
const postRawHtmlTextarea = document.getElementById('post-raw-html');
const toggleWysiwygCheckbox = document.getElementById('toggle-wysiwyg');
const btnPostBack = document.getElementById('btn-post-back');
const btnPostSave = document.getElementById('btn-post-save');
const postFeedback = document.getElementById('post-feedback');
const progressBox = document.getElementById('upload-progress-box');
const progressBar = document.getElementById('upload-progress-bar');
const statusText = document.getElementById('upload-status-text');

let currentUser = null;
let todasAsNoticias = [];
let todasAsCategorias = [];
let capaUrlExistente = '';
let galeriaUrlsExistentes = [];

// Formata a data de hoje como DD/MM/YYYY
const obterDataHojeBR = () => {
    const hoje = new Date();
    const d = String(hoje.getDate()).padStart(2, '0');
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const y = hoje.getFullYear();
    return `${d}/${m}/${y}`;
};

postDateInput.value = obterDataHojeBR();

// ============================================================================
// 3. CONTROLE DO MENU LATERAL, TOPBAR E NAVEGAÇÃO ENTRE AS 10 TELAS
// ============================================================================
sidebarToggle.addEventListener('click', () => {
    if (window.innerWidth <= 991) {
        cmsSidebar.classList.toggle('mobile-open');
    } else {
        cmsWrapper.classList.toggle('sidebar-collapsed');
    }
});

userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
});

document.addEventListener('click', () => {
    userDropdown.classList.add('hidden');
});

const metadadosTelas = {
    home: {
        titulo: '<strong>Home</strong> <span>- Dashboard</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Dashboard</span>',
        modoHeader: 'dashboard'
    },
    postagem: {
        titulo: '<strong>Postagens</strong> <span>- Edição/Criação</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / postagens / <span class="muted">Criar/Editar</span>',
        modoHeader: 'postagem'
    },
    noticias: {
        titulo: '<strong>Notícias</strong> <span>- Listagem Geral</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Notícias</span>',
        modoHeader: 'dashboard'
    },
    categorias: {
        titulo: '<strong>Categorias</strong> <span>- Gerenciamento</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Categorias</span>',
        modoHeader: 'dashboard'
    },
    rss: {
        titulo: '<strong>Importação RSS</strong> <span>- Fontes Automáticas</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Importação RSS</span>',
        modoHeader: 'dashboard'
    },
    anuncios: {
        titulo: '<strong>Anúncios</strong> <span>- Publicidade e Banners</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Anúncios</span>',
        modoHeader: 'dashboard'
    },
    imagens: {
        titulo: '<strong>Imagens</strong> <span>- Biblioteca de Mídia</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Imagens</span>',
        modoHeader: 'dashboard'
    },
    redes: {
        titulo: '<strong>Redes sociais</strong> <span>- Links Oficiais</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Redes sociais</span>',
        modoHeader: 'dashboard'
    },
    textos: {
        titulo: '<strong>Textos e contatos</strong> <span>- Institucional</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Textos e contatos</span>',
        modoHeader: 'dashboard'
    },
    newsletter: {
        titulo: '<strong>News Letter</strong> <span>- Base de Inscritos</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">News Letter</span>',
        modoHeader: 'dashboard'
    },
    usuarios: {
        titulo: '<strong>Usuários</strong> <span>- Administradores e Editores</span>',
        breadcrumb: '<i class="fas fa-home"></i> Home / <span class="muted">Usuários</span>',
        modoHeader: 'dashboard'
    }
};

window.switchCmsView = (viewName) => {
    // Atualiza botões ativos do menu lateral
    document.querySelectorAll('.cms-nav-btn').forEach((btn) => {
        const target = btn.getAttribute('data-view');
        const isAtivo = target === viewName || (viewName === 'postagem' && target === 'noticias');
        btn.classList.toggle('active', isAtivo);
    });

    // Oculta todas as seções e exibe a escolhida
    document.querySelectorAll('.cms-section').forEach((sec) => sec.classList.add('hidden'));
    const secaoAlvo = document.getElementById(`cms-view-${viewName}`);
    if (secaoAlvo) secaoAlvo.classList.remove('hidden');

    // Atualiza Cabeçalho Branco e Breadcrumb (Print 1 vs Print 2)
    const meta = metadadosTelas[viewName] || metadadosTelas.home;
    headerTitleText.innerHTML = meta.titulo;
    breadcrumbText.innerHTML = meta.breadcrumb;

    if (meta.modoHeader === 'postagem') {
        headerActions.innerHTML = `
            <button type="button" class="cms-quick-action-btn" onclick="window.openNewPostForm()">
                <i class="far fa-edit"></i>
                <span>Novo</span>
            </button>
        `;
    } else {
        headerActions.innerHTML = `
            <button type="button" class="cms-quick-action-btn" onclick="window.openNewPostForm()">
                <i class="far fa-edit"></i>
                <span>Nova postagem</span>
            </button>
            <button type="button" class="cms-quick-action-btn" onclick="window.switchCmsView('home')">
                <i class="far fa-chart-bar"></i>
                <span>Analytics</span>
            </button>
        `;
    }

    cmsSidebar.classList.remove('mobile-open');

    // Carrega dados específicos da aba
    if (viewName === 'home' || viewName === 'noticias') carregarNoticiasAdmin();
    if (viewName === 'categorias') carregarCategorias();
    if (viewName === 'rss') carregarRssFeeds();
    if (viewName === 'anuncios') carregarAnuncios();
    if (viewName === 'imagens') carregarGaleriaStorage();
    if (viewName === 'redes' || viewName === 'textos') carregarConfiguracoes();
    if (viewName === 'newsletter') carregarNewsletter();
    if (viewName === 'usuarios') carregarUsuarios();
};

document.querySelectorAll('.cms-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        window.switchCmsView(view);
    });
});

headerBackBtn.addEventListener('click', () => window.switchCmsView('home'));
document.getElementById('btn-top-nova-postagem')?.addEventListener('click', () => window.openNewPostForm());
document.getElementById('btn-top-analytics')?.addEventListener('click', () => window.switchCmsView('home'));

// Abre o formulário limpo para criar nova postagem (Print 2)
window.openNewPostForm = () => {
    postForm.reset();
    postEditId.value = '';
    capaUrlExistente = '';
    galeriaUrlsExistentes = [];
    postDateInput.value = obterDataHojeBR();
    postCompressionSelect.value = '75%';
    postImageFilename.value = '';
    postGalleryFilename.value = '';
    postCoverPreview.innerHTML = '';
    postGalleryPreview.innerHTML = '';
    quill.setContents([]);
    postRawHtmlTextarea.value = '';
    postFeedback.classList.add('hidden');
    window.switchCmsView('postagem');
};

// Abre o formulário preenchido para editar uma postagem existente
window.openEditPostForm = (id) => {
    const noticia = todasAsNoticias.find((n) => n.id === id);
    if (!noticia) return;

    postForm.reset();
    postEditId.value = noticia.id;
    capaUrlExistente = noticia.capa_url || '';
    galeriaUrlsExistentes = Array.isArray(noticia.galeria_urls) ? noticia.galeria_urls : [];

    postDateInput.value = noticia.data_publicacao || obterDataHojeBR();
    postTitleInput.value = noticia.titulo || '';
    postSeoTitleInput.value = noticia.titulo_seo || noticia.titulo || '';
    postSeoDescInput.value = noticia.descricao_seo || noticia.subtitulo || '';
    postKeywordsInput.value = noticia.palavras_chave || '';
    postCategorySelect.value = noticia.categoria || 'Saúde Animal';
    postCompressionSelect.value = noticia.compressao_imagem || '75%';
    postImageFilename.value = capaUrlExistente ? 'Imagem atual mantida (selecione outra para trocar)' : '';
    postImageCaption.value = noticia.legenda_imagem || '';
    postGalleryFilename.value = galeriaUrlsExistentes.length > 0 ? `${galeriaUrlsExistentes.length} foto(s) na galeria` : '';

    postCoverPreview.innerHTML = capaUrlExistente ? `<img src="${capaUrlExistente}" alt="Capa atual">` : '';
    postGalleryPreview.innerHTML = galeriaUrlsExistentes.map((u) => `<img src="${u}" alt="Galeria">`).join('');

    quill.root.innerHTML = noticia.corpo || '';
    postRawHtmlTextarea.value = noticia.corpo || '';
    postFeedback.classList.add('hidden');

    window.switchCmsView('postagem');
};

btnPostBack.addEventListener('click', () => window.switchCmsView('noticias'));

// ============================================================================
// 4. AUTENTICAÇÃO SUPABASE
// ============================================================================
const atualizarInterfaceAuth = (session) => {
    currentUser = session?.user || null;
    if (currentUser) {
        authSection.classList.add('hidden');
        panelSection.classList.remove('hidden');

        const nomeExibicao = currentUser.email.split('@')[0];
        const letra = nomeExibicao.charAt(0).toUpperCase();
        document.getElementById('topbar-user-name').textContent = 'Admin';
        document.getElementById('sidebar-user-name').textContent = 'Admin';
        document.getElementById('topbar-avatar-letter').textContent = letra;
        document.getElementById('sidebar-avatar-letter').textContent = letra;

        carregarCategorias();
        carregarNoticiasAdmin();
        carregarContadoresDashboard();
    } else {
        panelSection.classList.add('hidden');
        authSection.classList.remove('hidden');
    }
};

supabase.auth.getSession().then(({ data: { session } }) => atualizarInterfaceAuth(session));
supabase.auth.onAuthStateChange((_event, session) => atualizarInterfaceAuth(session));

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlert.classList.add('hidden');

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const btnLogin = document.getElementById('btn-login');

    try {
        btnLogin.disabled = true;
        btnLogin.textContent = 'Autenticando...';
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        loginForm.reset();
    } catch (error) {
        loginAlert.textContent = 'Credenciais inválidas. Verifique seu e-mail e senha.';
        loginAlert.classList.remove('hidden');
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar no Sistema';
    }
});

btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// ============================================================================
// 5. FUNCIONALIDADES DO FORMULÁRIO DE POSTAGENS (PRINT 2)
// ============================================================================

// 5.1 Botão "Verificar" Título (Verifica duplicidade e preenche campos SEO)
btnVerifyTitle.addEventListener('click', async () => {
    const titulo = postTitleInput.value.trim();
    if (!titulo) {
        alert('Digite um título primeiro para verificar.');
        postTitleInput.focus();
        return;
    }

    // Preenche automaticamente Título SEO se estiver vazio
    if (!postSeoTitleInput.value.trim()) {
        postSeoTitleInput.value = titulo;
    }

    // Gera sugestões de palavras-chave a partir do título se estiver vazio
    if (!postKeywordsInput.value.trim()) {
        const palavras = titulo
            .toLowerCase()
            .replace(/[^\w\sà-ú]/gi, '')
            .split(/\s+/)
            .filter((p) => p.length > 3)
            .slice(0, 6);
        postKeywordsInput.value = palavras.join(', ');
    }

    const { data } = await supabase
        .from('noticias')
        .select('id, titulo')
        .ilike('titulo', titulo);

    const duplicado = (data || []).find((item) => item.id !== postEditId.value);
    if (duplicado) {
        alert('Atenção: Já existe uma postagem cadastrada com este mesmo título!');
    } else {
        alert('Título verificado e disponível! Campos de SEO preenchidos.');
    }
});

// 5.2 Botões "Selecionar" Arquivo de Imagem e Galeria
btnSelectImage.addEventListener('click', () => postImageFile.click());
btnSelectGallery.addEventListener('click', () => postGalleryFiles.click());

postImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    postImageFilename.value = file ? file.name : 'Nenhum arquivo selecionado';
    postCoverPreview.innerHTML = '';
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            postCoverPreview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

postGalleryFiles.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    postGalleryFilename.value = files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : 'Nenhum arquivo selecionado';
    postGalleryPreview.innerHTML = '';
    files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.createElement('img');
            img.src = ev.target.result;
            postGalleryPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// 5.3 Checkbox "Desabilitar WYSIWYG"
toggleWysiwygCheckbox.addEventListener('change', () => {
    if (toggleWysiwygCheckbox.checked) {
        postRawHtmlTextarea.value = quill.root.innerHTML;
        editorVisualWrapper.classList.add('hidden');
        postRawHtmlTextarea.classList.remove('hidden');
    } else {
        quill.root.innerHTML = postRawHtmlTextarea.value;
        postRawHtmlTextarea.classList.add('hidden');
        editorVisualWrapper.classList.remove('hidden');
    }
});

// 5.4 Compressão Real de Imagem via Canvas antes do Upload
const comprimirImagemCanvas = (file, percentualStr) => {
    return new Promise((resolve) => {
        const qualidade = Math.min(1, Math.max(0.3, parseInt(percentualStr, 10) / 100));
        if (qualidade >= 1 || !file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 1600;
            let { width, height } = img;

            if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                        type: 'image/jpeg'
                    });
                    resolve(compressedFile);
                },
                'image/jpeg',
                qualidade
            );
        };

        img.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
};

const sanitizarNomeFicheiro = (nome) => nome.replace(/[^a-zA-Z0-9._-]/g, '_');

const fazerUploadStorage = async (file, subpasta, compressao = '75%') => {
    const arquivoFinal = await comprimirImagemCanvas(file, compressao);
    const nomeUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizarNomeFicheiro(arquivoFinal.name)}`;
    const filePath = `${subpasta}/${nomeUnico}`;

    const { error } = await supabase.storage
        .from('noticias')
        .upload(filePath, arquivoFinal, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from('noticias').getPublicUrl(filePath);
    return data.publicUrl;
};

const exibirAlertaPostagem = (msg, tipo = 'success') => {
    postFeedback.textContent = msg;
    postFeedback.className = `cms-alert ${tipo === 'error' ? 'cms-alert-error' : 'cms-alert-success'}`;
    postFeedback.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 5.5 Salvar / Atualizar Postagem no Supabase
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    postFeedback.classList.add('hidden');

    const editId = postEditId.value;
    const dataPublicacao = postDateInput.value.trim() || obterDataHojeBR();
    const titulo = postTitleInput.value.trim();
    const tituloSeo = postSeoTitleInput.value.trim() || titulo;
    const descricaoSeo = postSeoDescInput.value.trim();
    const palavrasChave = postKeywordsInput.value.trim();
    const categoria = postCategorySelect.value || 'Saúde Animal';
    const compressao = postCompressionSelect.value || '75%';
    const legendaImagem = postImageCaption.value.trim();

    const corpoHtml = toggleWysiwygCheckbox.checked
        ? postRawHtmlTextarea.value.trim()
        : quill.root.innerHTML;

    const coverFile = postImageFile.files[0];
    const galleryFiles = Array.from(postGalleryFiles.files);

    if (!titulo) {
        exibirAlertaPostagem('Preencha o título da postagem.', 'error');
        return;
    }

    if (!coverFile && !capaUrlExistente) {
        exibirAlertaPostagem('Selecione uma imagem principal para a postagem.', 'error');
        return;
    }

    try {
        btnPostSave.disabled = true;
        progressBox.classList.remove('hidden');
        progressBar.style.width = '20%';
        statusText.textContent = 'Processando e enviando imagem...';

        let capaUrlFinal = capaUrlExistente;
        if (coverFile) {
            capaUrlFinal = await fazerUploadStorage(coverFile, 'capas', compressao);
        }
        progressBar.style.width = '55%';

        let galeriaFinal = [...galeriaUrlsExistentes];
        if (galleryFiles.length > 0) {
            statusText.textContent = `Enviando ${galleryFiles.length} foto(s) da galeria...`;
            const novasUrls = await Promise.all(
                galleryFiles.map((f) => fazerUploadStorage(f, 'galerias', compressao))
            );
            galeriaFinal = [...galeriaFinal, ...novasUrls];
        }
        progressBar.style.width = '85%';

        statusText.textContent = 'Salvando postagem no banco de dados...';

        // Usa a Descrição SEO como subtítulo / linha fina nos cards públicos
        const subtituloCard = descricaoSeo || quill.getText().trim().substring(0, 150);

        const dadosPostagem = {
            data_publicacao: dataPublicacao,
            titulo,
            subtitulo: subtituloCard,
            titulo_seo: tituloSeo,
            descricao_seo: descricaoSeo,
            palavras_chave: palavrasChave,
            categoria,
            compressao_imagem: compressao,
            capa_url: capaUrlFinal,
            legenda_imagem: legendaImagem,
            galeria_urls: galeriaFinal,
            corpo: corpoHtml,
            publicado: true,
            autor_email: currentUser?.email || 'admin'
        };

        if (editId) {
            const { error } = await supabase.from('noticias').update(dadosPostagem).eq('id', editId);
            if (error) throw error;
            exibirAlertaPostagem('Postagem atualizada com sucesso!');
        } else {
            const { error } = await supabase.from('noticias').insert([dadosPostagem]);
            if (error) throw error;
            exibirAlertaPostagem('Postagem criada e publicada com sucesso!');
        }

        progressBar.style.width = '100%';
        await carregarNoticiasAdmin();
        await carregarContadoresDashboard();

        setTimeout(() => {
            window.switchCmsView('noticias');
        }, 1000);

    } catch (error) {
        console.error('Erro ao salvar postagem:', error);
        exibirAlertaPostagem(`Erro ao salvar: ${error.message}`, 'error');
    } finally {
        btnPostSave.disabled = false;
        setTimeout(() => {
            progressBox.classList.add('hidden');
            progressBar.style.width = '0%';
        }, 1200);
    }
});

// ============================================================================
// 6. LISTAGEM DE NOTÍCIAS E DASHBOARD HOME
// ============================================================================
async function carregarContadoresDashboard() {
    try {
        const [resNot, resCat, resAds, resNews] = await Promise.all([
            supabase.from('noticias').select('id', { count: 'exact', head: true }),
            supabase.from('categorias').select('id', { count: 'exact', head: true }),
            supabase.from('anuncios').select('id', { count: 'exact', head: true }),
            supabase.from('newsletter').select('id', { count: 'exact', head: true })
        ]);

        document.getElementById('stat-total-noticias').textContent = resNot.count ?? todasAsNoticias.length;
        document.getElementById('stat-total-categorias').textContent = resCat.count ?? todasAsCategorias.length;
        document.getElementById('stat-total-anuncios').textContent = resAds.count ?? 0;
        document.getElementById('stat-total-newsletter').textContent = resNews.count ?? 0;
    } catch (e) {
        console.warn('Contadores parciais:', e);
    }
}

async function carregarNoticiasAdmin() {
    try {
        const { data: noticias, error } = await supabase
            .from('noticias')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        todasAsNoticias = noticias || [];
        document.getElementById('stat-total-noticias').textContent = todasAsNoticias.length;
        renderizarTabelasNoticias();
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
    }
}

function criarLinhaNoticiaHtml(noticia) {
    const dataExibicao = noticia.data_publicacao || (noticia.criado_em
        ? new Intl.DateTimeFormat('pt-BR').format(new Date(noticia.criado_em))
        : 'Recente');

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <img src="${noticia.capa_url}" alt="Capa" class="cms-thumb-sm">
        </td>
        <td>
            <strong style="color: #333; display: block;">${noticia.titulo}</strong>
            <span style="font-size: 11px; color: #888;">${noticia.titulo_seo || noticia.subtitulo || ''}</span>
        </td>
        <td>
            <span class="badge-category">${noticia.categoria || 'Geral'}</span>
        </td>
        <td style="white-space: nowrap; color: #666;">${dataExibicao}</td>
        <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="cms-btn-cyan btn-edit-post" style="height:28px; padding:0 10px; font-size:12px; border-radius:3px; margin-right:4px;" title="Editar">
                <i class="fas fa-pen"></i>
            </button>
            <a href="materia.html?id=${noticia.id}" target="_blank" class="cms-btn-blue" style="display:inline-flex; align-items:center; height:28px; padding:0 10px; font-size:12px; border-radius:3px; margin-right:4px; text-decoration:none;" title="Visualizar">
                <i class="fas fa-eye"></i>
            </a>
            <button type="button" class="cms-btn-red btn-del-post" style="height:28px; padding:0 10px; font-size:12px; border-radius:3px;" title="Excluir">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;

    tr.querySelector('.btn-edit-post').addEventListener('click', () => window.openEditPostForm(noticia.id));
    tr.querySelector('.btn-del-post').addEventListener('click', async () => {
        if (confirm(`Deseja realmente excluir a postagem "${noticia.titulo}"?`)) {
            await supabase.from('noticias').delete().eq('id', noticia.id);
            carregarNoticiasAdmin();
        }
    });

    return tr;
}

function renderizarTabelasNoticias() {
    const adminTableBody = document.getElementById('admin-table-body');
    const homeRecentBody = document.getElementById('home-recent-posts-tbody');
    const termo = (document.getElementById('list-search-input')?.value || '').toLowerCase().trim();
    const catFiltro = document.getElementById('list-category-filter')?.value || 'all';

    // Tabela da Home (5 mais recentes)
    if (homeRecentBody) {
        homeRecentBody.innerHTML = '';
        const recentes = todasAsNoticias.slice(0, 6);
        if (recentes.length === 0) {
            homeRecentBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Nenhuma postagem cadastrada.</td></tr>';
        } else {
            recentes.forEach((n) => homeRecentBody.appendChild(criarLinhaNoticiaHtml(n)));
        }
    }

    // Tabela completa da aba Notícias
    if (adminTableBody) {
        const filtradas = todasAsNoticias.filter((n) => {
            const matchTitulo = !termo || n.titulo.toLowerCase().includes(termo);
            const matchCat = catFiltro === 'all' || n.categoria === catFiltro;
            return matchTitulo && matchCat;
        });

        adminTableBody.innerHTML = '';
        if (filtradas.length === 0) {
            adminTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px; color:#888;">Nenhuma notícia encontrada.</td></tr>';
        } else {
            filtradas.forEach((n) => adminTableBody.appendChild(criarLinhaNoticiaHtml(n)));
        }
    }
}

document.getElementById('list-search-input')?.addEventListener('input', renderizarTabelasNoticias);
document.getElementById('list-category-filter')?.addEventListener('change', renderizarTabelasNoticias);

// ============================================================================
// 7. CATEGORIAS
// ============================================================================
const gerarSlug = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function carregarCategorias() {
    try {
        const { data, error } = await supabase.from('categorias').select('*').order('nome', { ascending: true });
        if (error) throw error;
        todasAsCategorias = data || [];
    } catch {
        todasAsCategorias = [
            { id: '1', nome: 'Saúde Animal', slug: 'saude-animal' },
            { id: '2', nome: 'Resgates', slug: 'resgates' },
            { id: '3', nome: 'Projetos de Lei', slug: 'projetos-de-lei' },
            { id: '4', nome: 'Agricultura', slug: 'agricultura' }
        ];
    }

    document.getElementById('stat-total-categorias').textContent = todasAsCategorias.length;

    // Popula selects
    const selects = [postCategorySelect, document.getElementById('rss-category')];
    selects.forEach((sel) => {
        if (!sel) return;
        sel.innerHTML = '';
        todasAsCategorias.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.nome;
            opt.textContent = c.nome;
            sel.appendChild(opt);
        });
    });

    const filterSel = document.getElementById('list-category-filter');
    if (filterSel) {
        filterSel.innerHTML = '<option value="all">Todas as Categorias</option>';
        todasAsCategorias.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.nome;
            opt.textContent = c.nome;
            filterSel.appendChild(opt);
        });
    }

    // Popula tabela de categorias
    const tbody = document.getElementById('categories-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        todasAsCategorias.forEach((c) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.nome}</strong></td>
                <td><code>${c.slug}</code></td>
                <td style="text-align:right;">
                    <button type="button" class="cms-btn-red" style="height:26px; padding:0 10px; font-size:11px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tr.querySelector('button').addEventListener('click', async () => {
                if (confirm(`Excluir a categoria "${c.nome}"?`)) {
                    await supabase.from('categorias').delete().eq('id', c.id);
                    carregarCategorias();
                }
            });
            tbody.appendChild(tr);
        });
    }
}

document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('category-name').value.trim();
    if (!nome) return;

    const { error } = await supabase.from('categorias').insert([{ nome, slug: gerarSlug(nome) }]);
    if (error) {
        alert(`Erro: ${error.message}`);
    } else {
        document.getElementById('category-form').reset();
        carregarCategorias();
    }
});

// ============================================================================
// 8. DEMAIS MENUS LATERAIS (RSS, ANÚNCIOS, IMAGENS, REDES, TEXTOS, NEWSLETTER, USUÁRIOS)
// ============================================================================

// 8.1 Importação RSS
async function carregarRssFeeds() {
    const tbody = document.getElementById('rss-table-body');
    if (!tbody) return;
    const { data } = await supabase.from('rss_feeds').select('*').order('criado_em', { ascending: false });
    tbody.innerHTML = '';
    (data || []).forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.nome}</strong></td>
            <td><a href="${item.url}" target="_blank" style="color:#2196f3;">${item.url}</a></td>
            <td>${item.categoria}</td>
            <td style="text-align:right;">
                <button type="button" class="cms-btn-red" style="height:26px; padding:0 10px;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tr.querySelector('button').addEventListener('click', async () => {
            await supabase.from('rss_feeds').delete().eq('id', item.id);
            carregarRssFeeds();
        });
        tbody.appendChild(tr);
    });
}

document.getElementById('rss-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('rss-name').value.trim();
    const url = document.getElementById('rss-url').value.trim();
    const categoria = document.getElementById('rss-category').value || 'Saúde Animal';
    await supabase.from('rss_feeds').insert([{ nome, url, categoria }]);
    e.target.reset();
    carregarRssFeeds();
});

// 8.2 Anúncios
async function carregarAnuncios() {
    const tbody = document.getElementById('ads-table-body');
    if (!tbody) return;
    const { data } = await supabase.from('anuncios').select('*').order('criado_em', { ascending: false });
    tbody.innerHTML = '';
    (data || []).forEach((ad) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${ad.imagem_url}" class="cms-thumb-sm" alt="${ad.titulo}"></td>
            <td><strong>${ad.titulo}</strong></td>
            <td>${ad.posicao}</td>
            <td style="text-align:right;">
                <button type="button" class="cms-btn-red" style="height:26px; padding:0 10px;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tr.querySelector('button').addEventListener('click', async () => {
            await supabase.from('anuncios').delete().eq('id', ad.id);
            carregarAnuncios();
            carregarContadoresDashboard();
        });
        tbody.appendChild(tr);
    });
}

document.getElementById('ad-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('ad-title').value.trim();
    const posicao = document.getElementById('ad-position').value;
    const link_url = document.getElementById('ad-link').value.trim();
    const file = document.getElementById('ad-image-file').files[0];
    if (!file) return;

    const btn = document.getElementById('btn-save-ad');
    btn.disabled = true;
    try {
        const imagem_url = await fazerUploadStorage(file, 'anuncios', '85%');
        await supabase.from('anuncios').insert([{ titulo, posicao, link_url, imagem_url }]);
        e.target.reset();
        carregarAnuncios();
        carregarContadoresDashboard();
    } finally {
        btn.disabled = false;
    }
});

// 8.3 Biblioteca de Imagens
async function carregarGaleriaStorage() {
    const grid = document.getElementById('media-gallery-grid');
    if (!grid) return;
    grid.innerHTML = '<p style="color:#777;">Carregando imagens...</p>';

    const { data: arquivos } = await supabase.storage.from('noticias').list('capas', { limit: 60 });
    grid.innerHTML = '';

    (arquivos || []).forEach((arq) => {
        if (arq.name === '.emptyFolderPlaceholder') return;
        const { data } = supabase.storage.from('noticias').getPublicUrl(`capas/${arq.name}`);
        const card = document.createElement('div');
        card.className = 'cms-media-card';
        card.innerHTML = `
            <img src="${data.publicUrl}" alt="${arq.name}" loading="lazy">
            <div class="cms-media-card-actions">
                <button type="button" class="cms-btn-cyan" style="height:26px; padding:0 8px; font-size:11px; flex:1;">Copiar URL</button>
            </div>
        `;
        card.querySelector('button').addEventListener('click', () => {
            navigator.clipboard.writeText(data.publicUrl);
            alert('URL da imagem copiada!');
        });
        grid.appendChild(card);
    });
}

document.getElementById('btn-upload-media')?.addEventListener('click', () => {
    document.getElementById('media-upload-input').click();
});

document.getElementById('media-upload-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await fazerUploadStorage(file, 'capas', '85%');
    carregarGaleriaStorage();
});

// 8.4 Redes Sociais e Textos/Contatos
async function carregarConfiguracoes() {
    const { data } = await supabase.from('configuracoes').select('*');
    const mapa = {};
    (data || []).forEach((row) => { mapa[row.chave] = row.valor; });

    if (document.getElementById('cfg-instagram')) document.getElementById('cfg-instagram').value = mapa.instagram || '';
    if (document.getElementById('cfg-facebook')) document.getElementById('cfg-facebook').value = mapa.facebook || '';
    if (document.getElementById('cfg-youtube')) document.getElementById('cfg-youtube').value = mapa.youtube || '';
    if (document.getElementById('cfg-whatsapp')) document.getElementById('cfg-whatsapp').value = mapa.whatsapp || '';
    if (document.getElementById('cfg-email')) document.getElementById('cfg-email').value = mapa.email_contato || '';
    if (document.getElementById('cfg-phone')) document.getElementById('cfg-phone').value = mapa.telefone_contato || '';
    if (document.getElementById('cfg-institutional')) document.getElementById('cfg-institutional').value = mapa.texto_institucional || '';
}

const salvarChavesConfig = async (pares, alertId) => {
    for (const [chave, valor] of Object.entries(pares)) {
        await supabase.from('configuracoes').upsert({ chave, valor, atualizado_em: new Date().toISOString() });
    }
    const el = document.getElementById(alertId);
    if (el) {
        el.textContent = 'Configurações salvas com sucesso!';
        el.className = 'cms-alert cms-alert-success';
        el.classList.remove('hidden');
    }
};

document.getElementById('social-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarChavesConfig({
        instagram: document.getElementById('cfg-instagram').value.trim(),
        facebook: document.getElementById('cfg-facebook').value.trim(),
        youtube: document.getElementById('cfg-youtube').value.trim(),
        whatsapp: document.getElementById('cfg-whatsapp').value.trim()
    }, 'social-feedback');
});

document.getElementById('texts-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarChavesConfig({
        email_contato: document.getElementById('cfg-email').value.trim(),
        telefone_contato: document.getElementById('cfg-phone').value.trim(),
        texto_institucional: document.getElementById('cfg-institutional').value.trim()
    }, 'texts-feedback');
});

// 8.5 Newsletter
let listaNewsletterCache = [];
async function carregarNewsletter() {
    const tbody = document.getElementById('newsletter-table-body');
    if (!tbody) return;
    const { data } = await supabase.from('newsletter').select('*').order('criado_em', { ascending: false });
    listaNewsletterCache = data || [];
    tbody.innerHTML = '';

    if (listaNewsletterCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:18px; color:#888;">Nenhum inscrito até o momento.</td></tr>';
        return;
    }

    listaNewsletterCache.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.email}</strong></td>
            <td>${new Intl.DateTimeFormat('pt-BR').format(new Date(item.criado_em))}</td>
            <td style="text-align:right;">
                <button type="button" class="cms-btn-red" style="height:26px; padding:0 10px;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tr.querySelector('button').addEventListener('click', async () => {
            await supabase.from('newsletter').delete().eq('id', item.id);
            carregarNewsletter();
        });
        tbody.appendChild(tr);
    });
}

document.getElementById('btn-export-newsletter')?.addEventListener('click', () => {
    if (listaNewsletterCache.length === 0) {
        alert('Não há e-mails para exportar.');
        return;
    }
    const csv = 'Email,Data\n' + listaNewsletterCache.map((i) => `${i.email},${i.criado_em}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'newsletter_inscritos.csv';
    link.click();
});

// 8.6 Usuários
async function carregarUsuarios() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    const { data } = await supabase.from('usuarios_admin').select('*').order('criado_em', { ascending: false });
    tbody.innerHTML = '';

    const lista = data || [];
    if (lista.length === 0 && currentUser) {
        lista.push({ id: 'atual', nome: 'Admin Principal', email: currentUser.email, cargo: 'Administrador' });
    }

    lista.forEach((u) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${u.nome}</strong></td>
            <td>${u.email}</td>
            <td>${u.cargo}</td>
            <td style="text-align:right;">
                ${u.id !== 'atual' ? `<button type="button" class="cms-btn-red" style="height:26px; padding:0 10px;"><i class="fas fa-trash"></i></button>` : '-'}
            </td>
        `;
        tr.querySelector('button')?.addEventListener('click', async () => {
            await supabase.from('usuarios_admin').delete().eq('id', u.id);
            carregarUsuarios();
        });
        tbody.appendChild(tr);
    });
}

document.getElementById('user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('user-new-name').value.trim();
    const email = document.getElementById('user-new-email').value.trim();
    const cargo = document.getElementById('user-new-role').value;

    const { error } = await supabase.from('usuarios_admin').insert([{ nome, email, cargo }]);
    if (error) {
        alert(`Erro: ${error.message}`);
    } else {
        e.target.reset();
        carregarUsuarios();
    }
});
