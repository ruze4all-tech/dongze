// ============================================================
//  KONFIGURASI
// ============================================================
// ★★★ GANTI INI DENGAN URL COBALT API-MU ★★★
const API_BASE = 'https://dongze-production.up.railway.app/';
// ★★★ SAMPAI SINI ★★★

// ============================================================
//  STATE
// ============================================================
let currentPage = 'home';
let currentAnimeId = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let currentWatchId = null;

// ============================================================
//  FUNGSI FETCH
// ============================================================
async function fetchAPI(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Fetch Error:', err);
        return null;
    }
}

function showLoader(show) {
    document.getElementById('globalLoader').style.display = show ? 'flex' : 'none';
}

// ============================================================
//  NAVIGASI
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
}

function goHome() {
    showPage('page-home');
    if (document.getElementById('trendingGrid').children.length === 0) {
        loadHome();
    }
}

// ============================================================
//  LOAD HOME
// ============================================================
async function loadHome() {
    showLoader(true);
    const trendingGrid = document.getElementById('trendingGrid');
    const recentGrid = document.getElementById('recentGrid');
    trendingGrid.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;
    recentGrid.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    // Trending
    const trendingData = await fetchAPI(`https://api.conumet.org/anime/gogoanime/top-airing?page=1`);
    if (trendingData && trendingData.results) {
        trendingGrid.innerHTML = renderCards(trendingData.results.slice(0, 12));
    } else {
        trendingGrid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat trending</p></div>`;
    }

    // Recent
    const recentData = await fetchAPI(`https://api.conumet.org/anime/gogoanime/recent-episodes?page=1`);
    if (recentData && recentData.results) {
        recentGrid.innerHTML = renderCards(recentData.results.slice(0, 12));
    } else {
        recentGrid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat episode terbaru</p></div>`;
    }
    showLoader(false);
}

// ============================================================
//  RENDER CARD
// ============================================================
function renderCards(items) {
    if (!items || items.length === 0) {
        return `<div class="empty-state"><i class="fas fa-frown"></i><p>Anime tidak ditemukan</p></div>`;
    }
    return items.map(item => {
        const title = item.title || 'No Title';
        const img = item.image || 'https://via.placeholder.com/300x400/1e273a/7a849b?text=No+Image';
        const id = item.id || item.animeId || '';
        const ep = item.episodeNumber || item.episodes || '?';
        return `
            <div class="anime-card" onclick="openDetail('${id}')">
                <img src="${img}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/1e273a/7a849b?text=Error'">
                <div class="info">
                    <h3>${title}</h3>
                    <p>Episode ${ep}</p>
                    ${item.episodeNumber ? `<span class="ep-badge">EP ${item.episodeNumber}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
//  PENCARIAN
// ============================================================
async function searchAnime() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    showLoader(true);
    const data = await fetchAPI(`https://api.conumet.org/anime/gogoanime/search?query=${encodeURIComponent(query)}&page=1`);
    showLoader(false);

    const grid = document.getElementById('trendingGrid');
    if (data && data.results) {
        grid.innerHTML = renderCards(data.results);
        document.querySelector('.section-title').innerHTML = `<i class="fas fa-search"></i> Hasil pencarian: "${query}"`;
    } else {
        grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Tidak ada hasil untuk "${query}"</p></div>`;
    }
    showPage('page-home');
}

// ============================================================
//  DETAIL ANIME
// ============================================================
async function openDetail(animeId) {
    if (!animeId) return;
    showLoader(true);
    showPage('page-detail');

    const detailContainer = document.getElementById('detailContent');
    detailContainer.innerHTML = `<div class="loader"><i class="fas fa-spinner"></i></div>`;

    const data = await fetchAPI(`https://api.conumet.org/anime/gogoanime/info/${animeId}`);
    showLoader(false);

    if (!data || !data.title) {
        detailContainer.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat detail anime.</p><button class="back-btn" onclick="goHome()">Kembali</button></div>`;
        return;
    }

    currentAnimeId = animeId;
    currentEpisodes = data.episodes || [];
    currentEpisodeIndex = 0;

    const genres = data.genres ? data.genres.map(g => `<span>${g}</span>`).join('') : '';
    const synopsis = data.synopsis || data.description || 'Tidak ada sinopsis.';
    const img = data.image || 'https://via.placeholder.com/300x400/1e273a/7a849b?text=No+Image';

    let episodeButtons = '';
    if (currentEpisodes.length > 0) {
        const showEp = currentEpisodes.slice(-50).reverse();
        episodeButtons = showEp.map((ep, idx) => {
            const epNum = ep.number || ep.episode || idx + 1;
            const epId = ep.id || ep.episodeId || '';
            return `<div class="episode-btn" onclick="watchEpisode('${epId}', ${idx})">EP ${epNum}</div>`;
        }).join('');
    } else {
        episodeButtons = `<div class="empty-state" style="grid-column:1/-1; padding:20px;"><p>Belum ada episode tersedia.</p></div>`;
    }

    detailContainer.innerHTML = `
        <div class="detail-banner">
            <div class="poster"><img src="${img}" alt="${data.title}" onerror="this.src='https://via.placeholder.com/300x400/1e273a/7a849b?text=No+Image'"></div>
            <div class="desc">
                <h1>${data.title}</h1>
                ${genres ? `<div class="genres">${genres}</div>` : ''}
                <p>${synopsis.slice(0, 300)}${synopsis.length > 300 ? '...' : ''}</p>
                <p style="margin-top:10px;color:#7a849b;">Total Episode: ${data.totalEpisodes || currentEpisodes.length || '?'}</p>
            </div>
        </div>
        <h3 style="margin:20px 0 10px 0;"><i class="fas fa-list-ul"></i> Daftar Episode</h3>
        <div class="episode-list" id="episodeListContainer">${episodeButtons}</div>
    `;

    window.__currentEpisodes = currentEpisodes;
}

// ============================================================
//  WATCH EPISODE (Dari API Gogoanime)
// ============================================================
async function watchEpisode(episodeId, index) {
    if (!episodeId) {
        alert('ID episode tidak valid!');
        return;
    }

    showLoader(true);
    showPage('page-watch');

    const watchContainer = document.getElementById('watchContent');
    document.getElementById('watchTitle').innerText = 'Memuat video...';
    document.getElementById('videoPlayer').innerHTML = '';

    const data = await fetchAPI(`https://api.conumet.org/anime/gogoanime/watch/${episodeId}`);
    showLoader(false);

    const video = document.getElementById('videoPlayer');
    const titleEl = document.getElementById('watchTitle');

    if (!data || !data.sources || data.sources.length === 0) {
        titleEl.innerText = 'Video tidak tersedia';
        video.innerHTML = `<source src="" type="video/mp4"><p style="color:red;text-align:center;padding:40px;">Gagal memuat sumber video.</p>`;
        return;
    }

    let selectedSource = data.sources.find(s => s.quality === 'default' || s.quality === '720p' || s.quality === '1080p');
    if (!selectedSource) selectedSource = data.sources[0];

    const url = selectedSource.url;
    const isM3U8 = url && url.includes('.m3u8');

    const epList = window.__currentEpisodes || [];
    let epNumber = '?';
    if (epList.length > 0 && index !== undefined && epList[index]) {
        epNumber = epList[index].number || epList[index].episode || (index + 1);
    }
    titleEl.innerText = `Episode ${epNumber}`;

    currentWatchId = episodeId;
    if (index !== undefined) currentEpisodeIndex = index;
    updateNavButtons();

    if (isM3U8) {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.log('Autoplay blocked:', e));
            });
            window.__currentHls = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.play().catch(e => console.log(e));
        } else {
            titleEl.innerText = 'Browser tidak support HLS';
        }
    } else {
        video.src = url;
        video.play().catch(e => console.log(e));
    }
}

// ============================================================
//  PLAY VIDEO DARI OK.ru (PAKAI COBALT API)
// ============================================================
async function playOkRuVideo(okRuUrl) {
    if (!okRuUrl || !okRuUrl.trim()) {
        alert('Masukkan link video dulu!');
        return;
    }

    const video = document.getElementById('videoPlayer');
    const titleEl = document.getElementById('watchTitle');
    const status = document.getElementById('status');

    // Matikan HLS sebelumnya
    if (window.__currentHls) {
        window.__currentHls.destroy();
        window.__currentHls = null;
    }

    // Pindah ke halaman tonton
    showPage('page-watch');
    titleEl.innerText = '⏳ Mengambil video dari OK.ru...';

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: okRuUrl.trim() })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        console.log('Respons Cobalt API:', data);

        let videoUrl = null;
        if (data.status === 'redirect' || data.status === 'stream' || data.status === 'success') {
            videoUrl = data.url;
        } else if (data.status === 'picker' && data.picker && data.picker.length > 0) {
            videoUrl = data.picker[0].url;
        }

        if (!videoUrl) {
            throw new Error('Tidak dapat menemukan link video dari API.');
        }

        titleEl.innerText = '🎬 Memutar dari OK.ru';
        video.src = videoUrl;
        video.play().catch(e => console.log('Autoplay blocked:', e));

        // Update status
        const statusBar = document.querySelector('.status-bar .badge');
        if (statusBar) {
            statusBar.textContent = '✅ Berhasil';
            statusBar.className = 'badge success';
        }

    } catch (error) {
        console.error('Error:', error);
        titleEl.innerText = '❌ Error: ' + error.message;
        const statusBar = document.querySelector('.status-bar .badge');
        if (statusBar) {
            statusBar.textContent = '❌ Gagal';
            statusBar.className = 'badge error';
        }
        alert('Gagal memutar video: ' + error.message);
    }
}

