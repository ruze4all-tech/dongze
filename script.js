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
//  PAGINATION STATE
// ============================================================
let currentPage = 1;
const itemsPerPage = 24;
let totalPages = 1;

// ============================================================
//  ★ DAFTAR PLATFORM YANG SUPPORT IFRAME (LENGKAP) ★
// ============================================================
const IFRAME_PLATFORMS = [
    'ok.ru',
    'youtube.com',
    'youtu.be',
    'dailymotion.com',
    'mega.nz',
    'drive.google.com',
    'streamtape.com',
    'vimeo.com',
    'player.vimeo.com',
    'streamwish.com',
    'terabox.com',
    'mediafire.com',
    'dropbox.com',
    'pcloud.com',
    'gofile.io',
    'sendvid.com',
    'vidhide.com',
    'vudeo.net',
    'voe.sx',
    'vidplay.site',
    'vidoza.net',
    'filemoon.sx',
    'facebook.com',
    'fb.watch',
    'twitch.tv',
    'player.twitch.tv'
];

// ============================================================
//  ★ CEK APAKAH URL BUTUH IFRAME ★
// ============================================================
function isIframePlatform(url) {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    const result = IFRAME_PLATFORMS.some(platform => urlLower.includes(platform));
    console.log('isIframePlatform:', url, '→', result);
    return result;
}

// ============================================================
//  ★ FUNGSI FIX LINK ★
// ============================================================
function fixOkRuUrl(url) {
    if (!url) return url;
    if (url.includes('ok.ru/video/') && !url.includes('videoembed')) {
        return url.replace('ok.ru/video/', 'ok.ru/videoembed/');
    }
    return url;
}

function fixGoogleDriveUrl(url) {
    if (!url) return url;
    if (url.includes('drive.google.com/file/d/')) {
        if (!url.endsWith('/preview')) {
            return url + '/preview';
        }
    }
    return url;
}

function fixMegaUrl(url) {
    if (!url) return url;
    if (url.includes('mega.nz/file/') && !url.includes('embed')) {
        return url.replace('mega.nz/file/', 'mega.nz/embed/');
    }
    return url;
}

function fixDailymotionUrl(url) {
    if (!url) return url;
    if (url.includes('dailymotion.com/video/') && !url.includes('embed')) {
        return url.replace('dailymotion.com/video/', 'dailymotion.com/embed/video/');
    }
    return url;
}

function fixYoutubeUrl(url) {
    if (!url) return url;
    if (url.includes('youtube.com/watch?v=') && !url.includes('embed')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    }
    if (url.includes('youtu.be/') && !url.includes('embed')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    }
    return url;
}

function fixStreamtapeUrl(url) {
    if (!url) return url;
    if (url.includes('streamtape.com/v/') && !url.includes('/e/')) {
        return url.replace('streamtape.com/v/', 'streamtape.com/e/');
    }
    return url;
}

function fixUrl(url) {
    if (!url) return url;
    let fixed = url;
    fixed = fixOkRuUrl(fixed);
    fixed = fixGoogleDriveUrl(fixed);
    fixed = fixMegaUrl(fixed);
    fixed = fixDailymotionUrl(fixed);
    fixed = fixYoutubeUrl(fixed);
    fixed = fixStreamtapeUrl(fixed);
    console.log('fixUrl:', url, '→', fixed);
    return fixed;
}

// ============================================================
//  NAVIGASI
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    const nav = document.getElementById('mainNav');
    if (nav) {
        nav.style.display = (pageId === 'page-home') ? 'flex' : 'none';
    }

    if (pageId !== 'page-home') {
        const stateData = { page: pageId };
        if (pageId === 'page-detail' && currentAnimeId) {
            stateData.animeId = currentAnimeId;
        }
        if (pageId === 'page-watch' && currentAnimeId) {
            stateData.animeId = currentAnimeId;
            stateData.episodeIndex = currentEpisodeIndex;
        }
        history.pushState(stateData, '', window.location.href);
    }
}

function goHome() {
    history.replaceState({ page: 'page-home' }, '', window.location.href);
    showPage('page-home');
    loadAnimeList(currentGenre, 1);
    currentAnimeId = null;
}

