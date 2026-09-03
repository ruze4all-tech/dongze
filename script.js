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
//  CEK PLATFORM
// ============================================================
function isIframeUrl(url) {
    if (!url) return false;
    const u = url.toLowerCase();
    return u.includes('dailymotion.com') ||
           u.includes('ok.ru') ||
           u.includes('youtube.com') ||
           u.includes('youtu.be') ||
           u.includes('mega.nz') ||
           u.includes('drive.google.com') ||
           u.includes('rumble.com');
}

// ============================================================
//  FIX LINK
// ============================================================
function fixDailymotion(url) {
    if (!url) return url;
    if (url.includes('dailymotion.com/video/') && !url.includes('embed')) {
        return url.replace('dailymotion.com/video/', 'dailymotion.com/embed/video/');
    }
    return url;
}

function fixYoutube(url) {
    if (!url) return url;
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return url;
}

function fixOkru(url) {
    if (!url) return url;
    if (url.includes('ok.ru/video/') && !url.includes('videoembed')) {
        return url.replace('ok.ru/video/', 'ok.ru/videoembed/');
    }
    return url;
}

function fixRumble(url) {
    if (!url) return url;
    // Rumble: pastikan pakai /embed/
    if (url.includes('rumble.com/') && !url.includes('embed')) {
        const parts = url.split('/');
        const videoId = parts[parts.length - 1]?.split('?')[0];
        if (videoId) {
            return `https://rumble.com/embed/${videoId}/`;
        }
    }
    return url;
}

function fixUrl(url) {
    if (!url) return url;
    let fixed = url;
    fixed = fixOkru(fixed);
    fixed = fixDailymotion(fixed);
    fixed = fixYoutube(fixed);
    fixed = fixRumble(fixed);
    return fixed;
}

// ============================================================
//  NAVIGASI
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    const nav = document.getElementById('mainNav');
    if (nav) nav.style.display = (pageId === 'page-home') ? 'flex' : 'none';
}

