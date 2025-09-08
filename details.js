// details.js - FINAL VERSION that fetches individual files
window.addEventListener('DOMContentLoaded', async () => {
    const heroTitle = document.getElementById('hero-title');
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');

    if (!itemId) {
        heroTitle.textContent = 'Error: No item ID provided.';
        return;
    }

    try {
        // --- THIS IS THE CRITICAL CHANGE ---
        // Instead of fetching the big database, we fetch the specific file for this item.
        const response = await fetch(`database/${itemId}.json`);

        if (!response.ok) {
            throw new Error(`Could not find data file for ${itemId}`);
        }
        const item = await response.json(); // The file contains the data for our one item

        if (!item) {
            heroTitle.textContent = 'Error: Item data is invalid.';
            return;
        }
        
        populatePage(item);

    } catch (error) {
        console.error("A critical error occurred:", error);
        heroTitle.textContent = 'Error: Could not load data.';
    }
});


// --- (The rest of the file is IDENTICAL to the last correct version) ---
function populatePage(item) { /* ... same as before ... */ }
function startBackdropSlideshow(backdrops, posterImage, type) { /* ... same as before ... */ }
function startCountdown(eventDate) { /* ... same as before ... */ }

// PASTE THE FULL FUNCTIONS FROM THE PREVIOUS CORRECT VERSION HERE
function populatePage(item) {
    document.getElementById('hero-title').textContent = item.title || 'Title not available';
    document.getElementById('details-title').textContent = item.title || 'Title not available';
    document.getElementById('details-overview').textContent = item.overview || 'No overview available.';
    let posterUrl = item.posterImage;
    if ((item.type === 'movie' || item.type === 'tv') && posterUrl && !posterUrl.startsWith('http')) {
        posterUrl = `https://image.tmdb.org/t/p/w500${posterUrl}`;
    }
    if (posterUrl) document.getElementById('details-poster-img').src = posterUrl;
    startBackdropSlideshow(item.backdrops, item.posterImage, item.type);
    if (item.releaseDate) {
        const releaseDate = new Date(item.releaseDate);
        if (releaseDate > new Date()) { startCountdown(releaseDate); } 
        else { document.getElementById('hero-countdown').classList.add('hidden'); document.getElementById('hero-status').classList.remove('hidden'); }
    } else { document.getElementById('hero-countdown').classList.add('hidden'); document.getElementById('hero-status').classList.remove('hidden'); }
    const movieTvInfo = document.getElementById('movie-tv-info');
    const gameInfo = document.getElementById('game-info');
    if (item.type === 'movie' || item.type === 'tv') {
        if (movieTvInfo) movieTvInfo.classList.remove('hidden');
        if (gameInfo) gameInfo.classList.add('hidden');
        document.getElementById('details-release-date').textContent = `Release: ${item.releaseDate || 'N/A'}`;
        document.getElementById('details-genres').textContent = (item.genres && item.genres.length > 0) ? item.genres.join(', ') : '';
        const score = Math.round(item.score || 0);
        const scoreCircle = document.getElementById('details-score-circle');
        scoreCircle.textContent = `${score}%`;
        if (score >= 70) scoreCircle.style.borderColor = '#21d07a';
        else if (score >= 40) scoreCircle.style.borderColor = '#d2d531';
        else scoreCircle.style.borderColor = '#db2360';
    } else if (item.type === 'game') {
        if (gameInfo) gameInfo.classList.remove('hidden');
        if (movieTvInfo) movieTvInfo.classList.add('hidden');
        const requirementsDiv = document.getElementById('system-requirements');
        if (requirementsDiv) {
            if (item.systemRequirements) { requirementsDiv.innerHTML = item.systemRequirements; } 
            else { requirementsDiv.textContent = 'No PC requirements available.'; }
        }
    }
}
function startBackdropSlideshow(backdrops, posterImage, type) {
    const backdropElement = document.getElementById('hero-backdrop');
    const buildFullUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        if (type === 'movie' || type === 'tv') return `https://image.tmdb.org/t/p/original${path}`;
        return null;
    };
    const imageUrls = (backdrops || []).map(buildFullUrl).filter(Boolean);
    const fallbackUrl = buildFullUrl(posterImage);
    if (imageUrls.length > 0) {
        let currentIndex = 0;
        const changeBackdrop = () => {
            backdropElement.style.backgroundImage = `url('${imageUrls[currentIndex]}')`;
            currentIndex = (currentIndex + 1) % imageUrls.length;
        };
        changeBackdrop();
        setInterval(changeBackdrop, 7000);
    } else if (fallbackUrl) {
        backdropElement.style.backgroundImage = `url('${fallbackUrl}')`;
        backdropElement.classList.add('fallback-blur');
    }
}
function startCountdown(eventDate) {
    const daysEl = document.getElementById('hero-days');
    const hoursEl = document.getElementById('hero-hours');
    const minsEl = document.getElementById('hero-mins');
    const secsEl = document.getElementById('hero-secs');
    const update = () => {
        const diff = eventDate.getTime() - new Date().getTime();
        if (diff <= 0) {
            clearInterval(timer);
            document.getElementById('hero-countdown').classList.add('hidden');
            document.getElementById('hero-status').classList.remove('hidden');
            return;
        }
        daysEl.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
        hoursEl.textContent = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
        minsEl.textContent = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
        secsEl.textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
    };
    const timer = setInterval(update, 1000);
    update();
}