function goToDetail() {
    if (currentAnimeId) {
        showPage('page-detail');
        openDetail(currentAnimeId);
    } else {
        goHome();
    }
}

// ============================================================
//  TANGANI BACK BROWSER (POPSTATE)
// ============================================================
window.addEventListener('popstate', function(event) {
    const state = event.state;
    if (!state || state.page === 'page-home') {
        return;
    }
    if (state.page === 'page-detail' && state.animeId) {
        currentAnimeId = state.animeId;
        showPage('page-detail');
        openDetail(currentAnimeId);
        return;
    }
    if (state.page === 'page-watch' && state.animeId) {
        currentAnimeId = state.animeId;
        currentEpisodeIndex = state.episodeIndex || 0;
        showPage('page-watch');
        watchEpisode(currentEpisodeIndex);
        return;
    }
    goHome();
});

// ============================================================
//  LOAD DAFTAR ANIME (DENGAN PAGINATION)
// ============================================================
async function loadAnimeList(genre = 'all', page = 1) {
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

        totalPages = Math.ceil(animeList.length / itemsPerPage) || 1;
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;
        currentPage = page;

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = animeList.slice(start, end);

        if (pageItems.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-frown"></i><p>Tidak ada donghua dengan genre ini.</p></div>`;
            updatePaginationButtons();
            return;
        }

        grid.innerHTML = pageItems.map(anime => `
            <div class="anime-card" onclick="openDetail('${anime.id}')">
                <img src="${anime.image}" alt="${anime.title}" 
                     onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
                <div class="info">
                    <h3>${anime.title}</h3>
                    <p>${anime.genre || 'Donghua'}</p>
                </div>
            </div>
        `).join('');

        updatePaginationButtons();

    } catch (error) {
        console.error('Error loading anime list:', error);
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat daftar donghua.</p></div>`;
    }
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage < 1 || newPage > totalPages) return;
    loadAnimeList(currentGenre, newPage);
}

function updatePaginationButtons() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const info = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = (currentPage <= 1);
    if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);
    if (info) info.textContent = `Halaman ${currentPage} dari ${totalPages}`;
}

// ============================================================
//  FILTER & SEARCH
// ============================================================
function filterByGenre(genre) {
    currentGenre = genre;
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.genre === genre);
    });
    loadAnimeList(genre, 1);
    if (document.getElementById('page-detail').classList.contains('active') ||
        document.getElementById('page-watch').classList.contains('active')) {
        goHome();
    }
}

async function searchAnime() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const grid = document.getElementById('animeGrid');

    if (!query) { loadAnimeList(currentGenre, 1); return; }

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
            <div class="anime-card" onclick="openDetail('${anime.id}')">
                <img src="${anime.image}" alt="${anime.title}" 
                     onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
                <div class="info">
                    <h3>${anime.title}</h3>
                    <p>${anime.genre || 'Donghua'}</p>
                </div>
            </div>
        `).join('');

        document.querySelector('.pagination').style.display = 'none';

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
    currentAnimeId = animeId;
    showPage('page-detail');

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
            episodeButtons = currentEpisodes.map((ep, idx) => {
                const hasLink = (ep.sources && ep.sources.length > 0) || ep.url;
                const label = hasLink ? `EP ${ep.number}` : `EP ${ep.number} (no link)`;
                return `<div class="episode-btn" onclick="watchEpisode(${idx})">${label}</div>`;
            }).join('');
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
                goToDetail();
            };
        }

    } catch (error) {
        console.error('Error loading detail:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat detail donghua.</p></div>`;
    }
}

