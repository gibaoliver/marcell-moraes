// scripts/noticias.js
import { supabase } from './supabase-config.js';

const noticiasContainer = document.getElementById('noticias-container');
const categoryFilterContainer = document.getElementById('category-filter-container');

let todasAsNoticias = [];
let categoriaAtiva = 'all';

/**
 * Formata a string ISO do Supabase para data legível em português
 */
const formatarData = (isoString) => {
    if (!isoString) return 'Publicação recente';
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date(isoString));
};

const escaparHtml = (texto = '') => {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
};

/**
 * Renderiza os botões/pills de filtro por categoria no topo da página
 */
function renderizarFiltrosCategorias() {
    if (!categoryFilterContainer) return;

    // Coleta categorias únicas presentes nas notícias
    const categoriasSet = new Set();
    todasAsNoticias.forEach((n) => {
        if (n.categoria) categoriasSet.add(n.categoria);
    });

    if (categoriasSet.size === 0) {
        categoryFilterContainer.innerHTML = '';
        return;
    }

    let html = `<button type="button" class="filter-pill ${categoriaAtiva === 'all' ? 'active' : ''}" data-cat="all">Todas</button>`;

    categoriasSet.forEach((cat) => {
        html += `<button type="button" class="filter-pill ${categoriaAtiva === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`;
    });

    categoryFilterContainer.innerHTML = html;

    // Adiciona listeners para os cliques
    categoryFilterContainer.querySelectorAll('.filter-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            categoriaAtiva = btn.getAttribute('data-cat');
            renderizarFiltrosCategorias();
            renderizarCards();
        });
    });
}

/**
 * Renderiza os cards das notícias com base no filtro ativo
 */
function renderizarCards() {
    const noticiasFiltradas = todasAsNoticias.filter((n) => {
        return categoriaAtiva === 'all' || n.categoria === categoriaAtiva;
    });

    if (noticiasFiltradas.length === 0) {
        noticiasContainer.innerHTML = `
            <div class="news-status-box">
                <i class="far fa-folder-open" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 1rem;"></i>
                <h3>Nenhuma notícia nesta categoria</h3>
                <p style="color: var(--text-muted); margin-top: 0.5rem;">Escolha outra categoria acima para ver mais matérias.</p>
            </div>
        `;
        return;
    }

    let cardsHtml = '';
    noticiasFiltradas.forEach((noticia) => {
        const id = noticia.id;
        const titulo = escaparHtml(noticia.titulo);
        const subtitulo = escaparHtml(noticia.subtitulo || '');
        const categoria = escaparHtml(noticia.categoria || 'Geral');
        const capaUrl = noticia.capa_url || 'assets/WhatsApp Image 2026-06-17 at 22.35.48.jpeg';
        const dataPublicacao = formatarData(noticia.criado_em);

        cardsHtml += `
            <article class="news-card">
                <a href="materia.html?id=${encodeURIComponent(id)}" class="news-card-thumb" aria-label="${titulo}">
                    <img src="${capaUrl}" alt="${titulo}" loading="lazy">
                </a>
                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span class="badge-category">${categoria}</span>
                        <span class="news-card-date">
                            <i class="far fa-calendar-alt"></i> ${dataPublicacao}
                        </span>
                    </div>
                    <h2 class="news-card-title">
                        <a href="materia.html?id=${encodeURIComponent(id)}">${titulo}</a>
                    </h2>
                    <p class="news-card-subtitle">${subtitulo}</p>
                    <a href="materia.html?id=${encodeURIComponent(id)}" class="news-card-link">
                        Ler matéria completa <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    });

    noticiasContainer.innerHTML = cardsHtml;
}

/**
 * Busca as notícias publicadas no Supabase
 */
async function carregarNoticias() {
    try {
        const { data: noticias, error } = await supabase
            .from('noticias')
            .select('id, titulo, subtitulo, categoria, capa_url, criado_em, publicado')
            .eq('publicado', true)
            .order('criado_em', { ascending: false });

        if (error) throw error;

        todasAsNoticias = noticias || [];

        if (todasAsNoticias.length === 0) {
            noticiasContainer.innerHTML = `
                <div class="news-status-box">
                    <i class="far fa-newspaper" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 1rem;"></i>
                    <h3>Nenhuma notícia publicada ainda</h3>
                    <p style="color: var(--text-muted); margin-top: 0.5rem;">Em breve partilharemos novidades e ações aqui.</p>
                </div>
            `;
            return;
        }

        renderizarFiltrosCategorias();
        renderizarCards();

    } catch (error) {
        console.error('Erro ao carregar notícias do Supabase:', error);
        noticiasContainer.innerHTML = `
            <div class="news-status-box">
                <i class="fas fa-database" style="font-size: 2.2rem; color: var(--accent); margin-bottom: 0.75rem;"></i>
                <h3>Base de Dados em Configuração</h3>
                <p style="color: var(--text-muted); margin-top: 0.5rem;">
                    Execute o script <code>supabase-setup.sql</code> no SQL Editor do Supabase para ativar a tabela de notícias.
                </p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', carregarNoticias);
