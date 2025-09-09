// details.js - FINAL VERSION WITH API-POWERED DETAILS AND REVIEWS
document.addEventListener('DOMContentLoaded', async () => {
    const heroTitle = document.getElementById('hero-title');
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id'); // e.g., "movie-12345"

    const API_URL = 'https://runup-api.veronica-vero2vv.workers.dev'; // <--- VERIFY YOUR WORKER URL!

    if (!itemId) {
        heroTitle.textContent = 'Error: No item ID provided.';
        return;
    }

    try {
        // --- CRITICAL CHANGE: Fetch item details from API instead of local /database/ folder ---
        const response = await fetch(`${API_URL}/api/media/details/${itemId}`);
        if (!response.ok) {
            heroTitle.textContent = `Error: Could not find item ${itemId}.`;
            throw new Error(`Could not find item ${itemId} from API`);
        }
        const item = await response.json();
        
        populatePage(item); // Populates static details from API data
        
        await loadAndDisplayReviews(itemId, API_URL);
        setupReviewForm(itemId, API_URL);

    } catch (error) {
        console.error("A critical error occurred:", error);
        heroTitle.textContent = 'Error: Could not load data.';
    }
});

async function loadAndDisplayReviews(itemId, API_URL) {
    try {
        const response = await fetch(`${API_URL}/api/reviews/${itemId}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();

        displayRatingSummary(data.summary.guest, data.summary.user);
        displayComments(data.comments);
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('comments-section').innerHTML = '<p>Could not load reviews at this time.</p>';
    }
}

function displayRatingSummary(guestSummary, userSummary) {
    const guestScoreCircle = document.getElementById('guest-score-circle');
    const userScoreCircle = document.getElementById('user-score-circle');

    if (!guestSummary || !userSummary) {
        document.getElementById('rating-summary').innerHTML = '<p>Could not load review summaries.</p>';
        return;
    }

    if (guestSummary.totalReviews > 0) {
        const score = Math.round(parseFloat(guestSummary.averageRating) * 20);
        guestScoreCircle.textContent = `${score}%`;
        if (score >= 70) guestScoreCircle.style.borderColor = '#21d07a';
        else if (score >= 40) guestScoreCircle.style.borderColor = '#d2d531';
        else guestScoreCircle.style.borderColor = '#db2360';
    } else {
        guestScoreCircle.textContent = 'N/A';
        guestScoreCircle.style.borderColor = '#555';
    }
    
    const ratingSummaryContainer = document.getElementById('rating-summary');
    if (guestSummary.totalReviews === 0 && userSummary.totalReviews === 0) {
        ratingSummaryContainer.innerHTML = '<p>No reviews yet. Be the first!</p>';
        return;
    }

    let breakdownHtml = '';
    for (let i = 5; i >= 1; i--) {
        const count = guestSummary.ratingCounts[i];
        const barPercent = guestSummary.totalReviews > 0 ? (count / guestSummary.totalReviews) * 100 : 0;
        breakdownHtml += `
            <div class="rating-bar-row">
                <span>${i} ★</span>
                <div class="rating-bar"><div style="width: ${barPercent}%"></div></div>
                <span>${count}</span>
            </div>
        `;
    }

    ratingSummaryContainer.innerHTML = `
        <div class="rating-average">
            <div class="average-score">${guestSummary.averageRating}</div>
            <div>
                <div>Based on</div>
                <div>${guestSummary.totalReviews} Guest Reviews</div>
            </div>
        </div>
        <div class="rating-breakdown">
            ${breakdownHtml}
        </div>
    `;
}

function displayComments(comments) {
    const container = document.getElementById('comments-list');
    if (!comments || comments.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = comments.map(c => `
        <div class="comment-card">
            <div class="comment-header">
                <span class="comment-author">${c.author}</span>
                ${c.is_guest ? '<span class="guest-tag">Guest</span>' : ''}
                <span class="comment-rating">${'★'.repeat(c.rating)}${'☆'.repeat(5 - c.rating)}</span>
            </div>
            <p class="comment-body">${c.comment || ''}</p>
            <div class="comment-footer">
                <span>${new Date(c.timestamp).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

function setupReviewForm(itemId, API_URL) {
    const form = document.getElementById('review-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const author = document.getElementById('author-name').value;
        const rating = form.querySelector('input[name="rating"]:checked')?.value;
        const comment = document.getElementById('comment-text').value;

        if (!rating) {
            alert('Please select a star rating.');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId,
                    author,
                    rating: parseInt(rating),
                    comment
                })
            });

            if (!response.ok) throw new Error('Failed to submit review');
            
            form.reset();
            await loadAndDisplayReviews(itemId, API_URL);

        } catch (error) {
            console.error('Error submitting review:', error);
            alert('There was an error submitting your review. Please try again.');
        }
    });
}