// ============================================================
//  WATCH EPISODE (SUPPORT URL LAMA & SOURCES BARU)
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

    // ★ DETEKSI FORMAT ★
    if (episode.sources && episode.sources.length > 0) {
        currentSources = episode.sources;
    } else if (episode.url) {
        currentSources = [{ server: 'Default', url: episode.url }];
    } else {
        alert('Episode ini belum memiliki link video.');
        return;
    }

    currentSourceIndex = 0;

    showPage('page-watch');

    const seriesName = document.getElementById('breadcrumbSeries')?.textContent || 'Series';
    document.getElementById('breadcrumbSeriesLink').textContent = seriesName;
    document.getElementById('breadcrumbSeriesLink').onclick = function(e) {
        e.preventDefault();
        goToDetail();
    };
    document.getElementById('breadcrumbEpisode').textContent = `Episode ${episode.number}`;
    document.getElementById('episodeSeriesName').textContent = seriesName;
    document.getElementById('watchTitle').textContent = `${seriesName} Episode ${episode.number} - ${episode.title || 'Subtitle Indonesia'}`;
    document.getElementById('episodeReleaseDate').innerHTML = `<i class="far fa-calendar-alt"></i> Released on ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    document.getElementById('episodePostedBy').innerHTML = `<i class="far fa-user"></i> Posted by admin`;
    document.getElementById('episodeSeries').innerHTML = `<i class="fas fa-tv"></i> Series: <span id="episodeSeriesName">${seriesName}</span>`;

    updateServerDropdown();
    playSource(0);
    updateEpisodeGrid();
    updateNavButtons();
}

// ============================================================
//  UPDATE DROPDOWN SERVER
// ============================================================
function updateServerDropdown() {
    const select = document.getElementById('videoServer');
    if (!select) return;

    select.innerHTML = '';

    if (!currentSources || currentSources.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Tidak ada server';
        select.appendChild(option);
        select.disabled = true;
        return;
    }

    currentSources.forEach((source, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = source.server || 'Server ' + (idx + 1);
        select.appendChild(option);
    });

    select.disabled = false;
    select.value = currentSourceIndex;

    const selector = document.querySelector('.server-selector');
    if (selector) {
        selector.style.display = (currentSources.length <= 1) ? 'none' : 'flex';
    }
}

// ============================================================
//  ★ PLAY SOURCE (OTOMATIS DETEKSI PLATFORM) ★
// ============================================================
function playSource(index) {
    if (!currentSources || index >= currentSources.length) return;

    const source = currentSources[index];
    currentSourceIndex = index;

    const video = document.getElementById('videoPlayer');
    const videoWrapper = document.querySelector('.video-wrapper');
    video.pause();
    video.src = '';
    video.style.display = 'block';

    let url = source.url;
    console.log('Original URL:', url);

    // ★ OTOMATIS FIX LINK ★
    url = fixUrl(url);
    console.log('Fixed URL:', url);

    // ★ CEK APAKAH BUTUH IFRAME ★
    const useIframe = isIframePlatform(url);
    console.log('Use iframe?', useIframe);

    if (useIframe) {
        videoWrapper.innerHTML = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen style="border-radius:16px;"></iframe>`;
        console.log('✅ Menggunakan iframe untuk:', url);
    } else {
        // Selain itu, anggap sebagai video langsung (MP4, M3U8, dll.)
        videoWrapper.innerHTML = `<video id="videoPlayer" controls autoplay></video>`;
        const newVideo = document.getElementById('videoPlayer');
        newVideo.src = url;
        newVideo.play().catch(e => console.log('Autoplay blocked:', e));
        console.log('🎬 Menggunakan video tag untuk:', url);
    }

    // Update dropdown
    const select = document.getElementById('videoServer');
    if (select) select.value = index;
}

// ============================================================
//  CHANGE SERVER (dari dropdown)
// ============================================================
function changeServer() {
    const select = document.getElementById('videoServer');
    const index = parseInt(select.value);
    if (!isNaN(index) && index >= 0 && index < currentSources.length) {
        playSource(index);
    }
}

// ============================================================
//  UPDATE EPISODE GRID & COUNTER
// ============================================================
function updateEpisodeGrid() {
    const grid = document.getElementById('episodeGrid');
    if (!grid || !currentEpisodes) return;

    grid.innerHTML = currentEpisodes.map((ep, idx) => {
        const hasLink = (ep.sources && ep.sources.length > 0) || ep.url;
        return `
            <div class="episode-square ${idx === currentEpisodeIndex ? 'active' : ''}" onclick="watchEpisode(${idx})">
                <span class="ep-number">${ep.number}</span>
                <span class="ep-title">${ep.title}</span>
            </div>
        `;
    }).join('');
}
