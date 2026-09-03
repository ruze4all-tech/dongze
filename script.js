// ============================================================
//  STATE
// ============================================================
let currentAnimeId = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let currentGenre = 'all';

// ============================================================
//  NAVIGASI BERBASIS HASH
// ============================================================
function navigateTo(page, data) {
    let hash = '#home';
    if (page === 'detail' && data) {
        hash = `#detail-${data}`;
    } else if (page === 'watch' && data) {
        hash = `#watch-${data.animeId}-${data.epIndex}`;
    }
    if (window.location.hash !== hash) {
        window.location.hash = hash;
    } else {
        // Jika hash sama, paksa reload konten
        handleHashChange();
    }
}

function goHome() {
    navigateTo('home');
}

function goToDetail(animeId) {
    currentAnimeId = animeId;
    navigateTo('detail', animeId);
}

function goToWatch(epIndex) {
    if (currentAnimeId) {
        navigateTo('watch', { animeId: currentAnimeId, epIndex: epIndex });
    }
}

// ============================================================
//  TANGANI PERUBAHAN HASH
// ============================================================
function handleHashChange() {
    const hash = window.location.hash || '#home';
    const parts = hash.split('-');

    if (hash === '#home' || hash === '') {
        showPage('page-home');
        loadAnimeList(currentGenre);
        currentAnimeId = null;
        return;
    }

    if (parts[0] === '#detail' && parts[1]) {
        const animeId = parts[1];
        currentAnimeId = animeId;
        showPage('page-detail');
        openDetail(animeId);
        return;
    }

    if (parts[0] === '#watch' && parts[1] && parts[2]) {
        const animeId = parts[1];
        const epIndex = parseInt(parts[2], 10);
        if (!isNaN(epIndex)) {
            currentAnimeId = animeId;
            currentEpisodeIndex = epIndex;
            showPage('page-watch');
            // Load detail dulu biar currentEpisodes terisi
            loadDetailForWatch(animeId, epIndex);
        }
        return;
    }

    // Fallback ke home
    navigateTo('home');
}

// ============================================================
//  FUNGSI BANTU UNTUK WATCH
// ============================================================
async function loadDetailForWatch(animeId, epIndex) {
    try {
        const epRes = await fetch(`${animeId}/episodes.json`);
        if (!epRes.ok) throw new Error('Episodes not found');
        const epData = await epRes.json();
        currentEpisodes = epData.episodes || [];
        if (currentEpisodes.length > 0 && epIndex < currentEpisodes.length) {
            watchEpisode(epIndex);
        } else {
            alert('Episode tidak ditemukan');
            goHome();
        }
    } catch (error) {
        console.error('Error loading episodes:', error);
        alert('Gagal memuat episode');
        goHome();
    }
}

// ============================================================
//  SHOW PAGE
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    const nav = document.getElementById('mainNav');
    if (nav) {
        nav.style.display = (pageId === 'page-home') ? 'flex' : 'none';
    }
}

// ============================================================
//  LOAD DAFTAR ANIME
// ============================================================
async function loadAnimeList(genre = 'all') {
    const grid = document.getElementById('animeGrid');
    grid.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    try {
        const response = await fetch('anime-list.json');
        if (!response.ok) throw new Error('Gagal load anime list');

        const data = await response.json();
        let animeList = data.anime || [];

        if (genre !== 'all') {
            animeList = animeList.filter(anime => {
                const genres = anime.genre.toLowerCase().split(', ');
                return genres.some(g => g.includes(genre.toLowerCase()));
            });
        }

        if (animeList.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-frown"></i><p>Tidak ada anime dengan genre ini.</p></div>`;
            return;
        }

        grid.innerHTML = animeList.map(anime => `
            <div class="anime-card" onclick="goToDetail('${anime.id}')">
                <img src="${anime.image}" alt="${anime.title}" 
                     onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
                <div class="info">
                    <h3>${anime.title}</h3>
                    <p>${anime.genre || 'Anime'}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading anime list:', error);
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat daftar anime.</p></div>`;
    }
}

// ============================================================
//  FILTER BY GENRE
// ============================================================
function filterByGenre(genre) {
    currentGenre = genre;
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.genre === genre);
    });
    loadAnimeList(genre);
    if (document.getElementById('page-detail').classList.contains('active') ||
        document.getElementById('page-watch').classList.contains('active')) {
        goHome();
    }
}