// Your old functions for populating the main page details (modified for API data)
function populatePage(item) {
    document.getElementById('hero-title').textContent = item.title || 'Title not available';
    document.getElementById('details-title').textContent = item.title || 'Title not available';
    document.getElementById('details-overview').textContent = item.overview || 'No overview available.';
    let posterUrl = item.posterImage;
    // No longer prepending TMDB path as D1 stores full URLs if provided, or direct paths.
    // Ensure your D1 'posterImage' column contains full URLs or relative paths that your frontend can resolve.
    // If it's a TMDB path, it needs to be modified here or in the data population script.
    if (posterUrl && !posterUrl.startsWith('http') && (item.type === 'movie' || item.type === 'tv')) {
        posterUrl = `https://image.tmdb.org/t/p/w500${posterUrl}`; // Re-add if D1 stores only paths
    }

    if (posterUrl) document.getElementById('details-poster-img').src = posterUrl;
    // Backdrops and screenshots are not directly in D1 'media' table.
    // If needed, the API /api/media/details/:itemId would need to fetch them
    // from external APIs or a separate D1 table.
    // For now, startBackdropSlideshow uses local/static data or a fallback.
    startBackdropSlideshow([], posterUrl, item.type); // Pass empty array for backdrops

    if (item.releaseDate) {
        const releaseDate = new Date(item.releaseDate);
        if (releaseDate > new Date()) { startCountdown(releaseDate); } 
        else { document.getElementById('hero-countdown').classList.add('hidden'); document.getElementById('hero-status').classList.remove('hidden'); }
    } else { document.getElementById('hero-countdown').classList.add('hidden'); document.getElementById('hero-status').classList.remove('hidden'); }
    
    const userScoreCircle = document.getElementById('user-score-circle');
    // TMDB/RAWG score (from item.score) is not in D1 'media' table.
    // If needed, extend D1 'media' table with a 'score' column and populate it.
    // For now, userScoreCircle will likely show 'N/A'.
    userScoreCircle.textContent = 'N/A'; // Default to N/A as score is not in D1 'media' table
    userScoreCircle.style.borderColor = '#555';

    const movieTvInfo = document.getElementById('movie-tv-info');
    const gameInfo = document.getElementById('game-info');
    if (item.type === 'movie' || item.type === 'tv') {
        if (movieTvInfo) movieTvInfo.classList.remove('hidden');
        if (gameInfo) gameInfo.classList.add('hidden');
        document.getElementById('details-release-date').textContent = `Release: ${item.releaseDate || 'N/A'}`;
        // Ensure genres from D1 are handled. If stored as comma-separated string, it will work.
        document.getElementById('details-genres').textContent = (item.genres && item.genres.length > 0) ? item.genres.join(', ') : '';
    } else if (item.type === 'game') {
        if (gameInfo) gameInfo.classList.remove('hidden');
        if (movieTvInfo) movieTvInfo.classList.add('hidden');
        // System requirements are not in D1 'media' table.
        // If needed, extend D1 'media' table or fetch from external APIs.
        const requirementsDiv = document.getElementById('system-requirements');
        if (requirementsDiv) {
            requirementsDiv.textContent = 'No PC requirements available from API.';
        }
    }
}

function startBackdropSlideshow(backdrops, posterImage, type) {
    const backdropElement = document.getElementById('hero-backdrop');
    const buildFullUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // This logic assumes posterImage from D1 is either a full URL or a TMDB/RAWG relative path
        if (type === 'movie' || type === 'tv') return `https://image.tmdb.org/t/p/original${path}`;
        return null; // Fallback for game poster if not a full URL
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