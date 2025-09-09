// script.js - FINAL VERSION WITH "SEE MORE" PAGINATION
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let allMedia = [];
    let currentPageItems = []; // The full list of items for the current page filter
    let itemsCurrentlyShown = 0;
    const ITEMS_PER_PAGE = 100;

    // --- ELEMENT SELECTORS ---
    const mainElement = document.querySelector('.grid-main');
    const countdownGrid = document.querySelector('.countdown-grid');
    const pageTitleElement = document.querySelector('.grid-title');
    const searchInput = document.getElementById('search-input');
    const gridHeader = document.querySelector('.grid-header');
    let seeMoreBtn; // Will be created dynamically

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    async function initializePage() {
        if (!pageTitleElement || !countdownGrid) return;
        originalPageTitle = pageTitleElement.textContent;
        createSeeMoreButton();
        try {
            const response = await fetch('database.json');
            if (!response.ok) throw new Error('database.json not found');
            allMedia = await response.json();
            
            filterAndSetInitialItems();
            renderMoreCards(true); // Initial render
            addGenresDropdownIfNeeded();
            setupEventListeners();
        } catch (error) {
            console.error("Initialization failed:", error);
            countdownGrid.innerHTML = "<p>Error loading page data.</p>";
        }
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================
    function setupEventListeners() {
        gridHeader.addEventListener('click', (event) => {
            if (event.target.classList.contains('genre-link')) {
                event.preventDefault();
                handleGenreFilter(event.target.dataset.genre);
            }
        });
        searchInput.addEventListener('input', handleSearch);
        countdownGrid.addEventListener('mouseenter', handleCardMouseEnter, true);
        countdownGrid.addEventListener('mouseleave', handleCardMouseLeave, true);
        seeMoreBtn.addEventListener('click', () => renderMoreCards(false));
    }
    
    // =========================================================================
    // FILTERING & SEARCH LOGIC
    // =========================================================================
    function handleGenreFilter(genre) {
        const baseItems = getBaseItemsForCurrentPage();
        currentPageItems = (genre === 'all')
            ? baseItems
            : baseItems.filter(item => (item.genres || []).includes(genre));
        renderMoreCards(true); // Reset and render the new filtered list
    }
    
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length > 2) {
             currentPageItems = allMedia.filter(item => item.title && item.title.toLowerCase().includes(query));
             pageTitleElement.textContent = `Search Results for "${searchInput.value}"`;
             renderMoreCards(true); // Reset and render search results
        } else if (query.length === 0) {
            pageTitleElement.textContent = originalPageTitle;
            filterAndSetInitialItems();
            renderMoreCards(true); // Reset to the original page view
        }
    }

    function filterAndSetInitialItems() {
        currentPageItems = getBaseItemsForCurrentPage();
    }
    
    function getBaseItemsForCurrentPage() {
        const pageTitle = originalPageTitle.toLowerCase();
        return allMedia.filter(item => {
            if (!item.releaseDate || !item.posterImage) return false;
            const isUpcoming = new Date(item.releaseDate) > new Date();
            const isMovie = item.type === 'movie';
            const isTv = item.type === 'tv';
            const isGame = item.type === 'game';
            if (pageTitle.includes('upcoming movies')) return isMovie && isUpcoming;
            if (pageTitle.includes('upcoming tv')) return isTv && isUpcoming;
            if (pageTitle.includes('upcoming games')) return isGame && isUpcoming;
            if (pageTitle.includes('launched movies')) return isMovie && !isUpcoming;
            if (pageTitle.includes('launched tv')) return isTv && !isUpcoming;
            if (pageTitle.includes('launched games')) return isGame && !isUpcoming;
            return false;
        });
    }

    // =========================================================================
    // RENDERING & HELPERS
    // =========================================================================
    function renderMoreCards(reset = false) {
        if (reset) {
            countdownGrid.innerHTML = '';
            itemsCurrentlyShown = 0;
        }

        const itemsToRender = currentPageItems.slice(itemsCurrentlyShown, itemsCurrentlyShown + ITEMS_PER_PAGE);

        if (itemsToRender.length === 0 && reset) {
            countdownGrid.innerHTML = "<p>No results found.</p>";
            seeMoreBtn.classList.add('hidden');
            return;
        }

        const cardsFragment = document.createDocumentFragment();
        itemsToRender.forEach(item => {
            const cardElement = createCardElement(item);
            if (cardElement) cardsFragment.appendChild(cardElement);
        });
        countdownGrid.appendChild(cardsFragment);
        itemsCurrentlyShown += itemsToRender.length;

        // Update the "See More" button visibility
        if (itemsCurrentlyShown < currentPageItems.length) {
            seeMoreBtn.classList.remove('hidden');
        } else {
            seeMoreBtn.classList.add('hidden');
        }

        initializeAllCountdowns();
    }

    function createCardElement(item) {
        if (!item || !item.title || !item.posterImage) return null;
        let posterUrl = item.posterImage;
        if ((item.type === 'movie' || item.type === 'tv') && posterUrl && !posterUrl.startsWith('http')) {
             posterUrl = `https://image.tmdb.org/t/p/w500${posterUrl}`;
        }
        const releaseDate = item.releaseDate || 'N/A';
        const isLaunched = new Date(releaseDate) < new Date();
        const tagType = (item.type || 'MEDIA').toUpperCase();
        const timerOrStatusHtml = isLaunched ? `<div class="card-status"><h4>Launched</h4></div>` : `<div class="card-timer"><div><span class="days">0</span><p>Days</p></div><div><span class="hours">0</span><p>Hours</p></div><div><span class="mins">0</span><p>Mins</p></div><div><span class="secs">0</span><p>Secs</p></div></div>`;
        const cardLink = document.createElement('a');
        cardLink.href = `details.html?id=${item.type}-${item.id}`;
        cardLink.className = 'countdown-card';
        cardLink.dataset.date = `${releaseDate}T12:00:00`;
        cardLink.dataset.poster = posterUrl;
        (item.screenshots || []).forEach((ss, i) => { cardLink.dataset[`ss${i}`] = ss; });
        cardLink.innerHTML = `<div class="card-bg" style="background-image: url('${posterUrl}')"></div><div class="card-overlay"></div><div class="card-content"><div class="card-tag">${tagType}</div><h3>${item.title}</h3>${timerOrStatusHtml}</div>`;
        return cardLink;
    }

    function createSeeMoreButton() {
        seeMoreBtn = document.createElement('button');
        seeMoreBtn.id = 'see-more-btn';
        seeMoreBtn.textContent = 'See More';
        seeMoreBtn.classList.add('hidden'); // Start hidden
        mainElement.appendChild(seeMoreBtn);
    }

    function addGenresDropdownIfNeeded() { /* ... function is unchanged ... */ }
    function initializeAllCountdowns() { /* ... function is unchanged ... */ }
    function handleCardMouseEnter(event) { /* ... function is unchanged ... */ }
    function handleCardMouseLeave(event) { /* ... function is unchanged ... */ }

    // --- PASTE THE UNCHANGED FUNCTIONS HERE ---
    function addGenresDropdownIfNeeded() {
        if (!gridHeader) return;
        const pageTitle = originalPageTitle.toLowerCase();
        if (!pageTitle.includes('movies') && !pageTitle.includes('tv') && !pageTitle.includes('games')) return;
        
        const movieTvGenres = ['Action', 'Horror', 'Comedy', 'Science Fiction', 'Romance', 'Fantasy', 'Drama'];
        const gameGenres = ['Action', 'RPG', 'Shooter', 'Strategy', 'Puzzle', 'Adventure', 'Indie', 'Simulation'];
        const genres = pageTitle.includes('games') ? gameGenres : movieTvGenres;

        let genreLinks = '<a href="#" class="genre-link" data-genre="all">All Genres</a>';
        genres.forEach(genre => { genreLinks += `<a href="#" class="genre-link" data-genre="${genre}">${genre}</a>`; });
        
        const dropdown = document.createElement('div');
        dropdown.className = 'genres-dropdown';
        dropdown.innerHTML = `<button class="genres-button">Genres ▼</button><div class="genres-list">${genreLinks}</div></div>`;
        
        // Avoid adding multiple dropdowns
        if (!gridHeader.querySelector('.genres-dropdown')) {
            gridHeader.appendChild(dropdown);
        }
    }
    
    function initializeAllCountdowns() {
        document.querySelectorAll('.countdown-card .card-timer').forEach(timerDiv => {
            const card = timerDiv.closest('.countdown-card');
            if (!card || card.dataset.countdownInitialized) return;
            card.dataset.countdownInitialized = 'true';
            const eventDate = new Date(card.dataset.date);
            const timerElements = { days: timerDiv.querySelector('.days'), hours: timerDiv.querySelector('.hours'), mins: timerDiv.querySelector('.mins'), secs: timerDiv.querySelector('.secs') };
            if (!timerElements.days) return;
            const updateCountdown = () => {
                const diff = eventDate.getTime() - new Date().getTime();
                if (diff <= 0) {
                    timerDiv.innerHTML = "<h4>Launched</h4>";
                    clearInterval(timer);
                    return;
                }
                timerElements.days.textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
                timerElements.hours.textContent = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
                timerElements.mins.textContent = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
                timerElements.secs.textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
            };
            const timer = setInterval(updateCountdown, 1000);
            updateCountdown();
        });
    }

    function handleCardMouseEnter(event) {
        const card = event.target.closest('.countdown-card');
        if (!card || card.dataset.ss0 === undefined) return;
        const screenshots = [];
        for (let i = 0; i < 4; i++) { if (card.dataset[`ss${i}`]) screenshots.push(card.dataset[`ss${i}`]); }
        if (screenshots.length <= 0) return;
        let currentIndex = 0;
        const bgElement = card.querySelector('.card-bg');
        const slideshowInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % screenshots.length;
            bgElement.style.backgroundImage = `url('${screenshots[currentIndex]}')`;
        }, 1500);
        card.dataset.slideshowInterval = slideshowInterval;
    }

    function handleCardMouseLeave(event) {
        const card = event.target.closest('.countdown-card');
        if (!card || !card.dataset.slideshowInterval) return;
        clearInterval(parseInt(card.dataset.slideshowInterval));
        card.removeAttribute('data-slideshow-interval');
        const bgElement = card.querySelector('.card-bg');
        bgElement.style.backgroundImage = `url('${card.dataset.poster}')`;
    }
    
    // --- KICK EVERYTHING OFF ---
    initializePage();
});