// ============================================================
//  PENCARIAN
// ============================================================
async function searchAnime() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const grid = document.getElementById('animeGrid');

    if (!query) { loadAnimeList(currentGenre); return; }

    try {
        const response = await fetch('anime-list.json');
        const data = await response.json();
        let results = data.anime.filter(a => a.title.toLowerCase().includes(query));

        if (currentGenre !== 'all') {
            results = results.filter(anime => {
                const genres = anime.genre.toLowerCase().split(', ');
                return genres.some(g => g.includes(currentGenre.toLowerCase()));
            });
        }

        if (results.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>Tidak ada hasil untuk "${query}"</p></div>`;
            return;
        }

        grid.innerHTML = results.map(anime => `
            <div class="anime-card" onclick="goToDetail('${anime.id}')">
                <img src="${anime.image}" alt="${anime.title}" 
                     onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
                <div class="info">
                    <h3>${anime.title}</h3>
                    <p>${anime.genre || 'Anime'}</p>
                </div>
            </div>
        `).join('');

        if (document.getElementById('page-detail').classList.contains('active') ||
            document.getElementById('page-watch').classList.contains('active')) {
            goHome();
        }
    } catch (error) { console.error('Search error:', error); }
}

// ============================================================
//  OPEN DETAIL
// ============================================================
async function openDetail(animeId) {
    const container = document.getElementById('detailContent');
    container.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    try {
        const infoRes = await fetch(`${animeId}/info.json`);
        if (!infoRes.ok) throw new Error('Info not found');
        const info = await infoRes.json();

        const epRes = await fetch(`${animeId}/episodes.json`);
        if (!epRes.ok) throw new Error('Episodes not found');
        const epData = await epRes.json();
        currentEpisodes = epData.episodes || [];

        const genres = info.genre ? info.genre.map(g => `<span>${g}</span>`).join('') : '';
        const synopsis = info.synopsis || 'Tidak ada sinopsis.';
        const img = info.image || 'https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image';
        const totalEp = currentEpisodes.length;

        document.getElementById('breadcrumbSeries').textContent = info.title;

        let episodeButtons = '';
        if (currentEpisodes.length > 0) {
            episodeButtons = currentEpisodes.map((ep, idx) => `
                <div class="episode-btn" onclick="goToWatch(${idx})">
                    EP ${ep.number} ${ep.title ? '- ' + ep.title : ''}
                </div>
            `).join('');
        } else {
            episodeButtons = `<div class="empty-state"><p>Belum ada episode.</p></div>`;
        }

        container.innerHTML = `
            <div class="detail-banner">
                <div class="poster"><img src="${img}" alt="${info.title}" onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'"></div>
                <div class="desc">
                    <h1>${info.title}</h1>
                    <span class="status">Ongoing - ${totalEp} / ?</span>
                    ${genres ? `<div class="genres">${genres}</div>` : ''}
                    <p>${synopsis}</p>
                    <div class="meta-info">
                        <span><i class="fas fa-calendar-alt"></i> Updated: ${new Date().toLocaleDateString('id-ID')}</span>
                        <span><i class="fas fa-list-ul"></i> Total Episode: ${totalEp}</span>
                        <span><i class="fas fa-tag"></i> ${info.genre ? info.genre.join(', ') : '-'}</span>
                    </div>
                </div>
            </div>
            <h3 style="margin:20px 0 10px 0;"><i class="fas fa-list-ul"></i> Daftar Episode</h3>
            <div class="episode-list">${episodeButtons}</div>
        `;

        const seriesLink = document.getElementById('breadcrumbSeriesLink');
        if (seriesLink) {
            seriesLink.textContent = info.title;
            seriesLink.onclick = function(e) {
                e.preventDefault();
                goToDetail(currentAnimeId);
            };
        }

    } catch (error) {
        console.error('Error loading detail:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat detail anime.</p></div>`;
    }
}