// ============================================================
//  NAVIGASI EPISODE
// ============================================================
function navigateEpisode(direction) {
    const epList = window.__currentEpisodes || [];
    if (epList.length === 0) return;

    let newIndex = currentEpisodeIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= epList.length) newIndex = epList.length - 1;

    if (newIndex === currentEpisodeIndex) return;

    const ep = epList[newIndex];
    const epId = ep.id || ep.episodeId;
    if (epId) {
        watchEpisode(epId, newIndex);
    } else {
        alert('Episode tidak memiliki ID valid.');
    }
}

function updateNavButtons() {
    const epList = window.__currentEpisodes || [];
    const prevBtn = document.getElementById('prevEpBtn');
    const nextBtn = document.getElementById('nextEpBtn');
    if (prevBtn) prevBtn.disabled = (currentEpisodeIndex <= 0);
    if (nextBtn) nextBtn.disabled = (currentEpisodeIndex >= epList.length - 1);
}

// ============================================================
//  INISIALISASI
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadHome();

    window.addEventListener('popstate', () => {
        if (currentPage !== 'page-home') {
            goHome();
        }
    });

    // Enter key untuk input manual
    document.getElementById('manualVideoUrl')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            playOkRuVideo(document.getElementById('manualVideoUrl').value.trim());
        }
    });
});

console.log('🚀 AnimeStream siap!');
console.log('📍 Cobalt API URL:', API_BASE);
