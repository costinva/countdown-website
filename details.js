// details.js - UPGRADED FOR GUEST REVIEWS AND LAYOUT ADJUSTMENTS
window.addEventListener('DOMContentLoaded', async () => {
    const heroTitle = document.getElementById('hero-title');
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id'); // e.g., "movie-12345"

    // Set your actual worker URL here
    const API_URL = 'https://runup-api.veronica-vero2vv.workers.dev'; // <--- VERIFY THIS URL!

    if (!itemId) {
        heroTitle.textContent = 'Error: No item ID provided.';
        return;
    }

    try {
        const response = await fetch(`database/${itemId}.json`);
        if (!response.ok) throw new Error(`Could not find data file for ${itemId}`);
        const item = await response.json();
        
        populatePage(item); // Populates static details
        
        // Load reviews after populating the page
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
        // Target the comments section directly to display error, or hide it
        document.getElementById('comments-section').innerHTML = '<p>Could not load reviews at this time.</p>';
    }
}

function displayRatingSummary(guestSummary, userSummary) {
    const guestScoreCircle = document.getElementById('guest-score-circle');
    const userScoreCircle = document.getElementById('user-score-circle'); // Already handled in populatePage for static score

    if (!guestSummary || !userSummary) {
        document.getElementById('rating-summary').innerHTML = '<p>Could not load review summaries.</p>';
        return;
    }

    // Update Guest Score Circle
    if (guestSummary.totalReviews > 0) {
        const score = Math.round(parseFloat(guestSummary.averageRating) * 20); // Convert 1-5 to 0-100%
        guestScoreCircle.textContent = `${score}%`;
        if (score >= 70) guestScoreCircle.style.borderColor = '#21d07a';
        else if (score >= 40) guestScoreCircle.style.borderColor = '#d2d531';
        else guestScoreCircle.style.borderColor = '#db2360';
    } else {
        guestScoreCircle.textContent = 'N/A';
        guestScoreCircle.style.borderColor = '#555'; // Default border color
    }
    
    // Check if there are any reviews at all to display the "No reviews yet" message
    const ratingSummaryContainer = document.getElementById('rating-summary');
    if (guestSummary.totalReviews === 0 && userSummary.totalReviews === 0) {
        ratingSummaryContainer.innerHTML = '<p>No reviews yet. Be the first!</p>';
        return;
    }

    // This part builds the review breakdown specific to guest reviews
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

// Your old functions for populating the main page details (unchanged from last version)
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
    
    const userScoreCircle = document.getElementById('user-score-circle');
    if (item.score) {
        const score = Math.round(item.score || 0);
        userScoreCircle.textContent = `${score}%`;
        if (score >= 70) userScoreCircle.style.borderColor = '#21d07a';
        else if (score >= 40) userScoreCircle.style.borderColor = '#d2d531';
        else userScoreCircle.style.borderColor = '#db2360';
    } else {
        userScoreCircle.textContent = 'N/A';
        userScoreCircle.style.borderColor = '#555';
    }

    const movieTvInfo = document.getElementById('movie-tv-info');
    const gameInfo = document.getElementById('game-info');
    if (item.type === 'movie' || item.type === 'tv') {
        if (movieTvInfo) movieTvInfo.classList.remove('hidden');
        if (gameInfo) gameInfo.classList.add('hidden');
        document.getElementById('details-release-date').textContent = `Release: ${item.releaseDate || 'N/A'}`;
        document.getElementById('details-genres').textContent = (item.genres && item.genres.length > 0) ? item.genres.join(', ') : '';
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