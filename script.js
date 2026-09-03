// ============================================================
//  STATE
// ============================================================
let currentAnimeId = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let currentGenre = 'all'; // ← tambahan state genre

// ============================================================
//  NAVIGASI
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function goHome() {
    showPage('page-home');
    loadAnimeList(currentGenre);
}

// ============================================================
//  LOAD DAFTAR ANIME (DENGAN FILTER GENRE)
// ============================================================
async function loadAnimeList(genre = 'all') {
    const grid = document.getElementById('animeGrid');
    grid.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    try {
        const response = await fetch('anime-list.json');
        if (!response.ok) throw new Error('Gagal load anime list');
        
        const data = await response.json();
        let animeList = data.anime || [];

        // ★ FILTER BERDASARKAN GENRE ★
        if (genre !== 'all') {
            animeList = animeList.filter(anime => {
                const genres = anime.genre.toLowerCase().split(', ');
                return genres.some(g => g.includes(genre.toLowerCase()));
            });
        }

        if (animeList.length === 0) {
            grid.innerHTML = `<div class="empty-state"><p>Tidak ada anime dengan genre ini.</p></div>`;
            return;
        }

        grid.innerHTML = animeList.map(anime => `
            <div class="anime-card" onclick="openDetail('${anime.id}')">
                <img src="${anime.image}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/300x400/1a1a2e/7a849b?text=No+Image'">
                <div class="info">
                    <h3>${anime.title}</h3>
                    <p>${anime.genre || 'Anime'}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading anime list:', error);
        grid.innerHTML = `<div class="empty-state"><p>Gagal memuat daftar anime.</p></div>`;
    }
}

// ============================================================
//  FILTER BY GENRE
// ============================================================
function filterByGenre(genre) {
    currentGenre = genre;
    
    // Update class active pada tombol genre
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.genre === genre);
    });
    
    // Load ulang anime dengan genre yang dipilih
    loadAnimeList(genre);
}

// ============================================================
//  PENCARIAN (Tetap Jalan dengan Filter Genre)
// ============================================================
async function searchAnime() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const grid = document.getElementById('animeGrid');

    if (!query) {
        loadAnimeList(currentGenre);
        return;
    }

    try {
        const response = await fetch('anime-list.json');
        const data = await response.json();
        let results = data.anime.filter(a => 
            a.title.toLowerCase().includes(query)
        );
        
        // ★ Filter juga berdasarkan genre yang sedang aktif ★
        if (currentGenre !== 'all') {
            results = results.filter(anime => {
                const genres = anime.genre.toLowerCase().split(', ');
                return genres.some(g => g.includes(currentGenre.toLowerCase()));
            });
        }

        if (results.length === 0) {
            grid.innerHTML = `<div class="empty-state"><p>Tidak ada hasil untuk "${query}"</p></div>`;
            return;
        }

        grid.innerHTML = results.map(anime => `
            <div class="anime-card" onclick="openDetail('${anime.id}')">
                <img src="${anime.image}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/300x400/1a1a2e/7a849b?text=No+Image'">
                <div class="info">
                    <h3>${anime.title}</h3>
                    <p>${anime.genre || 'Anime'}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Search error:', error);
    }
}

// ============================================================
//  OPEN DETAIL
// ============================================================
async function openDetail(animeId) {
    currentAnimeId = animeId;
    showPage('page-detail');

    const container = document.getElementById('detailContent');
    container.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    try {
        // Load info
        const infoRes = await fetch(`${animeId}/info.json`);
        if (!infoRes.ok) throw new Error('Info not found');
        const info = await infoRes.json();

        // Load episodes
        const epRes = await fetch(`${animeId}/episodes.json`);
        if (!epRes.ok) throw new Error('Episodes not found');
        const epData = await epRes.json();
        currentEpisodes = epData.episodes || [];

        const genres = info.genre ? info.genre.map(g => `<span>${g}</span>`).join('') : '';
        const synopsis = info.synopsis || 'Tidak ada sinopsis.';
        const img = info.image || 'https://via.placeholder.com/300x400/1a1a2e/7a849b?text=No+Image';

        let episodeButtons = '';
        if (currentEpisodes.length > 0) {
            episodeButtons = currentEpisodes.map((ep, idx) => `
                <div class="episode-btn" onclick="watchEpisode(${idx})">
                    EP ${ep.number} ${ep.title ? '- ' + ep.title : ''}
                </div>
            `).join('');
        } else {
            episodeButtons = `<div class="empty-state"><p>Belum ada episode.</p></div>`;
        }

        container.innerHTML = `
            <div class="detail-banner">
                <div class="poster"><img src="${img}" alt="${info.title}" onerror="this.src='https://via.placeholder.com/300x400/1a1a2e/7a849b?text=No+Image'"></div>
                <div class="desc">
                    <h1>${info.title}</h1>
                    ${genres ? `<div class="genres">${genres}</div>` : ''}
                    <p>${synopsis}</p>
                    <p style="margin-top:10px;color:#7a849b;">Total Episode: ${currentEpisodes.length}</p>
                </div>
            </div>
            <h3 style="margin:20px 0 10px 0;"><i class="fas fa-list-ul"></i> Daftar Episode</h3>
            <div class="episode-list">${episodeButtons}</div>
        `;

    } catch (error) {
        console.error('Error loading detail:', error);
        container.innerHTML = `<div class="empty-state"><p>Gagal memuat detail anime.</p><button class="back-btn" onclick="goHome()">Kembali</button></div>`;
    }
}

// ============================================================
//  WATCH EPISODE
// ============================================================
function watchEpisode(index) {
    if (!currentEpisodes || index >= currentEpisodes.length) {
        alert('Episode tidak tersedia!');
        return;
    }

    const episode = currentEpisodes[index];
    currentEpisodeIndex = index;

    showPage('page-watch');

    const video = document.getElementById('videoPlayer');
    const titleEl = document.getElementById('watchTitle');
    const videoWrapper = document.querySelector('.video-wrapper');

    // Reset player
    video.pause();
    video.src = '';

    titleEl.innerText = `Episode ${episode.number} - ${episode.title || 'Memutar...'}`;

    // Cek apakah link dari OK.ru (iframe) atau video langsung
    if (episode.url && (episode.url.includes('ok.ru') || episode.url.includes('youtube') || episode.url.includes('dailymotion'))) {
        // Pakai iframe untuk embed
        videoWrapper.innerHTML = `
            <iframe src="${episode.url}" width="100%" height="100%" frameborder="0" allowfullscreen style="border-radius:16px;"></iframe>
        `;
        // Sembunyikan video tag
        video.style.display = 'none';
    } else if (episode.url) {
        // Direct video (MP4, M3U8, dll)
        videoWrapper.innerHTML = `<video id="videoPlayer" controls autoplay></video>`;
        const newVideo = document.getElementById('videoPlayer');
        newVideo.src = episode.url;
        newVideo.play().catch(e => console.log('Autoplay blocked:', e));
    } else {
        alert('Link video tidak tersedia!');
    }

    updateNavButtons();
}

// ============================================================
//  NAVIGASI EPISODE
// ============================================================
function navigateEpisode(direction) {
    if (!currentEpisodes || currentEpisodes.length === 0) return;

    let newIndex = currentEpisodeIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= currentEpisodes.length) newIndex = currentEpisodes.length - 1;

    if (newIndex === currentEpisodeIndex) return;

    watchEpisode(newIndex);
}

function updateNavButtons() {
    const prevBtn = document.getElementById('prevEpBtn');
    const nextBtn = document.getElementById('nextEpBtn');
    if (prevBtn) prevBtn.disabled = (currentEpisodeIndex <= 0);
    if (nextBtn) nextBtn.disabled = (currentEpisodeIndex >= currentEpisodes.length - 1);
}

// ============================================================
//  INISIALISASI
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadAnimeList();

    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchAnime();
    });
});

console.log('🚀 AnimeStream siap!');
console.log('📁 Sistem folder manual aktif.');