function goHome() {
    history.replaceState({ page: 'home' }, '', window.location.href);
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
//  BACK BROWSER (POPSTATE)
// ============================================================
window.addEventListener('popstate', function(e) {
    const state = e.state;
    console.log('popstate:', state);

    if (!state || state.page === 'home') {
        return;
    }

    if (state.page === 'detail' && state.animeId) {
        currentAnimeId = state.animeId;
        showPage('page-detail');
        openDetail(currentAnimeId);
        return;
    }

    if (state.page === 'watch' && state.animeId !== undefined) {
        currentAnimeId = state.animeId;
        currentEpisodeIndex = state.episodeIndex || 0;
        showPage('page-watch');
        watchEpisode(currentEpisodeIndex);
        return;
    }

    goHome();
});

// ============================================================
//  LOAD DAFTAR ANIME
// ============================================================
async function loadAnimeList(genre = 'all', page = 1) {
    const grid = document.getElementById('animeGrid');
    grid.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    try {
        const res = await fetch('anime-list.json');
        if (!res.ok) throw new Error('File anime-list.json tidak ditemukan!');
        const data = await res.json();
        let list = data.anime || [];

        if (genre !== 'all') {
            list = list.filter(a => {
                const g = a.genre.toLowerCase().split(', ');
                return g.some(x => x.includes(genre.toLowerCase()));
            });
        }

        totalPages = Math.ceil(list.length / itemsPerPage) || 1;
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;
        currentPage = page;

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const items = list.slice(start, end);

        if (items.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-frown"></i><p>Tidak ada donghua.</p></div>`;
            updatePaginationButtons();
            return;
        }

        grid.innerHTML = items.map(a => `
            <div class="anime-card" onclick="openDetail('${a.id}')">
                <img src="${a.image}" alt="${a.title}" onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
                <div class="info">
                    <h3>${a.title}</h3>
                    <p>${a.genre || 'Donghua'}</p>
                </div>
            </div>
        `).join('');

        updatePaginationButtons();
    } catch (err) {
        console.error('Error:', err);
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${err.message}</p></div>`;
    }
}

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
    if (document.getElementById('page-detail').classList.contains('active') ||
        document.getElementById('page-watch').classList.contains('active')) {
        goHome();
    }
}

async function searchAnime() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const grid = document.getElementById('animeGrid');
    if (!query) { loadAnimeList(currentGenre, 1); return; }

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
        grid.innerHTML = results.map(a => `
            <div class="anime-card" onclick="openDetail('${a.id}')">
                <img src="${a.image}" alt="${a.title}" onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'">
                <div class="info">
                    <h3>${a.title}</h3>
                    <p>${a.genre || 'Donghua'}</p>
                </div>
            </div>
        `).join('');
        document.querySelector('.pagination').style.display = 'none';
        if (document.getElementById('page-detail').classList.contains('active') ||
            document.getElementById('page-watch').classList.contains('active')) {
            goHome();
        }
    } catch (err) { console.error(err); }
}

// ============================================================
//  OPEN DETAIL
// ============================================================
async function openDetail(animeId) {
    currentAnimeId = animeId;
    showPage('page-detail');
    history.pushState({ page: 'detail', animeId: animeId }, '', window.location.href);

    const container = document.getElementById('detailContent');
    container.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    try {
        const infoRes = await fetch(`${animeId}/info.json`);
        if (!infoRes.ok) throw new Error('info.json tidak ditemukan');
        const info = await infoRes.json();

        const epRes = await fetch(`${animeId}/episodes.json`);
        if (!epRes.ok) throw new Error('episodes.json tidak ditemukan');
        const epData = await epRes.json();
        currentEpisodes = epData.episodes || [];

        const genres = info.genre ? info.genre.map(g => `<span>${g}</span>`).join('') : '';
        const img = info.image || 'https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image';

        document.getElementById('breadcrumbSeries').textContent = info.title;

        let epBtns = '';
        if (currentEpisodes.length > 0) {
            epBtns = currentEpisodes.map((ep, idx) => {
                const hasLink = (ep.sources && ep.sources.length > 0) || ep.url;
                return `<div class="episode-btn" onclick="watchEpisode(${idx})">EP ${ep.number}${!hasLink ? ' (no link)' : ''}</div>`;
            }).join('');
        } else {
            epBtns = `<div class="empty-state"><p>Belum ada episode.</p></div>`;
        }

        container.innerHTML = `
            <div class="detail-banner">
                <div class="poster"><img src="${img}" alt="${info.title}" onerror="this.src='https://via.placeholder.com/300x400/141425/7a7a9a?text=No+Image'"></div>
                <div class="desc">
                    <h1>${info.title}</h1>
                    <span class="status">Ongoing - ${currentEpisodes.length} / ?</span>
                    ${genres ? `<div class="genres">${genres}</div>` : ''}
                    <p>${info.synopsis || 'Tidak ada sinopsis.'}</p>
                    <div class="meta-info">
                        <span><i class="fas fa-calendar-alt"></i> Updated: ${new Date().toLocaleDateString('id-ID')}</span>
                        <span><i class="fas fa-list-ul"></i> Total Episode: ${currentEpisodes.length}</span>
                    </div>
                </div>
            </div>
            <h3 style="margin:20px 0 10px 0;"><i class="fas fa-list-ul"></i> Daftar Episode</h3>
            <div class="episode-list">${epBtns}</div>
        `;

        const seriesLink = document.getElementById('breadcrumbSeriesLink');
        if (seriesLink) {
            seriesLink.textContent = info.title;
            seriesLink.onclick = function(e) {
                e.preventDefault();
                goToDetail();
            };
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${err.message}</p></div>`;
    }
}

// ============================================================
//  WATCH EPISODE
// ============================================================
function watchEpisode(index) {
    if (!currentEpisodes || currentEpisodes.length === 0) {
        alert('Tidak ada episode!');
        return;
    }
    if (index < 0 || index >= currentEpisodes.length) {
        alert('Episode tidak valid!');
        return;
    }

    const ep = currentEpisodes[index];
    currentEpisodeIndex = index;

    history.pushState({
        page: 'watch',
        animeId: currentAnimeId,
        episodeIndex: index
    }, '', window.location.href);

    if (ep.sources && ep.sources.length > 0) {
        currentSources = ep.sources;
    } else if (ep.url) {
        currentSources = [{ server: 'Dailymotion', url: ep.url }];
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
    document.getElementById('breadcrumbEpisode').textContent = `Episode ${ep.number}`;

    document.getElementById('episodeSeriesName').textContent = seriesName;
    document.getElementById('watchTitle').textContent = `${seriesName} Episode ${ep.number} - ${ep.title || 'Subtitle Indonesia'}`;
    document.getElementById('episodeReleaseDate').innerHTML = `<i class="far fa-calendar-alt"></i> Released on ${new Date().toLocaleDateString('id-ID')}`;
    document.getElementById('episodePostedBy').innerHTML = `<i class="far fa-user"></i> Posted by admin`;
    document.getElementById('episodeSeries').innerHTML = `<i class="fas fa-tv"></i> Series: <span id="episodeSeriesName">${seriesName}</span>`;

    updateServerDropdown();
    playSource(0);
    updateEpisodeGrid();
    updateNavButtons();
}

// ============================================================
//  DROPDOWN SERVER
// ============================================================
function updateServerDropdown() {
    const select = document.getElementById('videoServer');
    if (!select) return;
    select.innerHTML = '';
    if (!currentSources || currentSources.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Tidak ada server';
        select.appendChild(opt);
        select.disabled = true;
        return;
    }
    currentSources.forEach((s, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = s.server || 'Server ' + (i + 1);
        select.appendChild(opt);
    });
    select.disabled = false;
    select.value = currentSourceIndex;
    const sel = document.querySelector('.server-selector');
    if (sel) sel.style.display = (currentSources.length <= 1) ? 'none' : 'flex';
}

// ============================================================
//  ★ PLAY SOURCE (LENGKAP - OK.ru, Rumble, Dailymotion) ★
// ============================================================
function playSource(index) {
    if (!currentSources || index >= currentSources.length) return;

    const source = currentSources[index];
    currentSourceIndex = index;

    const wrapper = document.querySelector('.video-wrapper');
    if (!wrapper) {
        console.error('Video wrapper tidak ditemukan!');
        return;
    }

    let url = source.url;
    const serverName = source.server || '';

    // ★ FIX OK.ru ★
    if (serverName === 'OK.ru' || url.includes('ok.ru')) {
        if (url.includes('ok.ru/video/') && !url.includes('videoembed')) {
            url = url.replace('ok.ru/video/', 'ok.ru/videoembed/');
        }
        wrapper.innerHTML = `
            <iframe 
                src="${url}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allow="autoplay; encrypted-media; fullscreen" 
                allowfullscreen 
                style="border-radius:16px;border:none;"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            ></iframe>
        `;
        console.log('✅ Memutar OK.ru:', url);
        return;
    }

    // ★ FIX Rumble ★
    if (serverName === 'Rumble' || url.includes('rumble.com')) {
        if (!url.includes('embed')) {
            const parts = url.split('/');
            const videoId = parts[parts.length - 1]?.split('?')[0];
            if (videoId) {
                url = `https://rumble.com/embed/${videoId}/`;
            }
        }
        wrapper.innerHTML = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen style="border-radius:16px;border:none;"></iframe>`;
        console.log('✅ Memutar Rumble:', url);
        return;
    }

    // ★ FIX Dailymotion ★
    if (serverName === 'Dailymotion' || url.includes('dailymotion.com')) {
        url = fixDailymotion(url);
        wrapper.innerHTML = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen style="border-radius:16px;border:none;"></iframe>`;
        console.log('✅ Memutar Dailymotion:', url);
        return;
    }

    // ★ Platform lain (YouTube, Mega, Google Drive, dll) ★
    url = fixUrl(url);
    const useIframe = isIframeUrl(url);

    if (useIframe) {
        wrapper.innerHTML = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen style="border-radius:16px;border:none;"></iframe>`;
        console.log('✅ Memutar iframe:', url);
    } else {
        wrapper.innerHTML = `<video id="videoPlayer" controls autoplay style="width:100%;height:100%;display:block;"></video>`;
        const newVideo = document.getElementById('videoPlayer');
        if (newVideo) {
            newVideo.src = url;
            newVideo.play().catch(e => console.log('Autoplay blocked:', e));
        }
        console.log('🎬 Memutar video tag:', url);
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
    const idx = parseInt(select.value);
    if (!isNaN(idx) && idx >= 0 && idx < currentSources.length) {
        playSource(idx);
    }
}

// ============================================================
//  UPDATE EPISODE GRID
// ============================================================
function updateEpisodeGrid() {
    const grid = document.getElementById('episodeGrid');
    if (!grid || !currentEpisodes) return;

    grid.innerHTML = currentEpisodes.map((ep, idx) => {
        const hasLink = (ep.sources && ep.sources.length > 0) || ep.url;
        return `
            <div class="episode-square ${idx === currentEpisodeIndex ? 'active' : ''}" onclick="watchEpisode(${idx})">
                <span class="ep-number">${ep.number}</span>
                <span class="ep-title">${ep.title ? ep.title.substring(0, 6) : ''}</span>
                ${!hasLink ? '<span style="font-size:6px;color:#ff4757;">✕</span>' : ''}
            </div>
        `;
    }).join('');

    const counter = document.getElementById('episodeCounter');
    if (counter) {
        counter.textContent = `${currentEpisodeIndex + 1} / ${currentEpisodes.length}`;
    }
}

// ============================================================
//  NAVIGASI EPISODE
// ============================================================
function navigateEpisode(direction) {
    if (!currentEpisodes || currentEpisodes.length === 0) return;

    let newIndex = cur
