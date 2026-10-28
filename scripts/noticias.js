// scripts/noticias.js
import { supabase } from './supabase-config.js';

const noticiasContainer = document.getElementById('noticias-container');

/**
 * Formata a string ISO do Supabase (timestamptz) para data legível em português
 */
const formatarData = (isoString) => {
    if (!isoString) return 'Publicação recente';
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date(isoString));
};

/**
 * Escapa caracteres HTML para evitar XSS em textos simples (título/subtítulo)
 */
const escaparHtml = (texto = '') => {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
};

/**
 * Busca as notícias publicadas na tabela 'noticias' ordenadas da mais recente para a mais antiga
 */
async function carregarNoticias() {
    try {
        const { data: noticias, error } = await supabase
            .from('noticias')
            .select('id, titulo, subtitulo, capa_url, criado_em, publicado')
            .eq('publicado', true)
            .order('criado_em', { ascending: false });

        if (error) throw error;

        if (!noticias || noticias.length === 0) {
            noticiasContainer.innerHTML = `
                <div class="news-status-box">
                    <i class="far fa-newspaper" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 1rem;"></i>
                    <h3>Nenhuma notícia publicada ainda</h3>
                    <p style="color: var(--text-muted); margin-top: 0.5rem;">Em breve partilharemos novidades e ações aqui.</p>
                </div>
            `;
            return;
        }

        let cardsHtml = '';

        noticias.forEach((noticia) => {
            const id = noticia.id;
            const titulo = escaparHtml(noticia.titulo);
            const subtitulo = escaparHtml(noticia.subtitulo || '');
            const capaUrl = noticia.capa_url || 'assets/WhatsApp Image 2026-06-17 at 22.35.48.jpeg';
            const dataPublicacao = formatarData(noticia.criado_em);

            cardsHtml += `
                <article class="news-card">
                    <a href="materia.html?id=${encodeURIComponent(id)}" class="news-card-thumb" aria-label="${titulo}">
                        <img src="${capaUrl}" alt="${titulo}" loading="lazy">
                    </a>
                    <div class="news-card-body">
                        <span class="news-card-date">
                            <i class="far fa-calendar-alt"></i> ${dataPublicacao}
                        </span>
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
