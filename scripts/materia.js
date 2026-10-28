// scripts/materia.js
import { supabase } from './supabase-config.js';

const materiaContainer = document.getElementById('materia-container');
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

/**
 * Formata a string ISO do Supabase para data e hora em português
 */
const formatarDataCompleta = (isoString) => {
    if (!isoString) return 'Publicado recentemente';
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(isoString));
};

const escaparHtml = (texto = '') => {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
};

/**
 * Configura eventos do Lightbox para ampliar imagens da galeria
 */
const inicializarLightbox = () => {
    document.querySelectorAll('.article-gallery-item img').forEach((img) => {
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightboxModal.classList.remove('hidden');
        });
    });

    const fecharModal = () => {
        lightboxModal.classList.add('hidden');
        lightboxImg.src = '';
    };

    lightboxClose?.addEventListener('click', fecharModal);
    lightboxModal?.addEventListener('click', (e) => {
        if (e.target === lightboxModal) fecharModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharModal();
    });
};

/**
 * Lê o parâmetro ?id= da URL, consulta o registo no Supabase e injeta a matéria completa
 */
async function carregarMateria() {
    const params = new URLSearchParams(window.location.search);
    const noticiaId = params.get('id');

    if (!noticiaId) {
        materiaContainer.innerHTML = `
            <div class="news-status-box" style="box-shadow: none;">
                <i class="fas fa-search" style="font-size: 2.2rem; color: var(--accent); margin-bottom: 1rem;"></i>
                <h2>Matéria não especificada</h2>
                <p style="color: var(--text-muted); margin: 0.75rem 0 1.5rem;">Nenhum identificador de notícia foi informado no endereço.</p>
                <a href="noticias.html" class="btn btn-primary">Ver todas as notícias</a>
            </div>
        `;
        return;
    }

    try {
        const { data: dados, error } = await supabase
            .from('noticias')
            .select('*')
            .eq('id', noticiaId)
            .single();

        if (error || !dados) {
            materiaContainer.innerHTML = `
                <div class="news-status-box" style="box-shadow: none;">
                    <i class="far fa-folder-open" style="font-size: 2.2rem; color: var(--accent); margin-bottom: 1rem;"></i>
                    <h2>Matéria não encontrada</h2>
                    <p style="color: var(--text-muted); margin: 0.75rem 0 1.5rem;">A notícia que procura pode ter sido removida ou o endereço está incorreto.</p>
                    <a href="noticias.html" class="btn btn-primary">Voltar para Notícias</a>
                </div>
            `;
            return;
        }

        const titulo = escaparHtml(dados.titulo);
        const subtitulo = escaparHtml(dados.subtitulo || '');
        const dataFormatada = formatarDataCompleta(dados.criado_em);
        const capaUrl = dados.capa_url || '';
        const corpoFormatado = dados.corpo || '';
        const galeria = Array.isArray(dados.galeria_urls) ? dados.galeria_urls : [];

        // Atualiza o título da aba do navegador
        document.title = `${dados.titulo} | Marcell Moraes`;

        // Constrói o HTML da Galeria de Fotos caso existam imagens adicionais
        let galeriaHtml = '';
        if (galeria.length > 0) {
            const itensGaleria = galeria
                .map((url, idx) => `
                    <div class="article-gallery-item">
                        <img src="${url}" alt="${titulo} - Foto ${idx + 1}" loading="lazy">
                    </div>
                `)
                .join('');

            galeriaHtml = `
                <section class="article-gallery-section">
                    <h3><i class="fas fa-camera-retro" style="color: var(--accent);"></i> Galeria de Fotos</h3>
                    <div class="article-gallery-grid">
                        ${itensGaleria}
                    </div>
                </section>
            `;
        }

        // Injeta o conteúdo completo no DOM
        materiaContainer.innerHTML = `
            <header class="article-header">
                <a href="noticias.html" class="article-back-link">
                    <i class="fas fa-arrow-left"></i> Voltar para todas as notícias
                </a>
                <div class="article-meta">
                    <i class="far fa-clock"></i>
                    <span>${dataFormatada}</span>
                </div>
                <h1 class="article-title">${titulo}</h1>
                ${subtitulo ? `<p class="article-subtitle">${subtitulo}</p>` : ''}
            </header>

            ${capaUrl ? `
                <figure class="article-cover-wrapper">
                    <img src="${capaUrl}" alt="${titulo}">
                </figure>
            ` : ''}

            <div class="article-body">
                ${corpoFormatado}
            </div>

            ${galeriaHtml}
        `;

        if (galeria.length > 0) {
            inicializarLightbox();
        }

    } catch (error) {
        console.error('Erro ao carregar matéria do Supabase:', error);
        materiaContainer.innerHTML = `
            <div class="news-status-box" style="box-shadow: none;">
                <i class="fas fa-exclamation-circle" style="font-size: 2.2rem; color: #e53e3e; margin-bottom: 1rem;"></i>
                <h2>Erro ao carregar a matéria</h2>
                <p style="color: var(--text-muted); margin: 0.75rem 0 1.5rem;">Não foi possível comunicar com o servidor de dados.</p>
                <a href="noticias.html" class="btn btn-outline">Voltar para Notícias</a>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', carregarMateria);