// ============================================================
//  WATCH EPISODE
// ============================================================
function watchEpisode(index) {
    if (!currentEpisodes || currentEpisodes.length === 0) {
        alert('Tidak ada episode tersedia!');
        return;
    }
    if (index < 0 || index >= currentEpisodes.length) {
        alert('Episode tidak valid!');
        return;
    }

    const episode = currentEpisodes[index];
    currentEpisodeIndex = index;

    const seriesName = document.getElementById('breadcrumbSeries')?.textContent || 'Series';
    document.getElementById('breadcrumbSeriesLink').textContent = seriesName;
    document.getElementById('breadcrumbSeriesLink').onclick = function(e) {
        e.preventDefault();
        goToDetail(currentAnimeId);
    };
    document.getElementById('breadcrumbEpisode').textContent = `Episode ${episode.number}`;
    document.getElementById('episodeSeriesName').textContent = seriesName;

    document.getElementById('watchTitle').textContent = `${seriesName} Episode ${episode.number} - ${episode.title || 'Subtitle Indonesia'}`;
    document.getElementById('episodeReleaseDate').innerHTML = `<i class="far fa-calendar-alt"></i> Released on ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    document.getElementById('episodePostedBy').innerHTML = `<i class="far fa-user"></i> Posted by admin`;
    document.getElementById('episodeSeries').innerHTML = `<i class="fas fa-tv"></i> Series: <span id="episodeSeriesName">${seriesName}</span>`;

    const video = document.getElementById('videoPlayer');
    const videoWrapper = document.querySelector('.video-wrapper');
    video.pause();
    video.src = '';
    video.style.display = 'block';
    videoWrapper.innerHTML = `<video id="videoPlayer" controls autoplay></video>`;
    const newVideo = document.getElementById('videoPlayer');

    if (episode.url) {
        const url = episode.url;
        if (url.includes('ok.ru') || url.includes('youtube') || url.includes('dailymotion') || url.includes('mega.nz')) {
            videoWrapper.innerHTML = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen style="border-radius:16px;"></iframe>`;
        } else {
            newVideo.src = url;
            newVideo.play().catch(e => console.log('Autoplay blocked:', e));
        }
    } else {
        videoWrapper.innerHTML = `<div class="empty-state"><p>Link video tidak tersedia.</p></div>`;
    }

    updateEpisodeSidebar();
    updateNavButtons();
}

// ============================================================
//  EPISODE SIDEBAR & NAVIGASI
// ============================================================
function updateEpisodeSidebar() {
    const sidebar = document.getElementById('episodeListSidebar');
    if (!sidebar || !currentEpisodes) return;

    sidebar.innerHTML = currentEpisodes.map((ep, idx) => `
        <div class="episode-item ${idx === currentEpisodeIndex ? 'active' : ''}" onclick="goToWatch(${idx})">
            <span class="ep-number">Episode ${ep.number}</span>
            <span class="ep-title">${ep.title || 'Subtitle Indonesia'}</span>
            <span class="ep-date">${new Date().toLocaleDateString('id-ID')}</span>
        </div>
    `).join('');
}

function navigateEpisode(direction) {
    if (!currentEpisodes || currentEpisodes.length === 0) return;

    let newIndex = currentEpisodeIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= currentEpisodes.length) newIndex = currentEpisodes.length - 1;
    if (newIndex === currentEpisodeIndex) return;

    goToWatch(newIndex);
}

function updateNavButtons() {
    const prevBtn = document.getElementById('prevEpBtn');
    const nextBtn = document.getElementById('nextEpBtn');
    if (!prevBtn || !nextBtn) return;
    if (!currentEpisodes || currentEpisodes.length === 0) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }
    prevBtn.disabled = (currentEpisodeIndex <= 0);
    nextBtn.disabled = (currentEpisodeIndex >= currentEpisodes.length - 1);
}

// ============================================================
//  SERVER SELECTOR
// ============================================================
function changeServer() {
    const select = document.getElementById('videoServer');
    const server = select.value;
    localStorage.setItem('preferredServer', server);
    if (currentEpisodeIndex !== undefined && currentEpisodes.length > 0) {
        goToWatch(currentEpisodeIndex);
    }
}

// ============================================================
//  INISIALISASI
// ============================================================
window.addEventListener('hashchange', handleHashChange);

document.addEventListener('DOMContentLoaded', () => {
    // Set hash default jika kosong
    if (!window.location.hash || window.location.hash === '') {
        window.location.hash = '#home';
    }
    // Proses hash awal
    handleHashChange();

    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchAnime();
    });

    const savedServer = localStorage.getItem('preferredServer');
    if (savedServer) {
        const select = document.getElementById('videoServer');
        if (select) select.value = savedServer;
    }

    document.getElementById('videoServer')?.addEventListener('change', () => {
        localStorage.setItem('preferredServer', document.getElementById('videoServer').value);
    });
});

console.log('🚀 AnimeStream siap (hash-based navigation)');
console.log('📌 URL hash: #home, #detail-{id}, #watch-{id}-{ep}');
console.log('📌 Back browser bekerja normal seperti browser biasa.');
