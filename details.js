// details.js - FINAL VERSION WITH API-POWERED DETAILS, REVIEWS, AND 3 SCORE TYPES
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
        const response = await fetch(`${API_URL}/api/media/details/${itemId}`);
        if (!response.ok) {
            heroTitle.textContent = `Error: Could not find item ${itemId}.`;
            throw new Error(`Could not find item ${itemId} from API`);
        }
        const item = await response.json();
        
        populatePage(item);
        
        // Load and display reviews, passing API_URL
        await loadAndDisplayReviews(itemId, API_URL);
        setupReviewForm(itemId, API_URL);

    } catch (error) {
        console.error("A critical error occurred:", error);
        heroTitle.textContent = 'Error: Could not load data.';
    }
});

// --- NEW/MODIFIED --- Function to load and display reviews
async function loadAndDisplayReviews(itemId, API_URL) {
    try {
        const response = await fetch(`${API_URL}/api/reviews/${itemId}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();

        displayRatingSummary(data.summary.guest, data.summary.user);
        displayComments(data.comments);
        setupRatingBreakdownToggle(data.summary.guest, data.summary.user); // Setup the toggle
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('comments-section').innerHTML = '<p>Could not load reviews at this time.</p>';
    }
}

// --- MODIFIED --- Function to display rating summary for all three scores
function displayRatingSummary(guestSummary, userSummary) {
    const guestScoreCircle = document.getElementById('guest-score-circle');
    const userReviewsScoreCircle = document.getElementById('user-reviews-score-circle'); // New ID

    if (!guestSummary || !userSummary) {
        document.getElementById('rating-summary').innerHTML = '<p>Could not load review summaries.</p>';
        return;
    }

    // Update Guest Score Circle
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

    // Update User Reviews Score Circle (from logged-in users)
    if (userSummary.totalReviews > 0) {
        const score = Math.round(parseFloat(userSummary.averageRating) * 20);
        userReviewsScoreCircle.textContent = `${score}%`;
        if (score >= 70) userReviewsScoreCircle.style.borderColor = '#21d07a';
        else if (score >= 40) userReviewsScoreCircle.style.borderColor = '#d2d531';
        else userReviewsScoreCircle.style.borderColor = '#db2360';
    } else {
        userReviewsScoreCircle.textContent = 'N/A';
        userReviewsScoreCircle.style.borderColor = '#555';
    }
    
    const ratingSummaryContainer = document.getElementById('rating-summary');
    if (guestSummary.totalReviews === 0 && userSummary.totalReviews === 0) {
        ratingSummaryContainer.innerHTML = '<p>No reviews yet. Be the first!</p>';
        return;
    }

    // This part builds the summary for display.
    // We'll initially show guest reviews total, but the breakdown will be toggleable.
    ratingSummaryContainer.innerHTML = `
        <div class="rating-average" id="guest-average-display">
            <div class="average-score">${guestSummary.averageRating}</div>
            <div>
                <div>Based on</div>
                <div>${guestSummary.totalReviews} Guest Reviews</div>
            </div>
        </div>
        <div class="rating-breakdown-wrapper" id="guest-breakdown-wrapper">
            <h4>Guest Rating Breakdown</h4>
            <div class="rating-breakdown">
                ${generateBreakdownHtml(guestSummary.ratingCounts, guestSummary.totalReviews)}
            </div>
        </div>

        <div class="rating-average hidden" id="user-average-display">
            <div class="average-score">${userSummary.averageRating}</div>
            <div>
                <div>Based on</div>
                <div>${userSummary.totalReviews} User Reviews</div>
            </div>
        </div>
        <div class="rating-breakdown-wrapper hidden" id="user-breakdown-wrapper">
            <h4>User Rating Breakdown</h4>
            <div class="rating-breakdown">
                ${generateBreakdownHtml(userSummary.ratingCounts, userSummary.totalReviews)}
            </div>
        </div>
    `;
}

// --- NEW --- Helper to generate breakdown HTML
function generateBreakdownHtml(ratingCounts, totalReviews) {
    let html = '';
    for (let i = 5; i >= 1; i--) {
        const count = ratingCounts[i];
        const barPercent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        html += `
            <div class="rating-bar-row">
                <span>${i} ★</span>
                <div class="rating-bar"><div style="width: ${barPercent}%"></div></div>
                <span>${count}</span>
            </div>
        `;
    }
    return html;
}

// --- NEW --- Setup toggle for rating breakdown
function setupRatingBreakdownToggle(guestSummary, userSummary) {
    const guestAverageDisplay = document.getElementById('guest-average-display');
    const guestBreakdownWrapper = document.getElementById('guest-breakdown-wrapper');
    const userAverageDisplay = document.getElementById('user-average-display');
    const userBreakdownWrapper = document.getElementById('user-breakdown-wrapper');

    // Initially show guest breakdown if no user reviews
    if (guestSummary.totalReviews > 0) {
        guestBreakdownWrapper.classList.add('show');
    } else if (userSummary.totalReviews > 0) {
        userAverageDisplay.classList.remove('hidden');
        guestAverageDisplay.classList.add('hidden');
        userBreakdownWrapper.classList.add('show');
    }


    // Add click listeners to toggle
    if (guestAverageDisplay) {
        guestAverageDisplay.addEventListener('click', () => {
            if (guestSummary.totalReviews > 0) {
                guestBreakdownWrapper.classList.toggle('show');
            }
        });
    }
    if (userAverageDisplay) {
        userAverageDisplay.addEventListener('click', () => {
            if (userSummary.totalReviews > 0) {
                userBreakdownWrapper.classList.toggle('show');
            }
        });
    }
}


// --- Rest of details.js functions remain the same ---
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
                ${c.is_guest ? '<span class="guest-tag">Guest</span>' : '<span class="user-tag">User</span>'} <!-- Modified: User tag for logged-in users -->
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

function populatePage(item) {
    document.getElementById('hero-title').textContent = item.title || 'Title not available';
    document.getElementById('details-title').textContent = item.title || 'Title not available';
    document.getElementById('details-overview').textContent = item.overview || 'No overview available.';
    let posterUrl = item.posterImage;
    if (posterUrl && !posterUrl.startsWith('http') && (item.type === 'movie' || item.type === 'tv')) {
        posterUrl = `https://image.tmdb.org/t/p/w500${posterUrl}`;
    }
    if (posterUrl) document.getElementById('details-poster-img').src = posterUrl;
    
    const backdropsArray = item.backdrops ? JSON.parse(item.backdrops) : [];
    startBackdropSlideshow(backdropsArray, posterUrl, item.type);

    if (item.releaseDate) {
        const releaseDate = new Date(item.releaseDate);
        if (releaseDate > new Date()) { startCountdown(releaseDate); } 
        else { document.getElementById('hero-countdown').classList.add('hidden'); document.getElementById('hero-status').classList.remove('hidden'); }
    } else { document.getElementById('hero-countdown').classList.add('hidden'); document.getElementById('hero-status').classList.remove('hidden'); }
    
    const originalScoreCircle = document.getElementById('original-score-circle'); // NEW ID
    if (item.score !== undefined && item.score !== null) {
        const score = Math.round(item.score);
        originalScoreCircle.textContent = `${score}%`;
        if (score >= 70) originalScoreCircle.style.borderColor = '#21d07a';
        else if (score >= 40) originalScoreCircle.style.borderColor = '#d2d531';
        else originalScoreCircle.style.borderColor = '#db2360';
    } else {
        originalScoreCircle.textContent = '0%'; 
        originalScoreCircle.style.borderColor = '#555';
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
            if (item.systemRequirements) {
                requirementsDiv.innerHTML = item.systemRequirements;
            } else {
                requirementsDiv.textContent = 'No PC requirements available from API.';
            }
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
            currentIndex = (currentIndex + (Math.random() < 0.5 ? 1 : imageUrls.length - 1)) % imageUrls.length;
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