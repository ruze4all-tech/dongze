// ============================================================
//  DAFTAR PLATFORM YANG SUPPORT IFRAME
// ============================================================
const IFRAME_PLATFORMS = [
    'ok.ru', 'youtube.com', 'youtu.be', 'dailymotion.com',
    'mega.nz', 'drive.google.com', 'streamtape.com', 'vimeo.com',
    'player.vimeo.com', 'streamwish.com', 'terabox.com',
    'mediafire.com', 'dropbox.com', 'pcloud.com', 'gofile.io',
    'sendvid.com', 'vidhide.com', 'vudeo.net', 'voe.sx',
    'vidplay.site', 'vidoza.net', 'filemoon.sx'
];

function isIframePlatform(url) {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    return IFRAME_PLATFORMS.some(p => urlLower.includes(p));
}

function fixUrl(url) {
    if (!url) return url;
    let fixed = url;

    // OK.ru
    if (fixed.includes('ok.ru/video/') && !fixed.includes('videoembed')) {
        fixed = fixed.replace('ok.ru/video/', 'ok.ru/videoembed/');
    }

    // Dailymotion
    if (fixed.includes('dailymotion.com/video/') && !fixed.includes('embed')) {
        fixed = fixed.replace('dailymotion.com/video/', 'dailymotion.com/embed/video/');
    }

    // YouTube
    if (fixed.includes('youtube.com/watch?v=') && !fixed.includes('embed')) {
        const id = fixed.split('v=')[1]?.split('&')[0];
        if (id) fixed = `https://www.youtube.com/embed/${id}`;
    }
    if (fixed.includes('youtu.be/') && !fixed.includes('embed')) {
        const id = fixed.split('youtu.be/')[1]?.split('?')[0];
        if (id) fixed = `https://www.youtube.com/embed/${id}`;
    }

    // Mega
    if (fixed.includes('mega.nz/file/') && !fixed.includes('embed')) {
        fixed = fixed.replace('mega.nz/file/', 'mega.nz/embed/');
    }

    // Google Drive
    if (fixed.includes('drive.google.com/file/d/') && !fixed.endsWith('/preview')) {
        fixed = fixed + '/preview';
    }

    // Streamtape
    if (fixed.includes('streamtape.com/v/') && !fixed.includes('/e/')) {
        fixed = fixed.replace('streamtape.com/v/', 'streamtape.com/e/');
    }

    return fixed;
}

// ============================================================
//  PLAY SOURCE (FIX - LENGKAP)
// ============================================================
function playSource(index) {
    if (!currentSources || index >= currentSources.length) return;

    const source = currentSources[index];
    currentSourceIndex = index;

    const video = document.getElementById('videoPlayer');
    const videoWrapper = document.querySelector('.video-wrapper');
    
    if (!video || !videoWrapper) {
        console.error('Video element or wrapper not found!');
        return;
    }

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
        videoWrapper.innerHTML = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen style="border-radius:16px;border:none;"></iframe>`;
        console.log('✅ Menggunakan iframe untuk:', url);
    } else {
        // Video langsung (MP4, M3U8, dll.)
        videoWrapper.innerHTML = `<video id="videoPlayer" controls autoplay></video>`;
        const newVideo = document.getElementById('videoPlayer');
        if (newVideo) {
            newVideo.src = url;
            newVideo.play().catch(e => console.log('Autoplay blocked:', e));
        }
        console.log('🎬 Menggunakan video tag untuk:', url);
    }

    // Update dropdown
    const select = document.getElementById('videoServer');
    if (select) select.value = index;
}
