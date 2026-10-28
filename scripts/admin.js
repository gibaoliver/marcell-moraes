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

// Referências do DOM
const authSection = document.getElementById('auth-section');
const panelSection = document.getElementById('panel-section');
const loginForm = document.getElementById('admin-login-form');
const loginAlert = document.getElementById('login-alert');
const userEmailSpan = document.getElementById('admin-user-email');
const btnLogout = document.getElementById('btn-logout');

const newsForm = document.getElementById('news-form');
const coverInput = document.getElementById('news-cover');
const galleryInput = document.getElementById('news-gallery');
const coverPreview = document.getElementById('cover-preview');
const galleryPreview = document.getElementById('gallery-preview');

const progressBox = document.getElementById('upload-progress-box');
const progressBar = document.getElementById('upload-progress-bar');
const statusText = document.getElementById('upload-status-text');
const formFeedback = document.getElementById('form-feedback');
const btnPublish = document.getElementById('btn-publish');
const adminNewsList = document.getElementById('admin-news-list');

let currentUser = null;

// ============================================================================
// 2. AUTENTICAÇÃO (SUPABASE AUTH)
// ============================================================================
const atualizarInterfaceAuth = (session) => {
    currentUser = session?.user || null;
    if (currentUser) {
        authSection.classList.add('hidden');
        panelSection.classList.remove('hidden');
        userEmailSpan.textContent = currentUser.email;
        carregarListaAdmin();
    } else {
        panelSection.classList.add('hidden');
        authSection.classList.remove('hidden');
        userEmailSpan.textContent = '';
    }
};

// Verifica sessão ativa ao carregar a página e escuta alterações
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
        loginAlert.textContent = 'E-mail ou palavra-passe incorretos. Verifique o seu utilizador no Supabase Auth.';
        loginAlert.classList.remove('hidden');
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar no Painel';
    }
});

btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// ============================================================================
// 3. PRÉ-VISUALIZAÇÃO DE IMAGENS NO FORMULÁRIO
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

// ============================================================================
// 4. UPLOAD PARA O SUPABASE STORAGE E REGISTO NA TABELA 'noticias'
// ============================================================================
const sanitizarNomeFicheiro = (nome) => nome.replace(/[^a-zA-Z0-9._-]/g, '_');

const fazerUploadImagem = async (file, subpasta) => {
    const nomeUnico = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizarNomeFicheiro(file.name)}`;
    const filePath = `${subpasta}/${nomeUnico}`;

    const { error: uploadError } = await supabase.storage
        .from('noticias')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('noticias')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

const exibirMensagem = (texto, tipo = 'success') => {
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
    const corpoHtml = quill.root.innerHTML;
    const textoPuro = quill.getText().trim();
    const coverFile = coverInput.files[0];
    const galleryFiles = Array.from(galleryInput.files);

    if (!textoPuro) {
        exibirMensagem('Por favor, preencha o corpo da notícia.', 'error');
        return;
    }

    if (!coverFile) {
        exibirMensagem('Por favor, selecione uma foto de capa.', 'error');
        return;
    }

    try {
        btnPublish.disabled = true;
        progressBox.classList.remove('hidden');
        progressBar.style.width = '15%';
        statusText.textContent = 'A enviar foto de capa para o Supabase Storage...';

        // 1. Upload da Foto de Capa
        const capaUrl = await fazerUploadImagem(coverFile, 'capas');
        progressBar.style.width = '45%';

        // 2. Upload Múltiplo da Galeria de Fotos (se existirem)
        let galeriaUrls = [];
        if (galleryFiles.length > 0) {
            statusText.textContent = `A enviar ${galleryFiles.length} foto(s) da galeria...`;
            galeriaUrls = await Promise.all(
                galleryFiles.map((file) => fazerUploadImagem(file, 'galerias'))
            );
        }
        progressBar.style.width = '85%';

        // 3. Guardar registo na tabela 'noticias' do Supabase
        statusText.textContent = 'A guardar notícia na base de dados...';
        const { error: dbError } = await supabase
            .from('noticias')
            .insert([
                {
                    titulo,
                    subtitulo,
                    corpo: corpoHtml,
                    capa_url: capaUrl,
                    galeria_urls: galeriaUrls,
                    publicado: true,
                    autor_email: currentUser?.email || 'admin'
                }
            ]);

        if (dbError) throw dbError;

        progressBar.style.width = '100%';
        exibirMensagem('Notícia publicada com sucesso!', 'success');

        // Limpar formulário e estado
        newsForm.reset();
        quill.setContents([]);
        coverPreview.innerHTML = '';
        galleryPreview.innerHTML = '';
        await carregarListaAdmin();

    } catch (error) {
        console.error('Erro ao publicar notícia:', error);
        exibirMensagem(`Erro ao publicar: ${error.message}`, 'error');
    } finally {
        btnPublish.disabled = false;
        setTimeout(() => {
            progressBox.classList.add('hidden');
            progressBar.style.width = '0%';
        }, 1200);
    }
});

// ============================================================================
// 5. LISTAGEM E REMOÇÃO DE NOTÍCIAS NO PAINEL
// ============================================================================
async function carregarListaAdmin() {
    try {
        const { data: noticias, error } = await supabase
            .from('noticias')
            .select('id, titulo, capa_url, criado_em')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        if (!noticias || noticias.length === 0) {
            adminNewsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Nenhuma matéria publicada até ao momento.</p>';
            return;
        }

        adminNewsList.innerHTML = '';
        noticias.forEach((noticia) => {
            const dataFormatada = noticia.criado_em
                ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(noticia.criado_em))
                : 'Recente';

            const item = document.createElement('div');
            item.className = 'admin-news-item';
            item.innerHTML = `
                <div class="admin-news-info">
                    <img src="${noticia.capa_url}" alt="Capa">
                    <div>
                        <strong style="display: block; color: var(--primary); font-size: 0.95rem;">${noticia.titulo}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${dataFormatada}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <a href="materia.html?id=${noticia.id}" target="_blank" class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
                        Abrir
                    </a>
                    <button type="button" class="btn-danger-sm" data-id="${noticia.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            `;

            item.querySelector('.btn-danger-sm').addEventListener('click', async () => {
                if (confirm(`Tem a certeza que deseja eliminar a notícia "${noticia.titulo}"?`)) {
                    const { error: delError } = await supabase
                        .from('noticias')
                        .delete()
                        .eq('id', noticia.id);

                    if (delError) {
                        alert(`Erro ao excluir: ${delError.message}`);
                    } else {
                        carregarListaAdmin();
                    }
                }
            });

            adminNewsList.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar lista no admin:', error);
        adminNewsList.innerHTML = `<p style="color: #b91c1c; font-size: 0.9rem;">Execute o script SQL no Supabase SQL Editor para criar a tabela <code>noticias</code>.</p>`;
    }
}
