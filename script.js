// ============================================================
//  STATE
// ============================================================
let currentAnimeId = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let currentGenre = 'all';
let currentSources = [];
let currentSourceIndex = 0;

// ============================================================
//  PAGINATION
// ============================================================
let currentPage = 1;
const itemsPerPage = 24;
let totalPages = 1;

// ============================================================
//  LOAD DAFTAR ANIME (OTOMATIS DARI JSON)
// ============================================================
async function loadAnimeList(genre = 'all', page = 1) {
    const grid = document.getElementById('animeGrid');
    if (!grid) return;
    grid.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    try {
        const response = await fetch('anime-list.json');
        if (!response.ok) throw new Error('File anime-list.json tidak ditemukan!');

        const data = await response.json();
        let animeList = data.anime || [];

        // Filter genre
        if (genre !== 'all') {
            animeList = animeList.filter(anime => {
                const genres = anime.genre.toLowerCase().split(', ');
                return genres.some(g => g.includes(genre.toLowerCase()));
            });
        }

        // Pagination
        totalPages = Math.ceil(animeList.length / itemsPerPage) || 1;
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;
        currentPage = page;

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = animeList.slice(start, end);

        if (pageItems.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-frown"></i><p>Tidak ada anime.</p></div>`;
            updatePaginationButtons();
            return;
        }

        grid.innerHTML = pageItems.map(anime => `
            <div class="anime-card" onclick="location.href='${anime.id}/info.html'">
                <img src="${anime.image}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
                <div class="info">
                    <h3>${anime.title}</h3>
                    <p>${anime.genre || 'Anime'}</p>
                </div>
            </div>
        `).join('');

        updatePaginationButtons();
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${error.message}</p></div>`;
    }
}

// ============================================================
//  PAGINATION
// ============================================================
function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage < 1 || newPage > totalPages) return;
    loadAnimeList(currentGenre, newPage);
}

function updatePaginationButtons() {
    const prev = document.getElementById('prevPageBtn');
    const next = document.getElementById('nextPageBtn');
    const info = document.getElementById('pageInfo');
    if (prev) prev.disabled = (currentPage <= 1);
    if (next) next.disabled = (currentPage >= totalPages);
    if (info) info.textContent = `Halaman ${currentPage} dari ${totalPages}`;
}

// ============================================================
//  FILTER & SEARCH
// ============================================================
function filterByGenre(genre) {
    currentGenre = genre;
    document.querySelectorAll('.genre-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.genre === genre);
    });
    loadAnimeList(genre, 1);
}

function goHome() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-home').classList.add('active');
    loadAnimeList(currentGenre, 1);
}

async function searchAnime() {
    const query = document.getElementById('searchInput')?.value.trim().toLowerCase();
    const grid = document.getElementById('animeGrid');
    if (!query || !grid) { loadAnimeList(currentGenre, 1); return; }

    try {
        const res = await fetch('anime-list.json');
        const data = await res.json();
        let results = data.anime.filter(a => a.title.toLowerCase().includes(query));
        if (currentGenre !== 'all') {
            results = results.filter(a => {
                const g = a.genre.toLowerCase().split(', ');
                return g.some(x => x.includes(currentGenre.toLowerCase()));
            });
        }
        if (results.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>Tidak ada hasil untuk "${query}"</p></div>`;
            return;
        }
        grid.innerHTML = results.map(anime => `
            <div class="anime-card" onclick="location.href='${anime.id}/info.html'">
                <img src="${anime.image}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
                <div class="info">
                    <h3>${anime.title}</h3>
                    <p>${anime.genre || 'Anime'}</p>
                </div>
            </div>
        `).join('');
        document.querySelector('.pagination').style.display = 'none';
    } catch (err) { console.error(err); }
}

// ============================================================
//  INISIALISASI
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadAnimeList('all', 1);
    document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchAnime();
    });
    document.querySelector('.pagination').style.display = 'flex';
});

console.log('🚀 Anime siap!');
console.log('📌 Data anime dari anime-list.json');
