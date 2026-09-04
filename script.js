// ============================================================
//  STATE
// ============================================================
let currentGenre = 'all';
let currentPage = 1;
const itemsPerPage = 24;
let totalPages = 1;
let allAnimeItems = []; // akan diisi dari kartu anime yang ada di halaman

// ============================================================
//  INIT - AMBIL DATA DARI HTML
// ============================================================
function initAnimeList() {
    const grid = document.getElementById('animeGrid');
    const cards = grid.querySelectorAll('.anime-card');
    allAnimeItems = Array.from(cards).map(card => {
        const title = card.querySelector('.info h3')?.textContent || '';
        const genre = card.querySelector('.info p')?.textContent || '';
        const onclickAttr = card.getAttribute('onclick') || '';
        const match = onclickAttr.match(/location\.href='([^']+)'/);
        const link = match ? match[1] : '';
        return { card, title, genre, link };
    });
    // Simpan data asli untuk filter
    window.__allAnime = allAnimeItems;
    updatePaginationButtons();
}

// ============================================================
//  LOAD / FILTER ANIME
// ============================================================
function loadAnimeList(genre = 'all', page = 1) {
    const grid = document.getElementById('animeGrid');
    let filtered = allAnimeItems;

    if (genre !== 'all') {
        filtered = allAnimeItems.filter(item => {
            const genres = item.genre.toLowerCase().split(', ');
            return genres.some(g => g.includes(genre.toLowerCase()));
        });
    }

    totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    currentPage = page;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filtered.slice(start, end);

    // Sembunyikan semua kartu, lalu tampilkan yang sesuai
    allAnimeItems.forEach(item => {
        item.card.style.display = 'none';
    });
    pageItems.forEach(item => {
        item.card.style.display = 'block';
    });

    updatePaginationButtons();
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
//  FILTER BY GENRE
// ============================================================
function filterByGenre(genre) {
    currentGenre = genre;
    document.querySelectorAll('.genre-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.genre === genre);
    });
    loadAnimeList(genre, 1);
    // Jika di halaman detail/tonton, pindah ke home
    if (document.getElementById('page-detail')?.classList.contains('active') ||
        document.getElementById('page-watch')?.classList.contains('active')) {
        goHome();
    }
}

// ============================================================
//  SEARCH
// ============================================================
function searchAnime() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const grid = document.getElementById('animeGrid');
    if (!query) {
        loadAnimeList(currentGenre, 1);
        return;
    }

    const filtered = allAnimeItems.filter(item =>
        item.title.toLowerCase().includes(query)
    );

    // Tambahkan filter genre juga
    let finalItems = filtered;
    if (currentGenre !== 'all') {
        finalItems = filtered.filter(item => {
            const genres = item.genre.toLowerCase().split(', ');
            return genres.some(g => g.includes(currentGenre.toLowerCase()));
        });
    }

    // Sembunyikan semua
    allAnimeItems.forEach(item => item.card.style.display = 'none');
    finalItems.forEach(item => item.card.style.display = 'block');

    // Update pagination info
    totalPages = Math.ceil(finalItems.length / itemsPerPage) || 1;
    currentPage = 1;
    updatePaginationButtons();
}

// ============================================================
//  NAVIGASI (BACK, HOME, DETAIL)
// ============================================================
function goHome() {
    showPage('page-home');
    loadAnimeList(currentGenre, 1);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    const nav = document.getElementById('mainNav');
    if (nav) nav.style.display = (pageId === 'page-home') ? 'flex' : 'none';
}

// ============================================================
//  INISIALISASI
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initAnimeList();
    loadAnimeList('all', 1);

    document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchAnime();
    });
});

console.log('🚀 Anime siap! (Mode HTML - tanpa JSON)');
console.log('📌 Data anime diambil dari kartu HTML secara langsung.');
